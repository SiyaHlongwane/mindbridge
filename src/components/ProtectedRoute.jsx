import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth'

const ROLE_DESTINATIONS = {
  individual: '/dashboard',
  professional: '/professional',
  primary_care: '/primary-care',
  coordinator: '/coordinator',
  admin: '/admin',
  analyst: '/analytics',
}

export default function ProtectedRoute({ allowedRoles, requireConsent = true }) {
  const { session, role, loading, consentsLoading, consents } = useAuth()
  if (loading) return <p role="status">Loading your account…</p>
  if (!session) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_DESTINATIONS[role] || '/dashboard'} replace />
  }
  if (requireConsent && role === 'individual') {
    if (consentsLoading) return <p role="status">Loading your preferences…</p>
    if (consents.terms !== true) return <Navigate to="/consent" replace />
  }
  return <Outlet />
}
