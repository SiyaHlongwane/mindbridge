import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import Button from './Button'

const ROLE_DESTINATIONS = {
  individual: '/dashboard',
  professional: '/professional',
  primary_care: '/primary-care',
  coordinator: '/coordinator',
  admin: '/admin',
  analyst: '/analytics',
}

function readAuthCallbackError() {
  if (typeof window === 'undefined') return ''
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return (
    hashParams.get('error_description') ||
    searchParams.get('error_description') ||
    hashParams.get('error') ||
    searchParams.get('error') ||
    ''
  )
}

export default function AuthForm({ register = false }) {
  const {
    session,
    role,
    loading,
    demoMode,
    configError,
    passwordRecovery,
    signIn,
    signUp,
    sendMagicLink,
    resendConfirmation,
    demoSignIn,
    resetPassword,
    updateRecoveryPassword,
  } = useAuth()
  const { lang } = useI18n()
  const isAr = lang === 'ar'
  const [error, setError] = useState(() => readAuthCallbackError())
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [canResendConfirmation, setCanResendConfirmation] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const navigate = useNavigate()

  if (!loading && session && !passwordRecovery) {
    return <Navigate to={ROLE_DESTINATIONS[role] || '/dashboard'} replace />
  }

  async function submitRecoveryUpdate(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const newPassword = form.get('recoveryPassword')
    const confirm = form.get('recoveryConfirm')
    if (!newPassword || newPassword.length < 8) {
      return setError('Use a new password with at least 8 characters.')
    }
    if (newPassword !== confirm) {
      return setError('The passwords do not match.')
    }
    setBusy(true)
    try {
      const { error: updateErr } = await updateRecoveryPassword(newPassword)
      if (updateErr) throw updateErr
      navigate(ROLE_DESTINATIONS[role] || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to update your password.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setCanResendConfirmation(false)
    const form = new FormData(event.currentTarget)
    const email = form.get('email').trim()
    const password = form.get('password')
    const name = form.get('fullName')?.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.')
    }
    if (!password || (register && password.length < 8)) {
      return setError(register ? 'Use a password with at least 8 characters.' : 'Please enter your password.')
    }
    if (register && !name) return setError('Please enter your full name.')
    if (register && password !== form.get('confirmPassword')) return setError('The passwords do not match.')
    setBusy(true)
    try {
      const { data, error: authError } = register ? await signUp(email, password, name) : await signIn(email, password)
      if (authError) throw authError
      if (data?.session) {
        const nextRole = data.role || data.user?.user_metadata?.role || role
        navigate(register ? '/consent' : ROLE_DESTINATIONS[nextRole] || '/dashboard', { replace: true })
      } else if (register && data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError('An account with this email already exists. Try logging in or resetting your password.')
      } else {
        setCanResendConfirmation(true)
        setMessage('Account created! Check your email inbox and click the confirmation link before logging in.')
      }
    } catch (err) {
      const msg = err.message || 'We could not connect. Please try again.'
      if (/secret API key/i.test(msg)) {
        setError('Supabase rejected VITE_SUPABASE_ANON_KEY because a secret/service_role key was used instead of the public Publishable / anon key. Replace VITE_SUPABASE_ANON_KEY with your sb_publishable_... (or anon) key and rotate the secret key in Supabase.')
      } else if (/email not confirmed/i.test(msg)) {
        setCanResendConfirmation(true)
        setError('Your email address has not been confirmed yet. Check your inbox or click "Resend confirmation email" below.')
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    setError('')
    setMessage('')
    const email = emailInput.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError('Enter your email address above first.')
    }
    setBusy(true)
    try {
      const { error: resendErr } = await resendConfirmation(email)
      if (resendErr) throw resendErr
      setMessage(`Confirmation email resent to ${email}. Open the link in your email to activate your account.`)
    } catch (err) {
      setError(err.message || 'Unable to resend confirmation email.')
    } finally {
      setBusy(false)
    }
  }

  async function handleMagicLink() {
    setError('')
    setMessage('')
    const email = emailInput.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError('Enter your email address above first to receive a magic sign-in link.')
    }
    setBusy(true)
    try {
      const { error: otpErr } = await sendMagicLink(email)
      if (otpErr) throw otpErr
      setMessage(`Sign-in link sent to ${email}. Check your inbox and open the link in this browser.`)
    } catch (err) {
      setError(err.message || 'Unable to send magic sign-in link.')
    } finally {
      setBusy(false)
    }
  }

  async function submitReset(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const email = form.get('resetEmail').trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError('Please enter a valid account email address.')
    }
    const newPassword = form.get('newPassword')
    if (demoMode && (!newPassword || newPassword.length < 8)) {
      return setError('Enter your email and a new password of at least 8 characters.')
    }
    setBusy(true)
    try {
      const { error: resetErr } = await resetPassword(email, newPassword)
      if (resetErr) throw resetErr
      setShowReset(false)
      setMessage(
        demoMode
          ? 'Password updated. You can now log in with your new password.'
          : `Password reset email sent to ${email}. Open the link in your email to choose a new password.`
      )
    } catch (err) {
      setError(err.message || 'Unable to reset password.')
    } finally {
      setBusy(false)
    }
  }

  async function quickLogin(targetRole) {
    setError('')
    setBusy(true)
    try {
      const { error: authError } = await demoSignIn(targetRole)
      if (authError) throw authError
      navigate(ROLE_DESTINATIONS[targetRole] || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to switch to demo account.')
    } finally {
      setBusy(false)
    }
  }

  if (passwordRecovery) {
    return (
      <section className="auth-card card">
        <p className="eyebrow">Account recovery</p>
        <h1>Set a new password</h1>
        <p>Enter a new password (at least 8 characters) to finish recovering your account.</p>
        <form onSubmit={submitRecoveryUpdate} noValidate>
          <label>
            New password
            <input name="recoveryPassword" type="password" minLength={8} required disabled={busy} />
          </label>
          <label>
            Confirm new password
            <input name="recoveryConfirm" type="password" minLength={8} required disabled={busy} />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? 'Updating…' : 'Save new password'}
          </Button>
        </form>
      </section>
    )
  }

  return (
    <section className="auth-card card">
      <p className="eyebrow">{isAr ? 'خطوة آمنة لرفاهك' : 'A small step for yourself'}</p>
      <h1>{register ? (isAr ? 'إنشاء حساب جديد' : 'Create your MindBridge AI account') : isAr ? 'مرحباً بعودتك' : 'Welcome back'}</h1>
      <p>
        {register
          ? isAr
            ? 'ابدأ رحلتك بسرية تامة — أنت تتحكم فيما تشاركه.'
            : 'Begin your MindBridge AI journey. You control every consent choice.'
          : isAr
            ? 'سجّل الدخول إلى مساحتك الخاصة.'
            : 'Log in to your wellbeing or clinical role workspace.'}
      </p>

      {configError && (
        <p className="error" role="alert">
          {configError}
        </p>
      )}

      {demoMode && (
        <div className="notice" role="status">
          <strong>{isAr ? 'دخول فوري للأدوار الستة (بيانات تجريبية)' : 'Preview role workspaces (synthetic demo data)'}</strong>
          <div className="actions demo-actions">
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('individual')}>
              Individual (Amira)
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('professional')}>
              Mental Health Clinician
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('primary_care')}>
              Primary Care Physician
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('coordinator')}>
              Care Coordinator
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('admin')}>
              System Admin
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => quickLogin('analyst')}>
              Population Analyst
            </Button>
          </div>
          {!register && (
            <p className="muted">
              Demo password: <code>password123</code> (e.g., <code>amira@mindbridge.demo</code>, <code>dr.tariq@mindbridge.demo</code>). Live Supabase sign-in activates automatically once <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are configured in your deployment environment.
            </p>
          )}
        </div>
      )}

      {!showReset ? (
        <form onSubmit={submit} noValidate>
          {register && (
            <label>
              {isAr ? 'الاسم الكامل' : 'Full name'}
              <input name="fullName" autoComplete="name" required maxLength={120} />
            </label>
          )}
          <label>
            {isAr ? 'البريد الإلكتروني' : 'Email address'}
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
            />
          </label>
          <label>
            {isAr ? 'كلمة المرور' : 'Password'}
            <input
              name="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              minLength={register ? 8 : undefined}
              aria-describedby={register ? 'password-help' : undefined}
            />
          </label>
          {register && (
            <>
              <small id="password-help">Use at least 8 characters.</small>
              <label>
                {isAr ? 'تأكيد كلمة المرور' : 'Confirm password'}
                <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
              </label>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          <div className="actions">
            <Button type="submit" disabled={busy || loading}>
              {busy ? 'Please wait…' : register ? (isAr ? 'إنشاء حساب' : 'Create account') : isAr ? 'دخول' : 'Log in'}
            </Button>
            {!demoMode && !register && (
              <Button className="button-secondary" disabled={busy || loading} onClick={handleMagicLink}>
                Email magic link
              </Button>
            )}
            {!demoMode && canResendConfirmation && (
              <Button className="button-secondary" disabled={busy || loading} onClick={handleResend}>
                Resend confirmation email
              </Button>
            )}
          </div>
        </form>
      ) : (
        <form onSubmit={submitReset} noValidate>
          <label>
            Account email
            <input name="resetEmail" type="email" required defaultValue={emailInput} />
          </label>
          {demoMode && (
            <label>
              New password (min 8 chars)
              <input name="newPassword" type="password" minLength={8} required />
            </label>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <Button type="submit" disabled={busy}>
              {demoMode ? 'Reset password' : 'Send reset email'}
            </Button>
            <Button className="button-secondary" disabled={busy} onClick={() => setShowReset(false)}>
              Back to login
            </Button>
          </div>
        </form>
      )}

      {!register && !showReset && (
        <p>
          <button type="button" className="tier-link" onClick={() => setShowReset(true)}>
            {isAr ? 'إعادة تعيين كلمة المرور' : 'Forgot or reset password'}
          </button>
        </p>
      )}

      <p className="muted">
        {register ? (isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?') : isAr ? 'جديد في مايند بريدج AI؟' : 'New to MindBridge AI?'}{' '}
        <Link to={register ? '/login' : '/register'}>{register ? (isAr ? 'تسجيل الدخول' : 'Log in') : isAr ? 'إنشاء حساب' : 'Create an account'}</Link>
      </p>
      <Link to="/privacy">{isAr ? 'اقرأ نهج الخصوصية' : 'Read our privacy approach'}</Link>
    </section>
  )
}
