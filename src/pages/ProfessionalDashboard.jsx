import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { listAssignedReferrals, updateReferralStatus, addFollowUp, filterReferrals, allowedStatuses } from '../services/professionalService'
import { STATUS } from '../services/referralService'
import { TIERS } from '../services/supportService'
import Button from '../components/Button'

function ReferralCard({ referral, professionalId, refresh }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const statuses = allowedStatuses(referral, professionalId)
  async function submit(event, followUp) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true); setError(''); setMessage('')
    try {
      if (followUp) await addFollowUp(referral.id, values.get('note'), values.get('outcome'))
      else await updateReferralStatus(referral.id, values.get('status'))
      if (followUp) form.reset()
      setMessage(followUp ? 'Follow-up saved and visible to the referral owner.' : 'Status updated.')
      refresh()
    } catch (error) { setError(error.message || 'Unable to save. Please try again.') }
    finally { setBusy(false) }
  }
  async function accept() {
    setBusy(true); setError(''); setMessage('')
    try {
      await updateReferralStatus(referral.id, 'accepted')
      setMessage('Referral accepted.')
      refresh()
    } catch (error) { setError(error.message || 'Unable to accept this referral. Please try again.') }
    finally { setBusy(false) }
  }
  return <article className="card"><h2>{referral.service?.name || 'Service details unavailable'}</h2><p>{TIERS.find(tier => tier.id === referral.service?.tier)?.label || 'Tier unavailable'}</p><span className={`badge ${STATUS[referral.status]?.terminal ? 'status-ended' : ''}`}>{STATUS[referral.status]?.label || referral.status}</span>
    <p><strong>{referral.share_contact ? referral.profile?.full_name || 'Name not available' : 'Contact not shared'}</strong></p>
    <p className="muted">Created: {new Date(referral.created_at).toLocaleString()}<br />Last updated: {new Date(referral.updated_at).toLocaleString()}</p>
    {referral.status === 'pending' && statuses.length > 0 && <Button disabled={busy} onClick={accept}>{busy ? 'Accepting…' : 'Accept referral'}</Button>}
    <h3>User note</h3><p className="referral-note">{referral.user_note || 'No note provided.'}</p>
    <h3>Assessment results</h3>{!referral.share_results ? <p>Results not shared</p> : <><p className="muted">Screening, not diagnosis. Latest available result for each instrument.</p>{referral.assessments.length === 0 ? <p>No assessment results available.</p> : <ul>{referral.assessments.map(row => <li key={row.instrument}>{row.instrument === 'PHQ9' ? 'PHQ-9' : 'GAD-7'}: {row.total_score} · {row.severity} · {new Date(row.created_at).toLocaleString()}</li>)}</ul>}</>}
    <h3>Update status</h3>{statuses.length === 0 ? <p>Manage your own referral from the Referrals page.</p> : <form className="consent-form" onSubmit={event => submit(event, false)}><label>Status<select name="status" defaultValue={referral.status === 'cancelled' ? '' : referral.status} disabled={busy} required><option value="" disabled>Choose status</option>{statuses.map(status => <option key={status} value={status}>{STATUS[status].label}</option>)}</select></label><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save status'}</Button></form>}
    <h3>Follow-up history</h3>{referral.follow_ups.length === 0 ? <p>No follow-ups yet.</p> : <ul className="follow-up-notes">{referral.follow_ups.map(item => <li key={item.id}><p className="muted">{new Date(item.created_at).toLocaleString()}</p>{item.note && <p>{item.note}</p>}{item.outcome && <p><strong>Outcome:</strong> {item.outcome}</p>}{!item.note && !item.outcome && <p>Follow-up recorded.</p>}</li>)}</ul>}
    <form className="consent-form" onSubmit={event => submit(event, true)}><h3>Add follow-up</h3><label>Note<textarea name="note" rows={3} maxLength={4000} disabled={busy} /></label><label>Outcome<textarea name="outcome" rows={2} maxLength={2000} disabled={busy} /></label><p className="muted">Enter a note or outcome. Both will be visible to the user.</p><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save follow-up'}</Button></form>
    {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="notice">{message}</p>}
  </article>
}

export default function ProfessionalDashboard() {
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [filter, setFilter] = useState('active')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    listAssignedReferrals(user.id).then(rows => { if (active) setState({ userId: user.id, rows }) }).catch(error => { if (active) setState({ userId: user.id, error: error.message || 'Unable to load assigned referrals.' }) })
    return () => { active = false }
  }, [user.id, attempt])
  function refresh() { setAttempt(value => value + 1) }
  const rows = state?.rows ? filterReferrals(state.rows, filter) : []
  return <section className="dashboard-page"><p className="eyebrow">HUMAN SUPPORT, CONNECTED</p><h1>Assigned referrals</h1><p>Review referrals assigned to you and record next steps. MindBridge is not a diagnostic or emergency service.</p><div className="tier-filters" role="group" aria-label="Filter assigned referrals">{[['active', 'Active'], ['completed', 'Completed / closed'], ['all', 'All']].map(([value, label]) => <button type="button" key={value} className={`button ${filter === value ? '' : 'button-secondary'}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
    {state?.userId !== user.id ? <p role="status">Loading assigned referrals…</p> : state.error ? <p className="error" role="alert">{state.error}</p> : rows.length === 0 ? <article className="card"><p>No {filter === 'all' ? '' : filter === 'active' ? 'active ' : 'completed or closed '}referrals are assigned to this professional account.</p><p>Your own requests appear under <Link to="/my-referrals">My requests</Link> and cannot be accepted by the same account. To test acceptance, submit a referral from a separate individual account.</p></article> : <div className="referral-list">{rows.map(referral => <ReferralCard key={`${referral.id}-${referral.updated_at}`} referral={referral} professionalId={user.id} refresh={refresh} />)}</div>}
    <div className="actions"><Button className="button-secondary" onClick={refresh}>Refresh referrals</Button></div>
  </section>
}
