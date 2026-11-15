import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import CrisisBanner from './components/CrisisBanner'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import { Referrals, ProfessionalDashboard, Admin, NotFound } from './pages/PlaceholderPages'
import Support from './pages/Support'
import Dashboard from './pages/Dashboard'
import Assessment from './pages/Assessment'
import Results from './pages/Results'
import Consent from './pages/Consent'
import Privacy from './pages/Privacy'

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
      <Route path="/results" element={<Dashboard />} />
      <Route path="/results/:id" element={<Results />} />
      <Route path="/support" element={<Support />} />
      <Route path="/referrals" element={<Referrals />} />
    </Route>
    <Route element={<ProtectedRoute allowedRoles={['professional', 'admin']} />}><Route path="/professional" element={<ProfessionalDashboard />} /></Route>
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}><Route path="/admin" element={<Admin />} /></Route>
    <Route path="*" element={<NotFound />} />
  </Routes></main><footer className="site-footer">MindBridge · Earlier, safer mental-wellbeing support. Not a diagnostic or emergency service.</footer><CrisisBanner /></AuthProvider></BrowserRouter>
}
