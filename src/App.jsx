import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/auth'
import Navbar from './components/Navbar'
import CrisisBanner from './components/CrisisBanner'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import { NotFound } from './pages/PlaceholderPages'
import Admin from './pages/Admin'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import Referrals from './pages/Referrals'
import Support from './pages/Support'
import Dashboard from './pages/Dashboard'
import Assessment from './pages/Assessment'
import Results from './pages/Results'
import Consent from './pages/Consent'
import Privacy from './pages/Privacy'

function ReferralHome() {
  const { role } = useAuth()
  const [params] = useSearchParams()
  const qs = params.toString()
  if (role === 'professional') {
    // Preserve ?service=... so the referral form pre-selects the right service.
    // Without a service param, send professionals to their primary workspace.
    return <Navigate to={qs ? `/my-referrals?${qs}` : '/professional'} replace />
  }
  return <Referrals />
}

export default function App() {
  return <BrowserRouter><AuthProvider><a className="skip-link" href="#main">Skip to content</a><Navbar /><main id="main" className="container"><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route element={<ProtectedRoute requireConsent={false} />}><Route path="/consent" element={<Consent />} /></Route>
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/results" element={<Navigate to="/dashboard" replace />} />
      <Route path="/results/:id" element={<Results />} />
      <Route path="/support" element={<Support />} />
    </Route>
    <Route element={<ProtectedRoute allowedRoles={['individual', 'professional']} />}>
      <Route path="/referrals" element={<ReferralHome />} />
      <Route element={<ProtectedRoute allowedRoles={['professional']} />}><Route path="/my-referrals" element={<Referrals />} /></Route>
    </Route>
    <Route element={<ProtectedRoute allowedRoles={['professional', 'admin']} />}><Route path="/professional" element={<ProfessionalDashboard />} /></Route>
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}><Route path="/admin" element={<Admin />} /></Route>
    <Route path="*" element={<NotFound />} />
  </Routes></main><footer className="site-footer">MindBridge · Earlier, safer mental-wellbeing support. Not a diagnostic or emergency service.</footer><CrisisBanner /></AuthProvider></BrowserRouter>
}
