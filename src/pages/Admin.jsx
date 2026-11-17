import { useEffect, useState } from 'react'
import { useAuth } from '../context/auth'
import { getAdminMetrics, listAdminServices, listAdminReferrals, saveService, setServiceFlag, listRecentAuditLogs } from '../services/adminService'
import { TIERS } from '../services/supportService'
import { STATUS } from '../services/referralService'
import Button from '../components/Button'

function ServiceForm({ service, onSaved, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setBusy(true); setError('')
    try {
      await saveService(service?.id, values)
      if (!service) form.reset()
      onSaved(service ? 'Service updated.' : 'Service added. New listings start active and unverified.')
    } catch (error) { setError(error.message || 'Unable to save service. Please retry.') }
    finally { setBusy(false) }
  }
  return <form className="consent-form admin-service-form" onSubmit={submit}><h3>{service ? `Edit ${service.name}` : 'Add a service'}</h3><label>Name<input name="name" defaultValue={service?.name || ''} required maxLength={200} disabled={busy} /></label><label>Tier<select name="tier" defaultValue={service?.tier || 'self_help'} disabled={busy}>{TIERS.map(tier => <option key={tier.id} value={tier.id}>{tier.label}</option>)}</select></label><label>Description<textarea name="description" rows={3} defaultValue={service?.description || ''} disabled={busy} /></label><label>Contact<textarea name="contact" rows={2} defaultValue={service?.contact || ''} disabled={busy} /></label><label>Website (optional)<input type="url" name="website" placeholder="https://" defaultValue={service?.website || ''} disabled={busy} /></label>{error && <p className="error" role="alert">{error}</p>}<div className="actions"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : service ? 'Save changes' : 'Add service'}</Button>{onCancel && <Button className="button-secondary" disabled={busy} onClick={onCancel}>Cancel edit</Button>}</div></form>
}

export default function Admin() {
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    Promise.allSettled([getAdminMetrics(), listAdminServices(), listRecentAuditLogs(), listAdminReferrals()]).then(results => {
      if (active) setState({ userId: user.id, metrics: results[0], services: results[1], audit: results[2], referrals: results[3] })
    })
    return () => { active = false }
  }, [user.id, attempt])
  function refresh() { setAttempt(value => value + 1) }
  function saved(message) { setEditing(null); setMessage(message); setError(''); refresh() }
  async function toggle(service, flag) {
    setBusy(true); setError(''); setMessage('')
    try { await setServiceFlag(service.id, flag, !service[flag]); saved('Service setting updated.') }
    catch (error) { setError(error.message || 'Unable to update service. Please retry.') }
    finally { setBusy(false) }
  }
  function loadError(result) { return <p className="error" role="alert">{result.reason?.message || 'Unable to load this section. Please refresh.'}</p> }
  if (state?.userId !== user.id) return <p role="status">Loading administration…</p>
  const metrics = state.metrics.value
  return <section className="dashboard-page"><p className="eyebrow">PLATFORM OVERSIGHT</p><h1>Administration</h1><p>Aggregate activity, user referrals, support listings and recent audit events.</p><Button className="button-secondary" onClick={refresh}>Refresh administration</Button>
    <section className="card dashboard-section"><h2>Metrics</h2><p className="muted">Counts only; no personal information is fetched for these metrics.</p>{state.metrics.status === 'rejected' ? loadError(state.metrics) : <div className="admin-metrics"><div><h3>Users by role</h3><ul>{Object.entries(metrics.users).map(([role, count]) => <li key={role}>{role}: {count}</li>)}</ul></div><div><h3>Activity</h3><p>Assessments: {metrics.assessments}<br />Follow-ups: {metrics.followUps}</p></div><div><h3>Referrals by status</h3><ul>{Object.entries(metrics.referrals).map(([status, count]) => <li key={status}>{STATUS[status].label}: {count}</li>)}</ul></div></div>}</section>
    <section className="card dashboard-section"><h2>User referrals</h2>{state.referrals.status === 'rejected' ? loadError(state.referrals) : state.referrals.value.length === 0 ? <p>No referrals have been made yet.</p> : <div className="table-scroll" tabIndex={0} role="region" aria-label="User referrals"><table><caption>All referrals, newest first</caption><thead><tr><th scope="col">User</th><th scope="col">Service</th><th scope="col">Status</th><th scope="col">Created</th></tr></thead><tbody>{state.referrals.value.map(referral => <tr key={referral.id}><td>{referral.user?.full_name || referral.user_id}</td><td>{referral.service?.name || 'Service details unavailable'}</td><td>{STATUS[referral.status]?.label || referral.status}</td><td>{new Date(referral.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</section>
    <section className="card dashboard-section"><h2>Support services management</h2><p id="verification-guidance" className="notice">Only mark verified after confirming details with the provider.</p>{message && <p className="notice" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}{state.services.status === 'rejected' ? loadError(state.services) : state.services.value.length === 0 ? <p>No services yet. Add the first listing below.</p> : <div className="table-scroll" tabIndex={0} role="region" aria-label="All support services"><table><caption>All listings, including inactive services</caption><thead><tr><th scope="col">Name</th><th scope="col">Tier</th><th scope="col">Active</th><th scope="col">Verified</th><th scope="col">Edit</th></tr></thead><tbody>{state.services.value.map(service => <tr key={service.id}><td>{service.name}</td><td>{TIERS.find(tier => tier.id === service.tier)?.label || service.tier}</td>{['active','verified'].map(flag => <td key={flag}><input type="checkbox" checked={service[flag]} disabled={busy} aria-label={`${flag === 'active' ? 'Active' : 'Verified'}: ${service.name}`} aria-describedby={flag === 'verified' ? 'verification-guidance' : undefined} onChange={() => toggle(service, flag)} /></td>)}<td><Button className="button-secondary" disabled={busy} onClick={() => setEditing(service)}>Edit<span className="admin-sr-only"> {service.name}</span></Button></td></tr>)}</tbody></table></div>}
      {editing && <ServiceForm key={editing.id} service={editing} onSaved={saved} onCancel={() => setEditing(null)} />}<ServiceForm onSaved={saved} />
    </section>
    <section className="card dashboard-section"><h2>Recent audit log</h2>{state.audit.status === 'rejected' ? loadError(state.audit) : state.audit.value.length === 0 ? <p>No audit events recorded yet.</p> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Recent audit events"><table><caption>Latest 50 events, newest first</caption><thead><tr>{['Action','Table','Record ID','Actor ID','Time'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{state.audit.value.map(entry => <tr key={entry.id}><td>{entry.action}</td><td>{entry.table_name}</td><td>{entry.record_id}</td><td>{entry.actor_id || 'System / no end-user session'}</td><td>{new Date(entry.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</section>
  </section>
}
