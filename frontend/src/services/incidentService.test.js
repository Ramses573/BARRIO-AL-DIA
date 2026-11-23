import { getIncidents, addIncident, updateIncidentStatus, wipeIncidents } from './incidentService'

describe('incidentService', () => {
  test('returns initial incidents as an array', () => {
    const list = getIncidents()
    expect(Array.isArray(list)).toBe(true)
  })

  test('adds a new incident', () => {
    const initialCount = getIncidents().length
    const newIncident = {
      title: 'Prueba de fuga de agua',
      category: 'Inundación',
      location: 'Calle 5',
      date: '2026-11-20',
      description: 'Fuga de agua potable'
    }
    const added = addIncident(newIncident)
    expect(added.id).toBeDefined()
    expect(getIncidents().length).toBe(initialCount + 1)
  })

  test('updates incident status and adds institutional note', () => {
    let list = getIncidents()
    if (list.length === 0) {
      addIncident({
        title: 'Poste sin luz',
        category: 'Poste sin luz',
        location: 'Av Central',
        date: '2026-11-20',
        description: 'Luminaria apagada'
      })
      list = getIncidents()
    }
    const target = list[0]
    const updated = updateIncidentStatus(target.id, 'En atención', 'Cuadrilla 2 asignada')
    expect(updated).toBeDefined()
    expect(updated.status).toBe('En atención')
    expect(updated.institutionalNote).toBe('Cuadrilla 2 asignada')
    expect(updated.statusHistory.length).toBeGreaterThan(0)
  })

  test('wipes incidents cleanly for zero-data testing', async () => {
    const res = await wipeIncidents()
    expect(res).toBeDefined()
    expect(getIncidents().length).toBe(0)
  })
})
