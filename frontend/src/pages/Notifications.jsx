import React from 'react'
import './Notifications.css'

// Mock notifications; later será alimentado por API o websockets
const mockNotifications = [
  { id: 1, text: 'Falla de alumbrado en Av. Central', date: '2026-11-20' },
  { id: 2, text: 'Inundación leve en zona Norte', date: '2026-11-18' },
]

export default function Notifications() {
  return (
    <div className="notifications">
      <h2>Notificaciones</h2>
      {mockNotifications.length === 0 ? (
        <p>No hay notificaciones recientes.</p>
      ) : (
        <ul>
          {mockNotifications.map(n => (
            <li key={n.id}>
              {n.text} – <em>{n.date}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
