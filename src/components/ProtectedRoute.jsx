import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth'

export default function ProtectedRoute({ allowedRoles, requireConsent = true }) {
  const { session, role, loading, consentsLoading, consents } = useAuth()
  if (loading) return <p role="status">Loading your account…</p>
  if (!session) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />
  if (requireConsent && role === 'individual') {
    if (consentsLoading) return <p role="status">Loading your preferences…</p>
    if (consents.terms !== true) return <Navigate to="/consent" replace />
  }
  return <Outlet />
}
