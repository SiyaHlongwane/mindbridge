import { Link } from 'react-router-dom'

export function NotFound() { return <section className="page-intro"><p className="eyebrow">404</p><h1>Let’s find your way back.</h1><p>That page doesn’t exist.</p><Link className="button" to="/">Back to home</Link></section> }
