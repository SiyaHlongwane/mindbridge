import { crisisContact } from '../data/safety'

export default function CrisisBanner() {
  return <aside className="crisis-banner" aria-label="Urgent support">Need urgent help? <strong>{crisisContact}</strong><span> Contact details are awaiting verification. This platform is not an emergency service.</span></aside>
}
