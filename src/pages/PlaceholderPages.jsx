import { Link } from 'react-router-dom'

function Placeholder({ title, children }) {
  return <section className="page-intro"><p className="eyebrow">MINDBRIDGE · FOUNDATION PREVIEW</p><h1>{title}</h1><div className="card"><span className="badge">Coming in a later step</span><p>{children}</p><p className="muted">This feature is not active yet. No demonstration health data is being shown.</p></div></section>
}
export function Admin() { return <Placeholder title="Administration">Service listings, account management and audit tools will be added with backend-enforced permissions.</Placeholder> }
export function NotFound() { return <section className="page-intro"><p className="eyebrow">404</p><h1>Let’s find your way back.</h1><p>That page doesn’t exist.</p><Link className="button" to="/">Back to home</Link></section> }
