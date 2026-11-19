import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import {
  acceptAdminReferral,
  getAdminMetrics,
  listAdminReferrals,
  listAdminServices,
  listRecentAuditLogs,
  listUsersAndRoles,
  saveService,
  setServiceFlag,
  updateUserRole,
} from '../services/adminService'
import { TIERS } from '../services/supportService'
import { STATUS } from '../services/referralService'
import Button from '../components/Button'

const ALL_ROLES = [
  { id: 'individual', label: 'Individual / Community Member' },
  { id: 'professional', label: 'Licensed Mental Healthcare Professional' },
  { id: 'primary_care', label: 'Primary Healthcare Professional' },
  { id: 'coordinator', label: 'Care Coordinator' },
  { id: 'admin', label: 'System Administrator' },
  { id: 'analyst', label: 'Population Health Analyst' },
]

function ServiceForm({ service, onSaved, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setBusy(true)
    setError('')
    try {
      await saveService(service?.id, values)
      if (!service) form.reset()
      onSaved(service ? 'Service updated.' : 'Service added. New listings start active and unverified.')
    } catch (err) {
      setError(err.message || 'Unable to save service. Please retry.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="consent-form admin-service-form" onSubmit={submit}>
      <h3>{service ? `Edit ${service.name}` : 'Add a support service'}</h3>
      <label>
        Provider / service name
        <input name="name" defaultValue={service?.name || ''} required maxLength={200} disabled={busy} />
      </label>
      <label>
        Stepped-care category
        <select name="tier" defaultValue={service?.tier || 'self_help'} disabled={busy}>
          {TIERS.map(tier => (
            <option key={tier.id} value={tier.id}>
              {tier.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Description
        <textarea name="description" rows={3} defaultValue={service?.description || ''} disabled={busy} />
      </label>
      <div className="equity-form-grid">
        <label>
          Location
          <input name="location" defaultValue={service?.location || ''} placeholder="Abu Dhabi City" disabled={busy} />
        </label>
        <label>
          Languages
          <input name="languages" defaultValue={service?.languages || ''} placeholder="Arabic, English" disabled={busy} />
        </label>
        <label>
          Operating hours
          <input name="operating_hours" defaultValue={service?.operating_hours || ''} placeholder="Sun–Thu 08:00–18:00" disabled={busy} />
        </label>
        <label>
          Appointment method
          <input name="appointment_method" defaultValue={service?.appointment_method || ''} placeholder="MindBridge referral" disabled={busy} />
        </label>
        <label>
          Availability
          <input name="availability" defaultValue={service?.availability || ''} placeholder="Available" disabled={busy} />
        </label>
        <label>
          Typical wait
          <input name="typical_wait" defaultValue={service?.typical_wait || ''} placeholder="24–48 hours" disabled={busy} />
        </label>
      </div>
      <label>
        Eligibility criteria
        <input name="eligibility" defaultValue={service?.eligibility || ''} disabled={busy} />
      </label>
      <label>
        Contact
        <textarea name="contact" rows={2} defaultValue={service?.contact || ''} disabled={busy} />
      </label>
      <label>
        Website (optional)
        <input type="url" name="website" placeholder="https://" defaultValue={service?.website || ''} disabled={busy} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : service ? 'Save changes' : 'Add service'}
        </Button>
        {onCancel && (
          <Button className="button-secondary" disabled={busy} onClick={onCancel}>
            Cancel edit
          </Button>
        )}
      </div>
    </form>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [busyReferralId, setBusyReferralId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [referralError, setReferralError] = useState('')
  const [referralMessage, setReferralMessage] = useState('')

  useEffect(() => {
    let active = true
    Promise.allSettled([
      getAdminMetrics(),
      listAdminServices(),
      listRecentAuditLogs(),
      listAdminReferrals(),
      listUsersAndRoles(),
    ]).then(results => {
      if (active) {
        setState({
          userId: user.id,
          metrics: results[0],
          services: results[1],
          audit: results[2],
          referrals: results[3],
          usersList: results[4],
        })
      }
    })
    return () => {
      active = false
    }
  }, [user.id, attempt])

  function refresh() {
    setAttempt(value => value + 1)
  }

  function saved(msg) {
    setEditing(null)
    setMessage(msg)
    setError('')
    refresh()
  }

  async function toggle(service, flag) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await setServiceFlag(service.id, flag, !service[flag])
      saved('Service setting updated.')
    } catch (err) {
      setError(err.message || 'Unable to update service.')
    } finally {
      setBusy(false)
    }
  }

  async function changeUserRole(targetId, newRole) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await updateUserRole(targetId, newRole, user.id)
      setMessage('User role updated.')
      refresh()
    } catch (err) {
      setError(err.message || 'Unable to update user role.')
    } finally {
      setBusy(false)
    }
  }

  async function acceptReferral(referral) {
    setBusyReferralId(referral.id)
    setReferralError('')
    setReferralMessage('')
    try {
      await acceptAdminReferral(referral.id)
      setReferralMessage('Referral moved to professional review.')
      refresh()
    } catch (err) {
      setReferralError(err.message || 'Unable to accept referral.')
    } finally {
      setBusyReferralId(null)
    }
  }

  function loadError(result) {
    return <p className="error" role="alert">{result.reason?.message || 'Unable to load this section.'}</p>
  }

  if (state?.userId !== user.id) return <p role="status">Loading system administration…</p>
  const metrics = state.metrics.value

  return (
    <section className="dashboard-page">
      <p className="eyebrow">SYSTEM ADMINISTRATION &amp; SECURITY</p>
      <h1>System Administrator Console</h1>
      <p>
        Manage users and roles, provider directory verification, security audit events, and platform configuration.{' '}
        <Link to="/analytics">Open Population Health Analytics →</Link>
      </p>
      <Button className="button-secondary" onClick={refresh}>
        Refresh console
      </Button>

      <section className="card dashboard-section">
        <h2>Platform activity summary</h2>
        {state.metrics.status === 'rejected' ? (
          loadError(state.metrics)
        ) : (
          <div className="admin-metrics">
            <div>
              <h3>Users by role</h3>
              <ul>
                {Object.entries(metrics.users).map(([role, count]) => (
                  <li key={role}>{role}: {count}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Activity</h3>
              <p>
                Completed assessments: {metrics.assessments}
                <br />
                Recorded follow-ups: {metrics.followUps}
              </p>
            </div>
            <div>
              <h3>Referrals by status</h3>
              <ul>
                {Object.entries(metrics.referrals)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => (
                    <li key={status}>{STATUS[status]?.label || status}: {count}</li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="card dashboard-section">
        <h2>Users &amp; role access management</h2>
        {state.usersList.status === 'rejected' ? (
          loadError(state.usersList)
        ) : (
          <div className="table-scroll" tabIndex={0}>
            <table>
              <caption>Registered accounts and assigned RBAC roles</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Change role</th>
                </tr>
              </thead>
              <tbody>
                {state.usersList.value.map(u => (
                  <tr key={u.id}>
                    <td>{u.full_name || '—'}</td>
                    <td>{u.email || u.id}</td>
                    <td>{u.role}</td>
                    <td>
                      <select
                        aria-label={`Role for ${u.full_name || u.id}`}
                        value={u.role}
                        disabled={busy || u.id === user.id}
                        onChange={e => changeUserRole(u.id, e.target.value)}
                      >
                        {ALL_ROLES.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card dashboard-section">
        <h2>De-identified referral queue</h2>
        {referralMessage && <p className="notice" role="status">{referralMessage}</p>}
        {referralError && <p className="error" role="alert">{referralError}</p>}
        {state.referrals.status === 'rejected' ? (
          loadError(state.referrals)
        ) : state.referrals.value.length === 0 ? (
          <p>No referrals yet.</p>
        ) : (
          <div className="table-scroll" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Reference</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Service</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {state.referrals.value.map(referral => (
                  <tr key={referral.id}>
                    <td>{referral.reference_label || referral.user?.full_name || referral.user_id}</td>
                    <td>{referral.crisis_flagged || referral.priority === 'urgent' ? 'Urgent' : 'Routine'}</td>
                    <td>{referral.service?.name || 'Service details unavailable'}</td>
                    <td>{STATUS[referral.status]?.label || referral.status}</td>
                    <td>
                      {['support_requested', 'pending', 'submitted', 'received'].includes(referral.status) ? (
                        <Button disabled={busyReferralId !== null} onClick={() => acceptReferral(referral)}>
                          {busyReferralId === referral.id ? 'Accepting…' : 'Accept referral'}
                        </Button>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card dashboard-section">
        <h2>Support provider directory management</h2>
        <p id="verification-guidance" className="notice">
          Mark verified only after confirming clinic licensure, hours, and eligibility with the Abu Dhabi provider.
        </p>
        {message && <p className="notice" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {state.services.status === 'rejected' ? (
          loadError(state.services)
        ) : (
          <div className="table-scroll" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Category</th>
                  <th scope="col">Last verified</th>
                  <th scope="col">Active</th>
                  <th scope="col">Verified</th>
                  <th scope="col">Edit</th>
                </tr>
              </thead>
              <tbody>
                {state.services.value.map(service => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td>{TIERS.find(tier => tier.id === service.tier)?.label || service.tier}</td>
                    <td>{service.last_verified_at || '—'}</td>
                    {['active', 'verified'].map(flag => (
                      <td key={flag}>
                        <input
                          type="checkbox"
                          checked={service[flag]}
                          disabled={busy}
                          aria-label={`${flag}: ${service.name}`}
                          onChange={() => toggle(service, flag)}
                        />
                      </td>
                    ))}
                    <td>
                      <Button className="button-secondary" disabled={busy} onClick={() => setEditing(service)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {editing && <ServiceForm key={editing.id} service={editing} onSaved={saved} onCancel={() => setEditing(null)} />}
        <ServiceForm onSaved={saved} />
      </section>

      <section className="card dashboard-section">
        <h2>Implementation boundary &amp; system configuration</h2>
        <ul>
          <li><strong>Implemented in prototype:</strong> Bilingual EN/AR RTL UI, 6 RBAC roles, 5 granular consents, PHQ-9/GAD-7/PSS-10/WHO-5 scoring &amp; change detection, stepped navigation, full referral/appointment lifecycle, crisis escalation workflow, population analytics with small-group suppression.</li>
          <li><strong>Simulated / demonstration integrations:</strong> Malaffi HL7/FHIR primary-care summaries, synthetic Abu Dhabi clinic availability, and local demo persistence (when Supabase is unconfigured).</li>
          <li><strong>Planned production capabilities:</strong> Live UAE Pass authentication, official DOH/Malaffi FHIR API exchange, licensed Sakina warm-transfer telephony API, and offline Python/Scikit-learn navigation risk models.</li>
        </ul>
      </section>

      <section className="card dashboard-section">
        <h2>Security &amp; audit events</h2>
        {state.audit.status === 'rejected' ? (
          loadError(state.audit)
        ) : (
          <div className="table-scroll" tabIndex={0}>
            <table>
              <caption>Latest 50 security &amp; operational events (clinical answers &amp; notes omitted)</caption>
              <thead>
                <tr>
                  {['Action', 'Table', 'Record ID', 'Actor ID', 'Time'].map(label => (
                    <th scope="col" key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.audit.value.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.action}</td>
                    <td>{entry.table_name}</td>
                    <td>{entry.record_id}</td>
                    <td>{entry.actor_id || 'System'}</td>
                    <td>{new Date(entry.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
