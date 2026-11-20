import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ReportIncident from './pages/ReportIncident'
import Incidents from './pages/Incidents'
import Notifications from './pages/Notifications'
import Map from './pages/Map'

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<ReportIncident />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </Router>
  )
}
