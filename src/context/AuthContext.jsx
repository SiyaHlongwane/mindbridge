import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './auth'
import { getConsentRecords } from '../services/consentService'

async function loadConsents(id) {
  const rows = await getConsentRecords(id)
  return { userId: id, values: Object.fromEntries(rows.map(row => [row.consent_type, row.granted])), dates: Object.fromEntries(rows.map(row => [row.consent_type, row.updated_at])), error: '' }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ session: null, profile: null, role: 'individual', loading: Boolean(supabase), profileError: '' })
  const [consentState, setConsentState] = useState({ userId: null, values: {}, dates: {}, error: '' })
  const userId = auth.session?.user.id

  useEffect(() => {
    let active = true
    const request = userId ? loadConsents(userId) : Promise.resolve({ userId: null, values: {}, dates: {}, error: '' })
    request.then(state => { if (active) setConsentState(state) }).catch(error => {
      if (active) setConsentState({ userId, values: {}, dates: {}, error: error.message || 'Unable to load your consent preferences.' })
    })
    return () => { active = false }
  }, [userId])

  async function refreshConsents() {
    if (userId) setConsentState(await loadConsents(userId))
  }

  useEffect(() => {
    let active = true
    let revision = 0
    async function updateSession(session) {
      const current = ++revision
      setAuth({ session, profile: null, role: 'individual', loading: Boolean(session), profileError: '' })
      if (!session) return
      try {
        const { data, error } = await supabase.from('profiles').select('id, full_name, role').eq('id', session.user.id).maybeSingle()
        if (error) throw error
        if (active && current === revision) setAuth({ session, profile: data, role: data?.role || 'individual', loading: false, profileError: '' })
      } catch {
        if (active && current === revision) setAuth({ session, profile: null, role: 'individual', loading: false, profileError: 'Your profile could not be loaded. Please try signing in again.' })
      }
    }
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { if (active) void updateSession(session) }, 0)
    })
    const initialRevision = revision
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && revision === initialRevision) {
        if (error) setAuth(previous => ({ ...previous, loading: false, profileError: error.message }))
        else void updateSession(data.session)
      }
    }).catch(() => {
      if (active && revision === initialRevision) setAuth(previous => ({ ...previous, loading: false, profileError: 'Unable to restore your session. Please sign in again.' }))
    })
    return () => { active = false; revision++; subscription.unsubscribe() }
  }, [])

  function client() {
    if (!supabase) throw new Error('Supabase not configured. Please try again after setup.')
    return supabase
  }

  const value = {
    ...auth,
    user: auth.session?.user ?? null,
    configured: Boolean(supabase),
    consents: consentState.userId === userId ? consentState.values : {},
    consentDates: consentState.userId === userId ? consentState.dates : {},
    consentError: consentState.userId === userId ? consentState.error : '',
    consentsLoading: Boolean(userId && consentState.userId !== userId),
    refreshConsents,
    signUp: (email, password, fullName) => client().auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
    signIn: (email, password) => client().auth.signInWithPassword({ email, password }),
    signOut: () => client().auth.signOut(),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
