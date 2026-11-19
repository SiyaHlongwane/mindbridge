import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseKeyError } from '../lib/supabase'
import {
  buildDemoSession,
  demoResetPassword,
  demoSignIn,
  demoSignInAsRole,
  demoSignOut,
  demoSignUp,
  getDemoSessionUserId,
  loadDemoDb,
} from '../lib/demoStore'
import { AuthContext } from './auth'
import { getConsentRecords } from '../services/consentService'

const PROFILE_FIELDS = 'id, email, full_name, role, physical_context, equity'

async function loadConsents(id) {
  const rows = await getConsentRecords(id)
  return {
    userId: id,
    values: Object.fromEntries(rows.map(row => [row.consent_type, row.granted])),
    dates: Object.fromEntries(rows.map(row => [row.consent_type, row.updated_at])),
    error: '',
  }
}

function fallbackProfileFromSession(session) {
  return {
    id: session.user.id,
    email: session.user.email || '',
    full_name: session.user.user_metadata?.full_name || '',
    role: 'individual',
    physical_context: null,
    equity: {},
  }
}

async function fetchOrProvisionProfile(session) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', session.user.id)
    .maybeSingle()
  if (error) throw error
  if (data) return data

  const seed = {
    id: session.user.id,
    email: session.user.email || null,
    full_name: session.user.user_metadata?.full_name || null,
    role: 'individual',
  }
  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .upsert(seed, { onConflict: 'id' })
    .select(PROFILE_FIELDS)
    .maybeSingle()
  if (!insertError && created) return created
  return fallbackProfileFromSession(session)
}

