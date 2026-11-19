import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import {
  cancelReferral,
  createReferral,
  getReferral,
  isActiveReferral,
  listMyReferrals,
  needsReminder,
  pendingReminder,
  submitReferralFeedback,
} from '../services/referralService'
import { listServices, TIERS } from '../services/supportService'
import { getAssessment, listAssessments } from '../services/assessmentService'
import { hasSelfHarmResponse } from '../data/instruments'
import Button from '../components/Button'
import ReferralProgress from '../components/ReferralProgress'
import SafetyPanel from '../components/SafetyPanel'

function RequestForm({ service, initialUrgent, onCreated }) {
  const { user, consents, consentsLoading, consentError } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [urgent, setUrgent] = useState(Boolean(initialUrgent))

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await createReferral({
        userId: user.id,
        serviceId: service.id,
        shareResults: consents.share_results === true && data.has('share_results'),
        shareContact: consents.share_contact === true && data.has('share_contact'),
        sharePhysicalContext: consents.share_physical_context === true && data.has('share_physical_context'),
        userNote: data.get('user_note'),
        appointmentMode: data.get('appointment_mode') || service.delivery_mode,
        priority: urgent ? 'urgent' : 'routine',
        crisisFlagged: urgent,
      })
      form.reset()
      setMessage(
        urgent
          ? 'Your urgent referral has been escalated with 24-hour priority, bypassing routine queues. If you need immediate help, call Sakina 800-725462 or UAE 998.'
          : 'Your referral & appointment request has been submitted. You can track every stage below.'
      )
      onCreated()
    } catch (err) {
      setError(err.message || 'Unable to request this referral. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card dashboard-section">
      <h2>Request referral to {service.name}</h2>
      {!service.verified && (
        <p className="notice">
          Demonstration listing. This request is tracked in MindBridge AI; confirm external provider registration before relying on it.
        </p>
      )}
      <p className="muted">
        <strong>Eligibility:</strong> {service.eligibility || 'Standard intake'} · <strong>Availability:</strong> {service.availability || service.typical_wait}
      </p>

      {consentsLoading ? (
        <p role="status">Loading sharing preferences…</p>
      ) : consentError ? (
        <p className="error" role="alert">
          {consentError} <Link to="/privacy">Review your preferences</Link> before requesting a referral.
        </p>
      ) : (
        <form className="consent-form" onSubmit={submit}>
          <label className="check-label">
            <input type="checkbox" checked={urgent} disabled={busy} onChange={e => setUrgent(e.target.checked)} />
            Urgent human-led escalation (24-hour priority — bypasses ordinary navigation queue)
          </label>

          <label>
            Preferred appointment format
            <select name="appointment_mode" defaultValue={service.delivery_mode || 'Video tele-health'} disabled={busy}>
              <option value="Video tele-health">Video tele-health</option>
              <option value="Phone consultation">Phone consultation</option>
              <option value="In-person clinic">In-person clinic</option>
            </select>
          </label>

          <label>
            Optional note (preferred times, language, or physical-mental care context)
            <textarea name="user_note" rows={3} maxLength={2000} disabled={busy} />
          </label>

          {[
            ['share_results', 'Share my assessment results'],
            ['share_contact', 'Share my name/contact'],
            ['share_physical_context', 'Share my physical health & simulated Malaffi context'],
          ].map(([type, label]) => (
            <div key={type}>
              <label className="check-label">
                <input
                  type="checkbox"
                  name={type}
                  defaultChecked={consents[type] === true}
                  disabled={busy || consents[type] !== true}
                />
                {label}
              </label>
              {consents[type] !== true && (
                <p className="muted">
                  Preference is off. <Link to="/privacy">Enable in Privacy</Link> if needed.
                </p>
              )}
            </div>
          ))}

          {error && <p className="error" role="alert">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? 'Submitting…' : urgent ? 'Submit urgent escalation' : 'Submit referral request'}
          </Button>
        </form>
      )}
      {message && <p className="notice" role="status">{message}</p>}
    </section>
  )
}

