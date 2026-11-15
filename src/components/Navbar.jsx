import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, HeartHandshake } from 'lucide-react'
import { useAuth } from '../context/auth'
import Button from './Button'

export default function Navbar() {
  const { session, role, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function logout() {
    setError('')
    try {
      const { error } = await signOut()
      if (error) throw error
      setOpen(false)
      navigate('/')
    } catch (error) { setError(error.message || 'Unable to log out. Please try again.') }
  }
  return <header className="site-header"><div className="nav-shell">
    <Link to="/" className="brand" onClick={() => setOpen(false)}><HeartHandshake aria-hidden="true" />MindBridge</Link>
    <Button className="menu-toggle button-secondary" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
    <nav id="main-nav" className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation" onClick={event => { if (event.target.closest('a')) setOpen(false) }}>
      {session && <><NavLink to="/dashboard">Dashboard</NavLink><NavLink to="/assessment">Assessment</NavLink><NavLink to="/support">Support</NavLink><NavLink to="/referrals">Referrals</NavLink></>}
      {session && ['professional', 'admin'].includes(role) && <NavLink to="/professional">Professional</NavLink>}
      {session && role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      <NavLink to="/privacy">Privacy</NavLink>
      {session ? <Button className="button-secondary" onClick={logout}>Log out</Button> : <><NavLink to="/login">Log in</NavLink><Link className="button" to="/register">Get started</Link></>}
    </nav>
  </div>{error && <p className="error nav-error" role="alert">{error}</p>}</header>
}