function loadDemoProfileState(userId) {
  if (!userId) return { session: null, profile: null, role: 'individual', loading: false, profileError: '' }
  const db = loadDemoDb()
  const user = db.users.find(u => u.id === userId)
  if (!user) return { session: null, profile: null, role: 'individual', loading: false, profileError: '' }
  return {
    session: buildDemoSession(user),
    profile: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      physical_context: user.physical_context || null,
      equity: user.equity || {},
    },
    role: user.role || 'individual',
    loading: false,
    profileError: '',
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() =>
    supabase
      ? { session: null, profile: null, role: 'individual', loading: true, profileError: '' }
      : loadDemoProfileState(getDemoSessionUserId())
  )
  const [consentState, setConsentState] = useState({ userId: null, values: {}, dates: {}, error: '' })
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const userId = auth.session?.user.id

  useEffect(() => {
    let active = true
    const request = userId ? loadConsents(userId) : Promise.resolve({ userId: null, values: {}, dates: {}, error: '' })
    request
      .then(state => {
        if (active) setConsentState(state)
      })
      .catch(error => {
        if (active) setConsentState({ userId, values: {}, dates: {}, error: error.message || 'Unable to load your consent preferences.' })
      })
    return () => {
      active = false
    }
  }, [userId])

  const refreshConsents = useCallback(async () => {
    if (userId) setConsentState(await loadConsents(userId))
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    if (!supabase) {
      setAuth(loadDemoProfileState(userId))
      return
    }
    const { data, error } = await supabase.from('profiles').select(PROFILE_FIELDS).eq('id', userId).maybeSingle()
    if (!error && data) {
      setAuth(prev => ({ ...prev, profile: data, role: data.role || 'individual' }))
    }
  }, [userId])

  useEffect(() => {
    if (!supabase) return
    let active = true
    let revision = 0
    async function updateSession(session) {
      const current = ++revision
      if (!session) {
        setAuth({ session: null, profile: null, role: 'individual', loading: false, profileError: '' })
        return
      }
      setAuth(prev =>
        prev.session?.user.id === session.user.id && prev.profile
          ? { ...prev, session, loading: false }
          : { session, profile: null, role: 'individual', loading: true, profileError: '' }
      )
      try {
        const profile = await fetchOrProvisionProfile(session)
        if (active && current === revision) {
          setAuth({ session, profile, role: profile.role || 'individual', loading: false, profileError: '' })
        }
      } catch {
        if (active && current === revision) {
          setAuth({
            session,
            profile: fallbackProfileFromSession(session),
            role: 'individual',
            loading: false,
            profileError: 'Your profile details could not be loaded completely. Refresh to retry.',
          })
        }
      }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (event === 'SIGNED_OUT') setPasswordRecovery(false)
      setTimeout(() => {
        if (active) void updateSession(session)
      }, 0)
    })
    const initialRevision = revision
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && revision === initialRevision) {
          if (error) setAuth(previous => ({ ...previous, loading: false, profileError: error.message }))
          else void updateSession(data.session)
        }
      })
      .catch(() => {
        if (active && revision === initialRevision) {
          setAuth(previous => ({ ...previous, loading: false, profileError: 'Unable to restore your session. Please sign in again.' }))
        }
      })
    return () => {
      active = false
      revision++
      subscription.unsubscribe()
    }
  }, [])

  async function handleSignUp(email, password, fullName) {
    if (!supabase) {
      const result = demoSignUp(email, password, fullName)
      if (!result.error && result.data.user) setAuth(loadDemoProfileState(result.data.user.id))
      return result
    }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
    const res = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: fullName.trim() },
      },
    })
    if (!res.error && res.data?.session) {
      try {
        const profile = await fetchOrProvisionProfile(res.data.session)
        setAuth({ session: res.data.session, profile, role: profile.role || 'individual', loading: false, profileError: '' })
        res.data.role = profile.role || 'individual'
      } catch {
        const fallback = fallbackProfileFromSession(res.data.session)
        setAuth({ session: res.data.session, profile: fallback, role: 'individual', loading: false, profileError: '' })
        res.data.role = 'individual'
      }
    }
    return res
  }

  async function handleSignIn(email, password) {
    if (!supabase) {
      const result = demoSignIn(email, password)
      if (!result.error && result.data.user) setAuth(loadDemoProfileState(result.data.user.id))
      return result
    }
    const res = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (!res.error && res.data?.session) {
      try {
        const profile = await fetchOrProvisionProfile(res.data.session)
        setAuth({ session: res.data.session, profile, role: profile.role || 'individual', loading: false, profileError: '' })
        res.data.role = profile.role || 'individual'
      } catch {
        const fallback = fallbackProfileFromSession(res.data.session)
        setAuth({ session: res.data.session, profile: fallback, role: 'individual', loading: false, profileError: '' })
        res.data.role = 'individual'
      }
    }
    return res
  }

  async function handleMagicLink(email) {
    if (!supabase) {
      return { error: { message: 'Magic link email sign-in requires a connected Supabase project.' } }
    }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
    return supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })
  }

  async function handleResendConfirmation(email) {
    if (!supabase) {
      return { error: { message: 'Email confirmation is only required when connected to Supabase.' } }
    }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
    return supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })
  }

  async function handleDemoRoleSignIn(role) {
    const result = demoSignInAsRole(role)
    if (!result.error && result.data.user) setAuth(loadDemoProfileState(result.data.user.id))
    return result
  }

  async function handleResetPassword(email, newPassword) {
    if (!supabase) {
      return demoResetPassword(email, newPassword)
    }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
    return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
  }

  async function handleUpdateRecoveryPassword(newPassword) {
    if (!supabase) {
      setPasswordRecovery(false)
      return { error: null }
    }
    const res = await supabase.auth.updateUser({ password: newPassword })
    if (!res.error) setPasswordRecovery(false)
    return res
  }

  async function handleSignOut() {
    setPasswordRecovery(false)
    if (!supabase) {
      const result = demoSignOut()
      setAuth({ session: null, profile: null, role: 'individual', loading: false, profileError: '' })
      setConsentState({ userId: null, values: {}, dates: {}, error: '' })
      return result
    }
    const result = await supabase.auth.signOut()
    if (!result.error) {
      setAuth({ session: null, profile: null, role: 'individual', loading: false, profileError: '' })
      setConsentState({ userId: null, values: {}, dates: {}, error: '' })
    }
    return result
  }

  const value = {
    ...auth,
    user: auth.session?.user ?? null,
    configured: true,
    configError: supabaseKeyError,
    demoMode: !supabase,
    passwordRecovery,
    consents: consentState.userId === userId ? consentState.values : {},
    consentDates: consentState.userId === userId ? consentState.dates : {},
    consentError: consentState.userId === userId ? consentState.error : '',
    consentsLoading: Boolean(userId && consentState.userId !== userId),
    refreshConsents,
    refreshProfile,
    signUp: handleSignUp,
    signIn: handleSignIn,
    sendMagicLink: handleMagicLink,
    resendConfirmation: handleResendConfirmation,
    demoSignIn: handleDemoRoleSignIn,
    resetPassword: handleResetPassword,
    updateRecoveryPassword: handleUpdateRecoveryPassword,
    signOut: handleSignOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
