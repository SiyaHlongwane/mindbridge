import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { listMyReferrals, isActiveReferral, needsReminder, pendingReminder, STATUS } from '../services/referralService'
import Button from './Button'

export default function ReferralSummary() {
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    listMyReferrals(user.id).then(rows => { if (active) setState({ userId: user.id, rows }) }).catch(error => {
      if (active) setState({ userId: user.id, error: error.message || 'Unable to load referrals.' })
    })
    return () => { active = false }
  }, [user.id, attempt])
  const ready = state?.userId === user.id
  const referrals = ready && !state.error ? state.rows.filter(isActiveReferral) : []
  return <article className="card dashboard-section"><h2>Your referrals</h2>{!ready ? <p role="status">Loading referral progress…</p> : state.error ? <><p className="error" role="alert">{state.error}</p><Button onClick={() => setAttempt(previous => previous + 1)}>Try again</Button></> : <><p><strong>{referrals.length}</strong> active {referrals.length === 1 ? 'referral' : 'referrals'}</p>{referrals.length === 0 ? <p>No active requests. You can explore support whenever you are ready.</p> : <ul>{referrals.map(referral => <li key={referral.id}><Link to="/referrals">{referral.service?.name || 'Referral'} — {STATUS[referral.status]?.label || referral.status}</Link>{needsReminder(referral) && <p className="notice">{pendingReminder}</p>}</li>)}</ul>}</>}<Link to="/referrals">View all referrals and follow-up</Link></article>
}
