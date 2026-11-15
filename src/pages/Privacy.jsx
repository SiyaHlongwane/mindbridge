import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { setConsent, withdrawSharing } from '../services/consentService'
import Button from '../components/Button'

const labels = {
  share_results: "Share my assessment results with professionals I'm referred to",
  share_contact: "Share my name/contact with professionals I'm referred to",
}

export default function Privacy() {
  const { user, loading, consents, consentDates, consentsLoading, consentError, refreshConsents } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function toggle(type, granted) {
    setBusy(true); setError(''); setMessage('')
    try {
      if (granted) await setConsent(user.id, type, true)
      else await withdrawSharing(user.id, type)
      await refreshConsents()
      setMessage(granted ? 'Your sharing preference has been saved. Existing referrals are not automatically opted in.' : 'Sharing withdrawn. All your pending, accepted and appointment-scheduled referrals were updated.')
    } catch (error) {
      setError(`${error.message || 'Unable to save your preference.'} Some changes may have saved. Please retry.`)
    } finally { setBusy(false) }
  }
  async function retry() {
    setBusy(true); setError('')
    try { await refreshConsents() } catch (error) { setError(error.message || 'Unable to load preferences.') }
    finally { setBusy(false) }
  }
  function date(type) { return consentDates[type] ? new Date(consentDates[type]).toLocaleString() : 'Not recorded' }
  return <section className="page-intro"><p className="eyebrow">YOUR INFORMATION, YOUR CHOICES</p><h1>Privacy comes first.</h1><div className="card">
    <p>We store your profile, consent choices, assessment answers, screening results and the referral information you choose to submit, including optional notes and sharing choices. Screening is voluntary and is not a diagnosis.</p>
    <p>You control optional assessment-results sharing with assigned professionals. Administrators have oversight access. Assigned professionals can currently view your profile name regardless of the contact-sharing preference; that preference is not a guarantee of profile-name confidentiality.</p>
    <p>Withdrawing sharing updates active referrals. It cannot remove information already seen by a professional. MindBridge is not an emergency service; see the urgent-help banner below.</p>
    {loading || (user && consentsLoading) ? <p role="status">Loading your preferences…</p> : !user ? <p><Link to="/login">Log in</Link> to view and manage your consent preferences.</p> : <>
      {consentError && <div className="error" role="alert">{consentError} <Button onClick={retry} disabled={busy}>Retry loading</Button></div>}
      {!consentError && <><h2>Your consent choices</h2><div className="consent-item"><h3>Required consent</h3><p>Status: <strong>{consents.terms === true ? 'Given' : 'Not given'}</strong><br />Last updated: {date('terms')}</p><p>Withdrawing required consent means you stop using the service. For this demo, request account deletion through an administrator.</p>{consents.terms !== true && <Link to="/consent">Review and give required consent</Link>}</div>
        {Object.entries(labels).map(([type, label]) => <div className="consent-item" key={type}><label className="check-label"><input type="checkbox" checked={consents[type] === true} disabled={busy} onChange={event => toggle(type, event.target.checked)} />{label}</label><p>Status: <strong>{consents[type] === true ? 'Allowed' : 'Off'}</strong><br />Last updated: {date(type)}</p></div>)}
      </>}
      {message && <p className="notice" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}
    </>}
  </div></section>
}
