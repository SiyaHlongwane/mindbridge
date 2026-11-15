import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { setConsent, withdrawSharing } from '../services/consentService'
import Button from '../components/Button'

export default function Consent() {
  const { user, consents, consentsLoading, consentError, refreshConsents } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!data.has('terms')) return setError('Please confirm that you understand and agree to continue.')
    setBusy(true); setError('')
    try {
      for (const type of ['share_results', 'share_contact']) {
        if (data.has(type)) await setConsent(user.id, type, true)
        else await withdrawSharing(user.id, type)
      }
      await setConsent(user.id, 'terms', true)
      await refreshConsents()
      navigate('/dashboard', { replace: true })
    } catch (error) { setError(`${error.message || 'Unable to save preferences.'} Some changes may have saved. Please try again.`) }
    finally { setBusy(false) }
  }

  return <section className="page-intro"><p className="eyebrow">YOUR CHOICE, AT EVERY STEP</p><h1>Before we begin</h1><div className="card">
    <p>Assessments are voluntary screening tools, not a diagnosis. You can choose whether to complete one.</p>
    <p>We store your account profile, consent choices, assessment answers, screening results and the referral information you submit, including optional notes and sharing choices.</p>
    <p>Your assessment results are visible to you, and to an assigned professional only when a referral to them has results sharing on. Your profile name is visible to an assigned professional only when a referral to them has contact sharing on. Administrators have access for platform oversight.</p>
    <p>You can withdraw optional sharing at any time on the Privacy page. This updates active referrals, but cannot undo information already seen.</p>
    <p>MindBridge is not an emergency service. For urgent-help guidance, see the “Need urgent help?” banner at the bottom of the page. Its emergency contact is awaiting verification.</p>
    {consentsLoading ? <p role="status">Loading your preferences…</p> : <form className="consent-form" onSubmit={submit}>
      {consentError && <p className="error" role="alert">{consentError} You can retry saving your choices below.</p>}
      <label className="check-label"><input type="checkbox" name="terms" required defaultChecked={consents.terms === true} disabled={busy} />I understand and agree</label>
      <label className="check-label"><input type="checkbox" name="share_results" defaultChecked={consents.share_results === true} disabled={busy} />Share my assessment results with professionals I'm referred to</label>
      <label className="check-label"><input type="checkbox" name="share_contact" defaultChecked={consents.share_contact === true} disabled={busy} />Share my name/contact with professionals I'm referred to</label>
      <p className="muted">Sharing is optional. Your referral sharing choices control assigned professionals’ access to your profile name and assessment results.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Continue'}</Button>
    </form>}
  </div></section>
}
