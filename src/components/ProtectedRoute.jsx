import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth'

export default function ProtectedRoute({ allowedRoles }) {
  const { session, role, loading } = useAuth()
  if (loading) return <p role="status">Loading your account…</p>
  if (!session) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
