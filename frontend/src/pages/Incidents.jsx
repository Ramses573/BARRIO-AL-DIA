import React from 'react'
import './Incidents.css'

// Datos mock; reemplazar con llamada a API cuando exista backend
const mockIncidents = [
  { id: 1, location: 'Calle 5', category: 'Alumbrado', date: '2026-11-10' },
  { id: 2, location: 'Parque Central', category: 'Inundación', date: '2026-11-12' },
  { id: 3, location: 'Avenida Principal', category: 'Accidente', date: '2026-11-15' },
]

export default function Incidents() {
  return (
    <div className="incidents">
      <h2>Incidentes registrados</h2>
      {mockIncidents.length === 0 ? (
        <p>No hay incidentes por el momento.</p>
      ) : (
        <ul>
          {mockIncidents.map(i => (
            <li key={i.id}>
              <strong>{i.category}</strong> – {i.location} ({i.date})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
