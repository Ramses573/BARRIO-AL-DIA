import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import OfflineSyncBanner from './components/OfflineSyncBanner'
import Home from './pages/Home'
import ReportIncident from './pages/ReportIncident'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import Notifications from './pages/Notifications'
import Map from './pages/Map'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import TrackIncident from './pages/TrackIncident'
import NewsFeed from './pages/NewsFeed'
import CommunityChatWidget from './components/CommunityChatWidget'
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
        <OfflineSyncBanner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/map" element={<Map />} />
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/track" element={<TrackIncident />} />
          <Route path="/track/:code" element={<TrackIncident />} />
          <Route path="/noticias" element={<NewsFeed />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
        <Footer />
        <CommunityChatWidget />
      </Router>
    </ToastProvider>
  )
}
