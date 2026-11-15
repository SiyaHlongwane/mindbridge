import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import Button from './Button'

export default function AuthForm({ register = false }) {
  const { session, loading, configured, signIn, signUp } = useAuth()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  if (!loading && session) return <Navigate to="/dashboard" replace />
  async function submit(event) {
    event.preventDefault()
    setError(''); setMessage('')
    const form = new FormData(event.currentTarget)
    const email = form.get('email').trim()
    const password = form.get('password')
    const name = form.get('fullName')?.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address.')
    if (!password || (register && password.length < 8)) return setError(register ? 'Use a password with at least 8 characters.' : 'Please enter your password.')
    if (register && !name) return setError('Please enter your full name.')
    if (register && password !== form.get('confirmPassword')) return setError('The passwords do not match.')
    setBusy(true)
    try {
      const { data, error } = register ? await signUp(email, password, name) : await signIn(email, password)
      if (error) throw error
      if (data.session) navigate('/dashboard', { replace: true })
      else setMessage('Check your email to confirm your account before logging in.')
    } catch (error) { setError(error.message || 'We could not connect. Please try again.') }
    finally { setBusy(false) }
  }
  return <section className="auth-card card"><p className="eyebrow">A SMALL STEP FOR YOURSELF</p><h1>{register ? 'Create your account' : 'Welcome back'}</h1><p>{register ? 'Begin your MindBridge journey. You choose what to share.' : 'Log in to your personal wellbeing space.'}</p>
    {!configured && <div className="notice" role="status"><strong>Supabase not configured</strong><p>Account access will be available once the secure connection is set up. Please check back soon.</p></div>}
    <form onSubmit={submit}>
      {register && <label>Full name<input name="fullName" autoComplete="name" required maxLength={120} /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : undefined} aria-describedby={register ? 'password-help' : undefined} /></label>
      {register && <><small id="password-help">Use at least 8 characters.</small><label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} /></label></>}
      {error && <p className="error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
      <Button type="submit" disabled={!configured || busy || loading}>{busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}</Button>
    </form><p className="muted">{register ? 'Already have an account?' : 'New to MindBridge?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p><Link to="/privacy">Read our privacy approach</Link>
  </section>
}