export default function Referrals() {
  const { user, role } = useAuth()
  const { formatDate } = useI18n()
  const [params] = useSearchParams()
  const serviceId = params.get('service')
  const urgentRequested = params.get('urgent') === '1'
  const [state, setState] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [busyId, setBusyId] = useState(null)
  const [confirmCancelId, setConfirmCancelId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    async function loadReferrals() {
      const rows = await listMyReferrals(user.id)
      return Promise.all(
        rows.map(async row => {
          try {
            const detail = await getReferral(row.id)
            if (!detail) throw new Error('This referral is no longer available.')
            return detail
          } catch (err) {
            return { ...row, follow_ups: [], followUpsError: err.message || 'Unable to load follow-up notes.' }
          }
        })
      )
    }
    async function loadRecentUrgency() {
      const rows = await listAssessments(user.id)
      const latestPhq = rows.find(r => r.instrument === 'PHQ9')
      if (!latestPhq) return false
      const full = Array.isArray(latestPhq.answers) ? latestPhq : await getAssessment(user.id, latestPhq.id).catch(() => null)
      return full ? hasSelfHarmResponse('PHQ9', full.answers) : false
    }
    Promise.allSettled([loadReferrals(), listServices(), loadRecentUrgency()]).then(([referrals, services, recentUrgentRes]) => {
      if (active) {
        setState({
          userId: user.id,
          referrals: referrals.status === 'fulfilled' ? referrals.value : [],
          referralsError: referrals.status === 'rejected' ? referrals.reason.message || 'Unable to load referrals.' : '',
          services: services.status === 'fulfilled' ? services.value : [],
          servicesError: services.status === 'rejected' ? services.reason.message || 'Unable to load service listings.' : '',
          recentUrgent: recentUrgentRes.status === 'fulfilled' ? Boolean(recentUrgentRes.value) : false,
        })
      }
    })
    return () => {
      active = false
    }
  }, [user.id, attempt])

  async function cancel(id) {
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      await cancelReferral(id)
      setConfirmCancelId(null)
      setMessage('Your referral has been cancelled.')
      setAttempt(previous => previous + 1)
    } catch (err) {
      setError(err.message || 'Unable to cancel this referral.')
    } finally {
      setBusyId(null)
    }
  }

  async function sendFeedback(event, referralId) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusyId(referralId)
    setError('')
    setMessage('')
    try {
      await submitReferralFeedback(referralId, data.get('rating'), data.get('comment'))
      setMessage('Thank you! Your support experience feedback was recorded.')
      setAttempt(previous => previous + 1)
    } catch (err) {
      setError(err.message || 'Unable to save feedback.')
    } finally {
      setBusyId(null)
    }
  }

  if (state?.userId !== user.id) return <p role="status">Loading your referrals &amp; appointments…</p>
  const effectiveUrgent = urgentRequested || state.recentUrgent
  const selected = state.services.find(service => service.id === serviceId)
  const urgentFallbackService =
    state.services.find(s => s.tier === 'urgent_emergency') ||
    state.services.find(s => s.tier === 'specialist') ||
    state.services[0]
  const activeServiceForForm = selected || (effectiveUrgent ? urgentFallbackService : null)

  return (
    <section className="dashboard-page">
      {effectiveUrgent && <SafetyPanel />}
      <p className="eyebrow">SUPPORT THAT FOLLOWS THROUGH</p>
      <h1>Referrals, appointments &amp; follow-up</h1>
      <p>
        Track your referral status, scheduled appointments, sharing preferences, and clinician follow-ups. For immediate crisis help call Sakina <strong>800-725462</strong> or UAE Ambulance <strong>998</strong>.
      </p>

      {role === 'professional' && (
        <p className="notice">
          Showing referrals you requested. To review cases assigned to you, open <Link to="/professional">Clinician Workspace</Link>.
        </p>
      )}
      {activeServiceForForm ? (
        <RequestForm
          key={`${user.id}-${activeServiceForForm.id}-${effectiveUrgent}`}
          service={activeServiceForForm}
          initialUrgent={effectiveUrgent}
          onCreated={() => setAttempt(previous => previous + 1)}
        />
      ) : (
        <Link className="button" to="/support">
          Find a service to request support
        </Link>
      )}

      {message && <p className="notice" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <h2 className="dashboard-section">My referrals &amp; appointments</h2>
      {state.referralsError ? (
        <p className="error" role="alert">{state.referralsError}</p>
      ) : state.referrals.length === 0 ? (
        <p className="card">No referrals yet. Explore stepped support options whenever you feel ready.</p>
      ) : (
        <div className="referral-list">
          {state.referrals.map(referral => {
            const alternatives = state.services
              .filter(service => service.tier === referral.service?.tier && service.id !== referral.service_id)
              .slice(0, 3)
            const eligibleForFeedback =
              ['appointment_attended', 'follow_up_completed', 'escalated'].includes(referral.status) && !referral.feedback

            return (
              <article className="card" key={referral.id}>
                <div className="card-header-row">
                  <h3>{referral.service?.name || 'Service details unavailable'}</h3>
                  {(referral.priority === 'urgent' || referral.crisis_flagged) && (
                    <span className="badge badge-urgent">Urgent escalation</span>
                  )}
                </div>
                <p className="muted">
                  {TIERS.find(tier => tier.id === referral.service?.tier)?.label} · {referral.appointment_mode || referral.service?.delivery_mode}
                </p>
                <ReferralProgress status={referral.status} />

                {referral.appointment_at && (
                  <p className="notice">
                    <strong>Scheduled appointment:</strong> {formatDate(referral.appointment_at)} ({referral.appointment_mode}) ·{' '}
                    Attendance: <strong>{referral.attendance_status || 'scheduled'}</strong>
                  </p>
                )}

                {referral.crisis_completed_at && (
                  <p className="notice">
                    <strong>Human crisis outreach completed:</strong> {formatDate(referral.crisis_completed_at)}
                  </p>
                )}

                {needsReminder(referral) && <p className="notice">{pendingReminder}</p>}
                <p className="muted">Last updated: {formatDate(referral.updated_at)}</p>
                <p>
                  Results sharing: <strong>{referral.share_results ? 'On' : 'Off'}</strong> · Contact sharing:{' '}
                  <strong>{referral.share_contact ? 'On' : 'Off'}</strong> · Physical context:{' '}
                  <strong>{referral.share_physical_context ? 'On' : 'Off'}</strong>
                </p>
                <Link to="/privacy">Manage optional sharing</Link>

                <h4>Clinician follow-up &amp; outcomes</h4>
                {referral.followUpsError ? (
                  <p className="error" role="alert">{referral.followUpsError}</p>
                ) : referral.follow_ups.length === 0 ? (
                  <p className="muted">No follow-up notes yet.</p>
                ) : (
                  <ul className="follow-up-notes">
                    {referral.follow_ups.map(note => (
                      <li key={note.id}>
                        <p className="muted">{formatDate(note.created_at)}</p>
                        {note.note && <p>{note.note}</p>}
                        {note.outcome && <p><strong>Outcome:</strong> {note.outcome}</p>}
                      </li>
                    ))}
                  </ul>
                )}

                {referral.feedback && (
                  <p className="notice">
                    <strong>Your experience feedback ({referral.feedback.rating}/5):</strong> {referral.feedback.comment || 'Submitted'}
                  </p>
                )}

                {eligibleForFeedback && (
                  <form className="consent-form" onSubmit={e => sendFeedback(e, referral.id)}>
                    <h4>Share your support experience (optional)</h4>
                    <label>
                      How supportive &amp; accessible was this care connection? (1–5)
                      <select name="rating" defaultValue="5" disabled={busyId !== null}>
                        <option value="5">5 — Very helpful &amp; respectful</option>
                        <option value="4">4 — Helpful</option>
                        <option value="3">3 — Neutral</option>
                        <option value="2">2 — Needs improvement</option>
                        <option value="1">1 — Unsatisfactory</option>
                      </select>
                    </label>
                    <label>
                      Feedback comment (optional)
                      <textarea name="comment" rows={2} maxLength={500} disabled={busyId !== null} />
                    </label>
                    <div>
                      <Button type="submit" className="button-secondary" disabled={busyId !== null}>
                        Submit experience feedback
                      </Button>
                    </div>
                  </form>
                )}

                {isActiveReferral(referral) && (
                  <div className="actions">
                    {confirmCancelId === referral.id ? (
                      <div className="notice" role="alert">
                        <strong>Cancel this referral?</strong>
                        <p>You can request another stepped support option afterwards.</p>
                        <div className="actions">
                          <Button disabled={busyId !== null} onClick={() => cancel(referral.id)}>
                            {busyId === referral.id ? 'Cancelling…' : 'Confirm cancel'}
                          </Button>
                          <Button className="button-secondary" disabled={busyId !== null} onClick={() => setConfirmCancelId(null)}>
                            Keep referral
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button className="button-secondary" disabled={busyId !== null} onClick={() => setConfirmCancelId(referral.id)}>
                        Cancel request
                      </Button>
                    )}
                  </div>
                )}

                {['declined', 'unsuccessful_handover', 'unable_to_contact', 'cancelled'].includes(referral.status) && (
                  <section className="other-options">
                    <h4>Other options</h4>
                    {alternatives.length ? (
                      <ul>
                        {alternatives.map(service => (
                          <li key={service.id}>
                            <Link to={`/referrals?service=${encodeURIComponent(service.id)}`}>{service.name}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Explore all levels to pick another service.</p>
                    )}
                    <Link to="/support">Explore all support levels</Link>
                  </section>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
