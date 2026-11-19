import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import {
  OUTCOME_OPTIONS,
  acceptReferral,
  acknowledgeCrisis,
  addFollowUp,
  allowedStatuses,
  completeCrisisResponse,
  filterReferrals,
  listAssignedReferrals,
  listCoordinatorReferrals,
  listPrimaryCareCases,
  reportAdverseEvent,
  scheduleAppointment,
  updateReferralStatus,
} from '../services/professionalService'
import { STATUS } from '../services/referralService'
import { TIERS } from '../services/supportService'
import Button from '../components/Button'

function ReferralCard({ referral, actorId, mode, refresh }) {
  const { formatDate } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showAdverseForm, setShowAdverseForm] = useState(false)
  const statuses = allowedStatuses(referral, actorId)
  const isUrgent = referral.crisis_flagged || referral.priority === 'urgent' || referral.status === 'escalated'

  async function submitStatusOrFollowUp(event, followUp) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (followUp) {
        await addFollowUp(
          referral.id,
          values.get('note'),
          values.get('outcome'),
          values.get('outcome_status'),
          actorId
        )
        form.reset()
        setMessage('Follow-up & care coordination update saved.')
      } else {
        await updateReferralStatus(referral.id, values.get('status'), actorId)
        setMessage('Referral status updated.')
      }
      refresh()
    } catch (err) {
      setError(err.message || 'Unable to save. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function saveAppointment(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await scheduleAppointment(referral.id, {
        appointmentAt: values.get('appointment_at'),
        appointmentMode: values.get('appointment_mode'),
        attendanceStatus: values.get('attendance_status'),
        actorId,
      })
      setMessage('Appointment & attendance updated.')
      refresh()
    } catch (err) {
      setError(err.message || 'Unable to update appointment.')
    } finally {
      setBusy(false)
    }
  }

  async function handleAcknowledgeCrisis() {
    setBusy(true)
    setError('')
    try {
      await acknowledgeCrisis(referral.id, actorId)
      setMessage('Urgent handover acknowledged.')
      refresh()
    } catch (err) {
      setError(err.message || 'Unable to acknowledge.')
    } finally {
      setBusy(false)
    }
  }

  async function handleAccept() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await acceptReferral(referral.id, actorId)
      setMessage('Referral accepted and moved to clinician review.')
      refresh()
    } catch (err) {
      setError(err.message || 'Unable to accept referral.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDecline() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await updateReferralStatus(referral.id, 'declined', actorId)
      setMessage('Referral marked as declined so alternative options can be offered.')
      refresh()
    } catch (err) {
      setError(err.message || 'Unable to decline referral.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCompleteCrisis() {
    setBusy(true)
    setError('')
    try {
      await completeCrisisResponse(referral.id, actorId)
      setMessage('Human crisis response recorded and timestamped.')
      refresh()
    } catch (err) {
      setError(err.message || 'Unable to record crisis completion.')
    } finally {
      setBusy(false)
    }
  }

  async function submitAdverseEvent(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true)
    setError('')
    try {
      await reportAdverseEvent({
        referralId: referral.id,
        reportedBy: actorId,
        category: values.get('category'),
        severity: values.get('severity'),
        summary: values.get('summary'),
        actionTaken: values.get('action_taken'),
      })
      form.reset()
      setShowAdverseForm(false)
      setMessage('Safety / adverse event logged for oversight.')
      refresh()
    } catch (err) {
      setError(err.message || 'Unable to log adverse event.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`card ${isUrgent ? 'card-urgent' : ''}`}>
      <div className="card-header-row">
        <h2>{referral.service?.name || 'Service details unavailable'}</h2>
        {isUrgent && <span className="badge badge-urgent">Urgent / High-Risk Escalation</span>}
      </div>
      <p>
        {TIERS.find(tier => tier.id === referral.service?.tier)?.label || 'Tier unavailable'} ·{' '}
        <span className={`badge ${STATUS[referral.status]?.terminal ? 'status-ended' : ''}`}>
          {STATUS[referral.status]?.label || referral.status}
        </span>
      </p>
      <p>
        <strong>{referral.share_contact ? referral.profile?.full_name || 'Name not available' : 'Contact not shared (consent off)'}</strong>
      </p>
      <p className="muted">
        Created: {formatDate(referral.created_at)} · Last updated: {formatDate(referral.updated_at)}
      </p>

      {statuses.length > 0 && ['support_requested', 'submitted', 'received', 'pending'].includes(referral.status) && (
        <div className="actions">
          <Button disabled={busy} onClick={handleAccept}>
            {busy ? 'Accepting…' : 'Accept referral'}
          </Button>
          <Button className="button-secondary" disabled={busy} onClick={handleDecline}>
            Decline
          </Button>
        </div>
      )}

      {isUrgent && (
        <div className="notice" role="region" aria-label="Crisis handover tracking">
          <p>
            <strong>Handover acknowledgment:</strong>{' '}
            {referral.crisis_acknowledged_at ? formatDate(referral.crisis_acknowledged_at) : 'Pending clinician acknowledgment'}
            <br />
            <strong>Human crisis completion:</strong>{' '}
            {referral.crisis_completed_at ? formatDate(referral.crisis_completed_at) : 'Not yet completed'}
          </p>
          <div className="actions">
            {!referral.crisis_acknowledged_at && (
              <Button className="button-secondary" disabled={busy} onClick={handleAcknowledgeCrisis}>
                Acknowledge urgent handover
              </Button>
            )}
            {!referral.crisis_completed_at && (
              <Button disabled={busy} onClick={handleCompleteCrisis}>
                Mark human crisis response completed
              </Button>
            )}
          </div>
        </div>
      )}

      <h3>User note</h3>
      <p className="referral-note">{referral.user_note || 'No note provided.'}</p>

      {mode !== 'coordinator' && (
        <>
          <h3>Screening summary (with consent)</h3>
          {!referral.share_results ? (
            <p className="muted">Assessment results not shared (consent off).</p>
          ) : referral.assessments.length === 0 ? (
            <p>No assessment results available.</p>
          ) : (
            <ul>
              {referral.assessments.map(row => (
                <li key={row.instrument}>
                  {row.instrument}: {row.total_score} · {row.severity} · {formatDate(row.created_at)}
                </li>
              ))}
            </ul>
          )}

          <h3>Physical &amp; mental health coordination (Malaffi-ready demo)</h3>
          {!referral.share_physical_context ? (
            <p className="muted">Physical health context not shared (consent off).</p>
          ) : !referral.physical_context ? (
            <p className="muted">Consented, and no physical comorbidities recorded yet.</p>
          ) : (
            <div className="notice">
              {referral.physical_context.conditions?.length > 0 && (
                <p><strong>Comorbidities:</strong> {referral.physical_context.conditions.join(', ')}</p>
              )}
              {referral.physical_context.primary_care_note && (
                <p><strong>Primary-care context:</strong> {referral.physical_context.primary_care_note}</p>
              )}
              {referral.physical_context.medications_note && (
                <p><strong>Medications:</strong> {referral.physical_context.medications_note}</p>
              )}
              {referral.physical_context.malaffi_simulated && (
                <p className="muted">
                  <strong>{referral.physical_context.malaffi_simulated.source}:</strong>{' '}
                  {referral.physical_context.malaffi_simulated.primary_clinic} · BP {referral.physical_context.malaffi_simulated.last_bp} · HbA1c {referral.physical_context.malaffi_simulated.hba1c} · TSH {referral.physical_context.malaffi_simulated.tsh}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="consent-item">
        <h3>Appointment scheduling &amp; attendance</h3>
        <form className="consent-form" onSubmit={saveAppointment}>
          <div className="equity-form-grid">
            <label>
              Appointment date &amp; time
              <input
                type="datetime-local"
                name="appointment_at"
                defaultValue={referral.appointment_at ? referral.appointment_at.slice(0, 16) : ''}
                disabled={busy}
              />
            </label>
            <label>
              Format
              <select name="appointment_mode" defaultValue={referral.appointment_mode || 'Video tele-health'} disabled={busy}>
                <option value="Video tele-health">Video tele-health</option>
                <option value="Phone consultation">Phone consultation</option>
                <option value="In-person clinic">In-person clinic</option>
                <option value="Urgent clinician phone call">Urgent clinician phone call</option>
              </select>
            </label>
            <label>
              Attendance status
              <select name="attendance_status" defaultValue={referral.attendance_status || 'pending'} disabled={busy}>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="attended">Attended</option>
                <option value="missed">Missed / follow-up needed</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </label>
          </div>
          <div>
            <Button type="submit" className="button-secondary" disabled={busy}>
              Save appointment
            </Button>
          </div>
        </form>
      </div>

      <h3>Update referral status</h3>
      {statuses.length === 0 ? (
        <p>Manage your own referral from the My requests page.</p>
      ) : (
        <form className="consent-form" onSubmit={event => submitStatusOrFollowUp(event, false)}>
          <label>
            Status
            <select name="status" defaultValue={referral.status === 'cancelled' ? '' : referral.status} disabled={busy} required>
              <option value="" disabled>Choose status</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {STATUS[status].label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save status'}
          </Button>
        </form>
      )}

      <h3>Follow-up &amp; clinical coordination notes</h3>
      {referral.follow_ups.length === 0 ? (
        <p className="muted">No follow-ups recorded yet.</p>
      ) : (
        <ul className="follow-up-notes">
          {referral.follow_ups.map(item => (
            <li key={item.id}>
              <p className="muted">{formatDate(item.created_at)}</p>
              {item.note && <p>{item.note}</p>}
              {item.outcome && <p><strong>Outcome:</strong> {item.outcome}</p>}
            </li>
          ))}
        </ul>
      )}

      <form className="consent-form" onSubmit={event => submitStatusOrFollowUp(event, true)}>
        <h3>Record follow-up / care update</h3>
        <label>
          Clinical or coordination note
          <textarea name="note" rows={3} maxLength={4000} disabled={busy} />
        </label>
        <label>
          Outcome category
          <select name="outcome_status" defaultValue="" disabled={busy}>
            <option value="">Select outcome (optional)</option>
            {OUTCOME_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Outcome summary (visible to user)
          <textarea name="outcome" rows={2} maxLength={2000} disabled={busy} />
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save follow-up'}
        </Button>
      </form>

      <div className="consent-item">
        <Button className="button-secondary" disabled={busy} onClick={() => setShowAdverseForm(v => !v)}>
          {showAdverseForm ? 'Hide safety incident form' : 'Log adverse event / safety concern'}
        </Button>
        {showAdverseForm && (
          <form className="consent-form" onSubmit={submitAdverseEvent}>
            <label>
              Event category
              <input name="category" required maxLength={150} disabled={busy} />
            </label>
            <label>
              Severity
              <select name="severity" defaultValue="moderate" disabled={busy}>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Summary
              <textarea name="summary" rows={2} required maxLength={1000} disabled={busy} />
            </label>
            <label>
              Action taken
              <textarea name="action_taken" rows={2} maxLength={1000} disabled={busy} />
            </label>
            <Button type="submit" disabled={busy}>Submit safety event</Button>
          </form>
        )}
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status" className="notice">{message}</p>}
    </article>
  )
}

export default function ProfessionalDashboard({ mode = 'professional' }) {
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [filter, setFilter] = useState('active')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    const loader =
      mode === 'coordinator'
        ? listCoordinatorReferrals()
        : mode === 'primary_care'
          ? listPrimaryCareCases()
          : listAssignedReferrals(user.id)

    loader
      .then(rows => {
        if (active) setState({ userId: user.id, mode, rows })
      })
      .catch(error => {
        if (active) setState({ userId: user.id, mode, error: error.message || 'Unable to load cases.' })
      })
    return () => {
      active = false
    }
  }, [user.id, mode, attempt])

  function refresh() {
    setAttempt(value => value + 1)
  }

  const rows = state?.rows ? filterReferrals(state.rows, filter) : []

  const heading =
    mode === 'coordinator'
      ? 'Care Coordinator — Referral Queue & Appointments'
      : mode === 'primary_care'
        ? 'Primary Healthcare — Coordinated Physical & Mental Care'
        : 'Clinician Workspace — Assigned Referrals'

  const subtitle =
    mode === 'coordinator'
      ? 'Manage referral queues, schedule or reschedule appointments, track waiting times, and follow up on unsuccessful handovers.'
      : mode === 'primary_care'
        ? 'Review consented physical health / simulated Malaffi summaries alongside mental wellbeing screens to coordinate integrated care.'
        : 'Review referrals assigned to you, acknowledge urgent escalations, manage appointments, and record follow-up outcomes.'

  return (
    <section className="dashboard-page">
      <p className="eyebrow">HUMAN SUPPORT, CONNECTED</p>
      <h1>{heading}</h1>
      <p>{subtitle}</p>
      <div className="tier-filters" role="group" aria-label="Filter referrals">
        {[
          ['active', 'Active'],
          ['urgent', 'Urgent / High-Risk'],
          ['completed', 'Completed / closed'],
          ['all', 'All'],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={`button ${filter === value ? '' : 'button-secondary'}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {state?.userId !== user.id || state?.mode !== mode ? (
        <p role="status">Loading workspace…</p>
      ) : state.error ? (
        <p className="error" role="alert">{state.error}</p>
      ) : rows.length === 0 ? (
        <article className="card">
          <p>No {filter === 'all' ? '' : `${filter} `}referrals in this queue.</p>
          {mode === 'professional' && (
            <p>
              Your own requests appear under <Link to="/my-referrals">My requests</Link>.
            </p>
          )}
        </article>
      ) : (
        <div className="referral-list">
          {rows.map(referral => (
            <ReferralCard key={`${referral.id}-${referral.updated_at}`} referral={referral} actorId={user.id} mode={mode} refresh={refresh} />
          ))}
        </div>
      )}
      <div className="actions">
        <Button className="button-secondary" onClick={refresh}>
          Refresh queue
        </Button>
      </div>
    </section>
  )
}
