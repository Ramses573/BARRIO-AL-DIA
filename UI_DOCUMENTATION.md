# UI Documentation – Barrio al Día

Este documento describe cada una de las pantallas (ventanas) de la aplicación web **Barrio al Día** tal como aparecen en el anexo del documento original.  Cada sección incluye:

- **Objetivo** de la pantalla.
- **Ruta** de la aplicación (React Router).
- **Componentes React** involucrados.
- **Breve descripción visual** (placeholders de captura de pantalla que pueden reemplazarse con imágenes reales).
- **Ejemplo de código** relevante ( JSX / CSS )

---

## 1️⃣ Home – `"/"`

**Objetivo**: Bienvenida y explicación rápida del proyecto.

**Componentes**: `Home.jsx` + `Home.css`.

**Vista previa**:

![Home screen](./screens/home.png)

**Código clave**:

```tsx
// src/pages/Home.jsx
export default function Home() {
  return (
    <div className="home">
      <h2>¡Bienvenido a Barrio al Día!</h2>
      <p>Esta plataforma te permite reportar incidentes en tu comunidad y consultar información en tiempo real.</p>
      <p>Usa el menú para navegar y contribuir a una comunidad más segura.</p>
    </div>
  )
}
```
---

## 2️⃣ Reportar Incidente – `"/report"`

**Objetivo**: Permitir al usuario registrar un nuevo incidente (ubicación, fecha, categoría, descripción y foto opcional).

**Componentes**: `ReportIncident.jsx` + `ReportIncident.css`.

**Vista previa**:

![Report Incident screen](./screens/report.png)

**Código clave** (formulario React):

```tsx
export default function ReportIncident() {
  const [form, setForm] = useState({ ... })
  // manejadores de cambio y envío
  return (
    <form onSubmit={handleSubmit}>...</form>
  )
}
```
---

## 3️⃣ Incidentes – `"/incidents"`

**Objetivo**: Listar los incidentes registrados (por ahora datos mock; futuro uso de API).

**Componentes**: `Incidents.jsx` + `Incidents.css`.

**Vista previa**:

![Incidents screen](./screens/incidents.png)

**Código clave**:

```tsx
const mockIncidents = [
  { id: 1, location: 'Calle 5', category: 'Alumbrado', date: '2026-11-10' },
  ...
]
return (
  <ul>{mockIncidents.map(i => <li key={i.id}>...</li>)}</ul>
)
```
---

## 4️⃣ Notificaciones – `"/notifications"`

**Objetivo**: Mostrar alertas recientes de la comunidad (por ejemplo, fallas de alumbrado, inundaciones).

**Componentes**: `Notifications.jsx` + `Notifications.css`.

**Vista previa**:

![Notifications screen](./screens/notifications.png)

**Código clave**:

```tsx
const mockNotifications = [
  { id: 1, text: 'Falla de alumbrado en Av. Central', date: '2026-11-20' },
  ...
]
```
---

## 5️⃣ Mapa de Incidentes – `"/map"`

**Objetivo**: Visualizar la ubicación geográfica de los incidentes en un mapa interactivo (placeholder actual; futuro Leaflet/Google Maps).

**Componentes**: `Map.jsx` + `Map.css`.

**Vista previa**:

![Map screen placeholder](./screens/map.png)

**Código clave**:

```tsx
export default function Map() {
  return (
    <div className="map-page">
      <h2>Mapa de Incidentes</h2>
      <div className="map-placeholder">[Mapa interactivo aquí]</div>
    </div>
  )
}
```
---

## 6️⃣ Navbar – Navegación global

**Componente**: `Navbar.jsx` + `Navbar.css`.

Incluye enlaces a todas las rutas anteriores y al nuevo **Mapa**.

```tsx
<ul>
  <li><Link to="/">Inicio</Link></li>
  <li><Link to="/report">Reportar Incidente</Link></li>
  <li><Link to="/incidents">Incidentes</Link></li>
  <li><Link to="/notifications">Notificaciones</Link></li>
  <li><Link to="/map">Mapa</Link></li>
</ul>
```
---

## 📂 Estructura del proyecto (resumen)

```
frontend/
├─ src/
│  ├─ components/
│  │   └─ Navbar.{jsx,css}
│  ├─ pages/
│  │   ├─ Home.{jsx,css}
│  │   ├─ ReportIncident.{jsx,css}
│  │   ├─ Incidents.{jsx,css}
│  │   ├─ Notifications.{jsx,css}
│  │   └─ Map.{jsx,css}
│  └─ App.jsx
├─ index.html
├─ package.json
└─ vite.config.js
```

---

## ✅ Próximos pasos recomendados
1. **Agregar capturas reales** a la carpeta `frontend/screens/` (home.png, report.png, etc.).
2. **Implementar el backend** (API REST) y reemplazar los datos mock.
3. **Integrar Leaflet** o **Google Maps** dentro de `Map.jsx`.
4. **Añadir pruebas** con Jest + React Testing Library.
5. **Configurar CI** en GitHub Actions para lint, test y build.

---

*Este documento está listo para copiar‑pegar en el repositorio como `UI_DOCUMENTATION.md`.*