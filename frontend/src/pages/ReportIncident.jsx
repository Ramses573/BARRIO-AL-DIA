import React, { useState } from 'react'
import './ReportIncident.css'

export default function ReportIncident() {
  const [form, setForm] = useState({
    location: '',
    date: '',
    category: 'Otro',
    description: '',
    photo: null,
  })

  const handleChange = e => {
    const { name, value, files } = e.target
    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    // Aquí podrías enviar a una API; por ahora solo console.log
    console.log('Reportado:', form)
    alert('Incidente reportado (simulado)')
    setForm({ location: '', date: '', category: 'Otro', description: '', photo: null })
  }

  return (
    <div className="report-incident">
      <h2>Reportar Incidente</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Ubicación:
          <input type="text" name="location" value={form.location} onChange={handleChange} required />
        </label>
        <label>
          Fecha:
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>
        <label>
          Categoría:
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="Alumbrado">Alumbrado</option>
            <option value="Inundación">Inundación</option>
            <option value="Accidente">Accidente</option>
            <option value="Otro">Otro</option>
          </select>
        </label>
        <label>
          Descripción:
          <textarea name="description" value={form.description} onChange={handleChange} required />
        </label>
        <label>
          Foto (opcional):
          <input type="file" name="photo" accept="image/*" onChange={handleChange} />
        </label>
        <button type="submit">Enviar Reporte</button>
      </form>
    </div>
  )
}
