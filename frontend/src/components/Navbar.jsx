import React from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <h1>Barrio al Día</h1>
      <ul>
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/report">Reportar Incidente</Link></li>
        <li><Link to="/incidents">Incidentes</Link></li>
        <li><Link to="/map">Mapa</Link></li>
      </ul>
    </nav>
  )
}
