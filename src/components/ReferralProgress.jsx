import { HAPPY_PATH, STATUS } from '../services/referralService'

export default function ReferralProgress({ status }) {
  const current = HAPPY_PATH.indexOf(status)
  const metadata = STATUS[status]
  return <><span className={`badge ${metadata?.terminal && status !== 'follow_up_completed' ? 'status-ended' : ''}`}>{metadata?.label || status}</span><p>{metadata?.description}</p><ol className="referral-timeline" aria-label="Referral progress">{HAPPY_PATH.map((step, index) => <li key={step} className={current >= index ? 'reached' : ''} aria-current={step === status ? 'step' : undefined}>{STATUS[step].label}<span className="muted">{current < 0 ? 'Not on current path' : index < current ? 'Reached' : index === current ? 'Current stage' : 'Not reached'}</span></li>)}</ol></>
}
