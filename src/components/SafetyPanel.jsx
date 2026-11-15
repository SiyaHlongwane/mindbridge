import { Link } from 'react-router-dom'
import { crisisContact } from '../data/safety'

export default function SafetyPanel() {
  return <aside className="safety-panel" aria-labelledby="safety-title"><h2 id="safety-title">You don’t have to face this alone</h2><p>Your answer about thoughts of death or self-harm deserves care, whatever your total score. Please reach out to someone you trust or a qualified professional now. If you feel unable to stay safe, seek immediate in-person emergency help.</p><p><strong>{crisisContact}</strong><br />This contact is awaiting verification. MindBridge is not an emergency service and does not monitor your answers in real time.</p><Link className="button" to="/support">Explore human support</Link></aside>
}
