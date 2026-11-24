import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ReportIncident from './pages/ReportIncident'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import Notifications from './pages/Notifications'
import Map from './pages/Map'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import TrackIncident from './pages/TrackIncident'
import { isAuthenticated } from './services/authService'

function ProtectedRoute({ children }) {
  const isAuth = isAuthenticated()
  const location = useLocation()

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/track" element={<TrackIncident />} />
          <Route path="/track/:code" element={<TrackIncident />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
          <Route path="/incidents/:id" element={<ProtectedRoute><IncidentDetail /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Footer />
      </Router>
    </ToastProvider>
  )
}
