import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { createReferral, listMyReferrals, getReferral, cancelReferral, isActiveReferral, needsReminder, pendingReminder } from '../services/referralService'
import { listServices, TIERS } from '../services/supportService'
import Button from '../components/Button'
import ReferralProgress from '../components/ReferralProgress'

function RequestForm({ service, onCreated }) {
  const { consents, consentsLoading, consentError } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true); setError(''); setMessage('')
    try {
      await createReferral({ serviceId: service.id, shareResults: consents.share_results === true && data.has('share_results'), shareContact: consents.share_contact === true && data.has('share_contact'), userNote: data.get('user_note') })
      form.reset()
      setMessage('Your referral request has been saved. You can follow its progress below.')
      onCreated()
    } catch (error) { setError(error.message || 'Unable to request this referral. Please try again.') }
    finally { setBusy(false) }
  }
  return <section className="card dashboard-section"><h2>Request a referral to {service.name}</h2>{!service.verified && <p className="notice">Unverified demo listing. This request is recorded in MindBridge; it does not contact a verified provider or guarantee an appointment.</p>}{consentsLoading ? <p role="status">Loading sharing preferences…</p> : consentError ? <p className="error" role="alert">{consentError} <Link to="/privacy">Review your preferences</Link> before requesting a referral.</p> : <form className="consent-form" onSubmit={submit}><label>Optional note<textarea name="user_note" rows={3} maxLength={2000} disabled={busy} /><span className="muted">Only include information you want to share with the referral team.</span></label>{[['share_results', 'Share my assessment results'], ['share_contact', 'Share my name/contact']].map(([type, label]) => <div key={type}><label className="check-label"><input type="checkbox" name={type} defaultChecked={consents[type] === true} disabled={busy || consents[type] !== true} />{label}</label>{consents[type] !== true && <p className="muted">This sharing preference is off. <Link to="/privacy">Enable it in Privacy</Link> if you wish to use it.</p>}</div>)}<p className="muted">You can withdraw optional sharing in Privacy. An assigned professional can access your profile name only when a referral to them has contact sharing on.</p>{error && <p className="error" role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Request referral'}</Button></form>}{message && <p className="notice" role="status">{message}</p>}</section>
}

export default function Referrals() {
  const { user, role } = useAuth()
  const [params] = useSearchParams()
  const serviceId = params.get('service')
  const [state, setState] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    async function loadReferrals() {
      const rows = await listMyReferrals(user.id)
      return Promise.all(rows.map(async row => {
        try {
          const detail = await getReferral(row.id)
          if (!detail) throw new Error('This referral is no longer available.')
          return detail
        } catch (error) { return { ...row, follow_ups: [], followUpsError: error.message || 'Unable to load follow-up notes.' } }
      }))
    }
    Promise.allSettled([loadReferrals(), listServices()]).then(([referrals, services]) => {
      if (active) setState({ userId: user.id, referrals: referrals.status === 'fulfilled' ? referrals.value : [], referralsError: referrals.status === 'rejected' ? referrals.reason.message || 'Unable to load referrals.' : '', services: services.status === 'fulfilled' ? services.value : [], servicesError: services.status === 'rejected' ? services.reason.message || 'Unable to load service listings.' : '' })
    })
    return () => { active = false }
  }, [user.id, attempt])
  async function cancel(id) {
    if (!window.confirm('Cancel this referral? You can explore other support options afterwards.')) return
    setBusyId(id); setError(''); setMessage('')
    try { await cancelReferral(id); setMessage('Your referral has been cancelled.'); setAttempt(previous => previous + 1) }
    catch (error) { setError(error.message || 'Unable to cancel this referral. Please try again.') }
    finally { setBusyId(null) }
  }
  if (state?.userId !== user.id) return <p role="status">Loading your referrals…</p>
  const selected = state.services.find(service => service.id === serviceId)
  return <section className="dashboard-page"><p className="eyebrow">SUPPORT THAT FOLLOWS THROUGH</p><h1>Your referrals</h1><p>Keep track of requests, sharing choices and follow-up. MindBridge is not an emergency service; referrals are not monitored in real time.</p>
    {role === 'professional' && <p className="notice">This page shows referrals you requested. To review and accept referrals assigned to you, open <Link to="/professional">Professional</Link>.</p>}
    {state.servicesError && <p className="error" role="alert">{state.servicesError} Service names for new requests and alternatives may be unavailable.</p>}
    {serviceId && (selected ? <RequestForm key={`${user.id}-${serviceId}`} service={selected} onCreated={() => setAttempt(previous => previous + 1)} /> : !state.servicesError && <p className="notice">This service is not available for new requests. <Link to="/support">Explore active support options</Link>.</p>)}
    {!serviceId && <Link className="button" to="/support">Find a service to request support</Link>}
    {message && <p className="notice" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}
    <h2 className="dashboard-section">My referrals</h2>{state.referralsError ? <p className="error" role="alert">{state.referralsError}</p> : state.referrals.length === 0 ? <p className="card">No referrals yet. You can explore services at your own pace.</p> : <div className="referral-list">{state.referrals.map(referral => {
      const alternatives = state.services.filter(service => service.tier === referral.service?.tier && service.id !== referral.service_id).slice(0, 3)
      return <article className="card" key={referral.id}><h3>{referral.service?.name || 'Service details unavailable'}</h3><p className="muted">{TIERS.find(tier => tier.id === referral.service?.tier)?.label}</p><ReferralProgress status={referral.status} /><p className="muted">Last updated: {new Date(referral.updated_at).toLocaleString()}</p>{needsReminder(referral) && <p className="notice">{pendingReminder}</p>}<p>Results sharing: <strong>{referral.share_results ? 'On' : 'Off'}</strong> · Contact sharing: <strong>{referral.share_contact ? 'On' : 'Off'}</strong></p><Link to="/privacy">Manage optional sharing</Link><h4>Follow-up notes from professionals</h4>{referral.followUpsError ? <p className="error" role="alert">{referral.followUpsError}</p> : referral.follow_ups.length === 0 ? <p className="muted">No follow-up notes yet.</p> : <ul className="follow-up-notes">{referral.follow_ups.map(note => <li key={note.id}><p className="muted">{new Date(note.created_at).toLocaleString()}</p>{note.note && <p>{note.note}</p>}{note.outcome && <p><strong>Outcome:</strong> {note.outcome}</p>}{!note.note && !note.outcome && <p>Follow-up recorded.</p>}</li>)}</ul>}
        {isActiveReferral(referral) && <Button className="button-secondary" disabled={busyId !== null} onClick={() => cancel(referral.id)}>{busyId === referral.id ? 'Cancelling…' : 'Cancel referral'}</Button>}
        {['declined', 'unable_to_contact', 'cancelled'].includes(referral.status) && <section className="other-options"><h4>Other options</h4>{alternatives.length ? <ul>{alternatives.map(service => <li key={service.id}><Link to={`/referrals?service=${encodeURIComponent(service.id)}`}>{service.name}</Link>{!service.verified && <span className="muted"> — Unverified demo listing</span>}</li>)}</ul> : <p>No other active listings in this tier are available right now.</p>}<Link to="/support">Explore all support levels</Link></section>}
      </article>
    })}</div>}
    <div className="actions"><Button className="button-secondary" onClick={() => setAttempt(previous => previous + 1)}>Refresh referrals and services</Button></div>
  </section>
}
