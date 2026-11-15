import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './auth'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ session: null, profile: null, role: 'individual', loading: Boolean(supabase), profileError: '' })

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
    signUp: (email, password, fullName) => client().auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
    signIn: (email, password) => client().auth.signInWithPassword({ email, password }),
    signOut: () => client().auth.signOut(),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
