import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, HeartHandshake, Globe } from 'lucide-react'
import { useAuth } from '../context/auth'
import { useI18n } from '../context/i18n'
import Button from './Button'

export default function Navbar() {
  const { session, role, signOut } = useAuth()
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function logout() {
    setError('')
    try {
      const { error: signOutError } = await signOut()
      if (signOutError) throw signOutError
      setOpen(false)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Unable to log out. Please try again.')
    }
  }

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <HeartHandshake size={24} strokeWidth={1.9} aria-hidden="true" />
          <span>{t.brand}</span>
        </Link>

        <Button
          className="menu-toggle button-secondary"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </Button>

        <nav
          id="main-nav"
          className={open ? 'nav-links is-open' : 'nav-links'}
          aria-label="Main navigation"
          onClick={event => {
            if (event.target.closest('a')) setOpen(false)
          }}
        >
          <div className="nav-center">
            {session && role === 'individual' && (
              <>
                <NavLink to="/dashboard">{t.nav.dashboard}</NavLink>
                <NavLink to="/assessment">{t.nav.assessment}</NavLink>
                <NavLink to="/support">{t.nav.support}</NavLink>
                <NavLink to="/referrals">{t.nav.referrals}</NavLink>
              </>
            )}
            {session && role === 'professional' && (
              <>
                <NavLink to="/professional">{t.nav.professional}</NavLink>
                <NavLink to="/my-referrals">{t.nav.myRequests}</NavLink>
              </>
            )}
            {session && role === 'primary_care' && <NavLink to="/primary-care">{t.nav.primaryCare}</NavLink>}
            {session && role === 'coordinator' && <NavLink to="/coordinator">{t.nav.coordinator}</NavLink>}
            {session && role === 'admin' && (
              <>
                <NavLink to="/admin">{t.nav.admin}</NavLink>
                <NavLink to="/analytics">{t.nav.analytics}</NavLink>
              </>
            )}
            {session && role === 'analyst' && <NavLink to="/analytics">{t.nav.analytics}</NavLink>}
            <NavLink to="/privacy">{t.nav.privacy}</NavLink>
            {!session && <NavLink to="/login">{t.nav.login}</NavLink>}
          </div>

          <div className="nav-actions">
            <button
              type="button"
              className="lang-switch"
              aria-label={lang === 'en' ? 'Switch language to Arabic' : 'تبديل اللغة إلى الإنجليزية'}
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            >
              <Globe size={15} aria-hidden="true" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {session ? (
              <Button className="button-secondary nav-cta" onClick={logout}>
                {t.nav.logout}
              </Button>
            ) : (
              <Link className="button nav-cta" to="/register">
                {t.nav.register}
              </Link>
            )}
          </div>
        </nav>
      </div>
      {error && (
        <p className="error nav-error" role="alert">
          {error}
        </p>
      )}
    </header>
  )
}
