import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Map as MapIcon,
  Globe,
  Satellite,
  Mountain,
  MapPin,
  Info,
  Maximize2,
  Minimize2,
  PlusCircle,
  X,
  Layers,
  Crosshair,
  Clock
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { getIncidents, getCategories, fetchIncidentsFromApi } from '../services/incidentService'
import { useToast } from '../components/Toast'
import './Map.css'

export default function Map() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryLat = searchParams.get('lat')
  const queryLng = searchParams.get('lng')
  const queryTitle = searchParams.get('title')
  const { addToast } = useToast()
  const mapContainerRef = useRef(null)
  const mapOuterBoxRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersLayerRef = useRef(null)
  const userMarkerRef = useRef(null)
  const layersDictRef = useRef({})

  const [incidents, setIncidents] = useState(getIncidents())
  const [categories] = useState(getCategories())

  useEffect(() => {
    fetchIncidentsFromApi().then(data => {
      if (Array.isArray(data)) setIncidents(data)
    }).catch(() => {})
  }, [])
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [activeFilter, setActiveFilter] = useState('todos')
  const [timeFilter, setTimeFilter] = useState('todos')
  const [currentZone, setCurrentZone] = useState('Cartago')
  const [activeMapStyle, setActiveMapStyle] = useState('google-calles')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Accidente': return '#e53e3e'
      case 'Inundación': return '#3182ce'
      case 'Incendio': return '#dd6b20'
      case 'Poste sin luz': return '#805ad5'
      case 'Calles dañadas': return '#d97706'
      default: return '#059669'
    }
  }

  // Inicializar mapa real de Google Maps con Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Coordenadas iniciales: Si vienen en la URL (ej. desde noticias), centrar directamente ahí
    const initialLat = queryLat ? parseFloat(queryLat) : 9.8644
    const initialLng = queryLng ? parseFloat(queryLng) : -83.9194
    const initialZoom = queryLat && queryLng ? 16 : 15

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      scrollWheelZoom: true,
    })

    // 1. Google Maps Calles Oficial
    const googleStreets = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps • BarrioAlDía',
        maxZoom: 20,
      }
    )

    // 2. Google Maps Híbrido HD
    const googleHybrid = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps • BarrioAlDía',
        maxZoom: 20,
      }
    )

    // 3. Google Maps Satélite
    const googleSatellite = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps • BarrioAlDía',
        maxZoom: 20,
      }
    )

    // 4. Google Maps Terreno
    const googleTerrain = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps • BarrioAlDía',
        maxZoom: 20,
      }
    )

    googleStreets.addTo(map)

    layersDictRef.current = {
      'google-calles': googleStreets,
      'google-hibrido': googleHybrid,
      'google-satelite': googleSatellite,
      'google-terreno': googleTerrain,
    }

    // Marcador de enfoque si vino redirigido desde el boletín de noticias
    if (queryLat && queryLng) {
      const pinIcon = L.divIcon({
        className: 'custom-news-focus-pin',
        html: `
          <div style="background: #0284c7; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(2,132,199,0.7); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
            📢
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      })
      const focusMarker = L.marker([parseFloat(queryLat), parseFloat(queryLng)], { icon: pinIcon }).addTo(map)
      focusMarker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; min-width: 200px;">
          <span style="color: #0284c7; font-weight: 800; font-size: 11px; text-transform: uppercase;">Aviso del Boletín Cantonal</span>
          <h4 style="margin: 3px 0 6px; font-size: 13px; color: #1e293b;">${decodeURIComponent(queryTitle || 'Evento Cantonal')}</h4>
          <p style="margin: 0; font-size: 11.5px; color: #64748b;">📍 Ubicación en tiempo real del incidente reportado.</p>
        </div>
      `).openPopup()
    }

    // Grupo de marcadores con Clustering Inteligente
    const clusterGroup = typeof L.markerClusterGroup === 'function'
      ? L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 40,
          spiderfyOnMaxZoom: true,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount()
            return L.divIcon({
              html: `<div class="custom-cluster-badge"><span>${count}</span></div>`,
              className: 'custom-cluster-wrap',
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            })
          }
        })
      : L.layerGroup()

    clusterGroup.addTo(map)
    markersLayerRef.current = clusterGroup
    mapInstanceRef.current = map

    // Click sobre el mapa para reportar incidente con coordenadas exactas
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      const popupContainer = document.createElement('div')
      popupContainer.style.fontFamily = 'inherit'
      popupContainer.style.padding = '4px'
      popupContainer.innerHTML = `
        <strong style="color: #0284c7; font-size: 13px; display: block; margin-bottom: 3px;">📍 Punto Seleccionado</strong>
        <p style="margin: 3px 0 8px; font-size: 12px; color: #475569;">
          Coordenadas: <strong>${lat.toFixed(5)}, ${lng.toFixed(5)}</strong>
        </p>
        <button class="btn-report-popup-action" style="
          background-color: #0284c7;
          color: white;
          border: none;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          box-shadow: 0 2px 4px rgba(2,132,199,0.3);
        ">
          ➕ Reportar Incidencia Aquí
        </button>
      `

      const btn = popupContainer.querySelector('.btn-report-popup-action')
      if (btn) {
        L.DomEvent.disableClickPropagation(btn)
        btn.addEventListener('click', (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          navigate(`/report?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}`)
        })
      }

      L.popup({ autoClose: true, closeOnClick: true })
        .setLatLng(e.latlng)
        .setContent(popupContainer)
        .openOn(map)
    })

    return () => {
      map.remove()
    }
  }, [navigate])

  // Cambio dinámico de capas de Google Maps
  const switchMapStyle = (styleId) => {
    const map = mapInstanceRef.current
    const layers = layersDictRef.current
    if (!map || !layers) return

    Object.values(layers).forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    })

    if (layers[styleId]) {
      layers[styleId].addTo(map)
      setActiveMapStyle(styleId)
    }
  }

  // Filtrado temporal y categórico con Clustering
  useEffect(() => {
    const markersLayer = markersLayerRef.current
    if (!markersLayer) return

    markersLayer.clearLayers()

    const filtered = incidents.filter(i => {
      const matchesCategory = activeFilter === 'todos' || i.category === activeFilter
      
      let matchesTime = true
      if (timeFilter !== 'todos' && i.date) {
        const incDate = new Date(i.date)
        const now = new Date()
        const diffDays = (now - incDate) / (1000 * 60 * 60 * 24)
        if (timeFilter === '24h') matchesTime = diffDays <= 2
        else if (timeFilter === 'semana') matchesTime = diffDays <= 8
        else if (timeFilter === 'historico') matchesTime = diffDays > 8
      }

      return matchesCategory && matchesTime
    })

    filtered.forEach(inc => {
      const color = getCategoryColor(inc.category)

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.45);
            border: 2.5px solid white;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-weight: 800;
              font-size: 14px;
            ">!</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      const marker = L.marker([inc.lat, inc.lng], { icon: customIcon })

      marker.on('click', () => {
        setSelectedIncident(inc)
      })

      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 190px;">
          <strong style="color: ${color}; font-size: 13px;">${inc.category}</strong>
          <h4 style="margin: 4px 0 6px; font-size: 14px; color: #1e293b;">${inc.title}</h4>
          <p style="margin: 0 0 4px; font-size: 12px; color: #64748b;">📍 ${inc.location}</p>
          <p style="margin: 0 0 4px; font-size: 11.5px; color: #0284c7; font-weight: 700;">
            👤 Reportado por: ${inc.isAnonymous ? 'Anónimo Protegido' : (inc.reporterName || 'Ramsés Solano Calvo')}
          </p>
          <p style="margin: 0; font-size: 12px; color: #334155;">${inc.description}</p>
        </div>
      `)

      markersLayer.addLayer(marker)
    })
  }, [incidents, activeFilter, timeFilter])

  // Geolocalización en Vivo
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      addToast('Tu navegador no soporta geolocalización GPS.', 'warning')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const { latitude, longitude, accuracy } = pos.coords

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.5 })

          if (userMarkerRef.current) {
            mapInstanceRef.current.removeLayer(userMarkerRef.current)
          }

          const userIcon = L.divIcon({
            className: 'user-loc-pin',
            html: `
              <div class="user-pulse-beacon">
                <div class="user-beacon-core"></div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })

          const uMarker = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="font-family: inherit; min-width: 180px; text-align: center; padding: 4px;">
                <strong style="color: #0284c7; font-size: 13px;">📍 Tu Ubicación Actual</strong>
                <p style="margin: 4px 0 8px; font-size: 11px; color: #64748b;">
                  GPS con precisión de ±${Math.round(accuracy)} m
                </p>
                <button id="btn-report-my-loc" style="
                  background-color: #0284c7;
                  color: white;
                  border: none;
                  padding: 6px 12px;
                  font-size: 12px;
                  font-weight: 700;
                  border-radius: 4px;
                  cursor: pointer;
                  width: 100%;
                ">
                  Reportar incidente aquí
                </button>
              </div>
            `)
            .openPopup()

          userMarkerRef.current = uMarker

          setTimeout(() => {
            const btn = document.getElementById('btn-report-my-loc')
            if (btn) {
              btn.onclick = () => {
                navigate(`/report?lat=${latitude.toFixed(5)}&lng=${longitude.toFixed(5)}`)
              }
            }
          }, 50)
        }
        addToast('Ubicación detectada exitosamente.', 'success')
      },
      () => {
        setIsLocating(false)
        const isInsecureLan = typeof window !== 'undefined' &&
          window.isSecureContext === false &&
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1'
        addToast(
          isInsecureLan
            ? 'El navegador móvil bloquea el GPS en HTTP local (sin HTTPS). Usá los botones de cantón o reportá tocando el mapa.'
            : 'No fue posible obtener tu GPS. Verifica los permisos de ubicación de tu navegador.',
          'info'
        )
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const goToZone = (lat, lng, zoom, zoneName) => {
    if (!mapInstanceRef.current) return
    setCurrentZone(zoneName)
    mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 })
  }

  const toggleFullscreen = () => {
    const el = mapOuterBoxRef.current
    if (!el) return

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => setIsFullscreen(prev => !prev))
      } else {
        setIsFullscreen(prev => !prev)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false))
      } else {
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      }, 250)
    }

    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  return (
    <div className="real-map-page-wrapper">
      <div className="real-map-container-card">
        
        <div className="real-map-header">
          <div className="real-map-header-left">
            <div className="pdf-logo-row" style={{ marginBottom: '6px' }}>
              <span className="pdf-brand-name">Barrio<span className="pdf-brand-highlight">AlDía</span></span>
              <span className="pdf-brand-slogan" style={{ marginLeft: '12px' }}>Reportá hoy, mejorá mañana.</span>
            </div>
            <h2>Mapa Comunitario Oficial en Google Maps</h2>
            <p className="real-map-sub">
              Cartografía oficial de Google Maps con capas de Calles, Satélite Híbrido HD y Terreno • Costa Rica
            </p>
          </div>

          <div className="real-map-header-right">
            <button
              type="button"
              className={`btn-locate-me ${isLocating ? 'loading' : ''}`}
              onClick={handleLocateMe}
              title="Centrar en mi ubicación actual GPS"
            >
              <Crosshair size={14} className={`inline-icon ${isLocating ? 'icon-spin' : ''}`} />
              {isLocating ? 'Buscando...' : 'Mi Ubicación'}
            </button>

            <button
              type="button"
              className="btn-fullscreen-toggle"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={14} className="inline-icon" /> Salir Pantalla Completa
                </>
              ) : (
                <>
                  <Maximize2 size={14} className="inline-icon" /> Pantalla Completa
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-real-map-report"
              onClick={() => {
                if (mapInstanceRef.current) {
                  const center = mapInstanceRef.current.getCenter()
                  navigate(`/report?lat=${center.lat.toFixed(5)}&lng=${center.lng.toFixed(5)}`)
                } else {
                  navigate('/report')
                }
              }}
            >
              <PlusCircle size={14} className="inline-icon" /> Reportar en este Punto
            </button>
          </div>
        </div>

        {/* Barra de Control de Capas de Google Maps y Cantones */}
        <div className="map-toolbar-grid">
          <div className="layer-switcher-box">
            <span className="toolbar-label">
              <Layers size={13} className="inline-icon" /> Capa Google:
            </span>
            <div className="layer-button-group">
              <button
                className={`btn-layer ${activeMapStyle === 'google-calles' ? 'active' : ''}`}
                onClick={() => switchMapStyle('google-calles')}
              >
                <MapIcon size={13} className="inline-icon" /> Google Calles
              </button>
              <button
                className={`btn-layer ${activeMapStyle === 'google-hibrido' ? 'active' : ''}`}
                onClick={() => switchMapStyle('google-hibrido')}
              >
                <Globe size={13} className="inline-icon" /> Híbrido HD
              </button>
              <button
                className={`btn-layer ${activeMapStyle === 'google-satelite' ? 'active' : ''}`}
                onClick={() => switchMapStyle('google-satelite')}
              >
                <Satellite size={13} className="inline-icon" /> Satélite
              </button>
              <button
                className={`btn-layer ${activeMapStyle === 'google-terreno' ? 'active' : ''}`}
                onClick={() => switchMapStyle('google-terreno')}
              >
                <Mountain size={13} className="inline-icon" /> Terreno
              </button>
            </div>
          </div>

          <div className="zone-selector-box">
            <span className="toolbar-label">
              <MapPin size={13} className="inline-icon" /> Centrar cantón:
            </span>
            <div className="zone-button-group">
              <button
                className={`btn-zone ${currentZone === 'Cartago' ? 'active' : ''}`}
                onClick={() => goToZone(9.8644, -83.9194, 15, 'Cartago')}
              >
                Cartago
              </button>
              <button
                className={`btn-zone ${currentZone === 'Turrialba' ? 'active' : ''}`}
                onClick={() => goToZone(9.9047, -83.6835, 15, 'Turrialba')}
              >
                Turrialba
              </button>
              <button
                className={`btn-zone ${currentZone === 'Tarrazú' ? 'active' : ''}`}
                onClick={() => goToZone(9.6611, -84.0206, 15, 'Tarrazú')}
              >
                Tarrazú
              </button>
            </div>
          </div>
        </div>

        <div className="map-click-tip-banner">
          <Info size={15} className="inline-icon text-blue" /> <strong>Interacción directa:</strong> Haz clic en cualquier calle o inmueble de Google Maps para reportar un incidente con las coordenadas exactas de ese lugar.
        </div>

        {/* Filtros de Categoría y Temporal */}
        <div className="real-map-filter-row">
          <div className="real-map-filters">
            <button
              className={`filter-pill ${activeFilter === 'todos' ? 'active' : ''}`}
              onClick={() => setActiveFilter('todos')}
            >
              Todos ({incidents.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-pill ${activeFilter === cat.name ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat.name)}
              >
                <span className="pill-dot" style={{ backgroundColor: cat.color }}></span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Filtro Temporal */}
          <div className="time-filter-box">
            <span className="time-filter-label">
              <Clock size={12} className="inline-icon" /> Período:
            </span>
            <div className="time-pills-group">
              <button
                className={`time-pill ${timeFilter === 'todos' ? 'active' : ''}`}
                onClick={() => setTimeFilter('todos')}
              >
                Todos
              </button>
              <button
                className={`time-pill ${timeFilter === '24h' ? 'active' : ''}`}
                onClick={() => setTimeFilter('24h')}
              >
                Últimas 24h
              </button>
              <button
                className={`time-pill ${timeFilter === 'semana' ? 'active' : ''}`}
                onClick={() => setTimeFilter('semana')}
              >
                Última semana
              </button>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="real-map-grid">
          <div
            ref={mapOuterBoxRef}
            className={`leaflet-outer-box ${isFullscreen ? 'is-fullscreen' : ''}`}
          >
            <div ref={mapContainerRef} className="leaflet-map-element" />
            
            <div className="map-live-badge">
              <MapPin size={12} className="inline-icon" /> Google Maps Live • Costa Rica
            </div>

            <button
              type="button"
              className="map-floating-fs-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={13} className="inline-icon" /> Salir
                </>
              ) : (
                <>
                  <Maximize2 size={13} className="inline-icon" /> Pantalla Completa
                </>
              )}
            </button>
          </div>

          <div className="real-map-sidebar">
            <div className="sidebar-legend-box">
              <h3>Leyenda de Incidentes</h3>
              <p className="legend-desc">Los marcadores agrupan reportes cercanos para evitar sobrecarga visual en la cartografía.</p>
              
              <div className="legend-items-list">
                {categories.map(cat => (
                  <div key={cat.id} className="legend-row">
                    <span className="legend-circle" style={{ backgroundColor: cat.color }}></span>
                    <span className="legend-title">{cat.name}</span>
                  </div>
                ))}
              </div>

              <div className="legend-cuc-badge">
                <strong>BARRIOALDÍA</strong>
                <span>Google Maps Engine • Cluster HD</span>
              </div>
            </div>

            {selectedIncident ? (
              <div className="selected-incident-card">
                <div className="selected-card-header">
                  <span
                    className="selected-category-badge"
                    style={{ backgroundColor: getCategoryColor(selectedIncident.category) }}
                  >
                    {selectedIncident.category}
                  </span>
                  <button className="btn-close-selected" onClick={() => setSelectedIncident(null)}>
                    <X size={14} />
                  </button>
                </div>
                <h4>{selectedIncident.title}</h4>
                <p><strong>Ubicación:</strong> {selectedIncident.location}</p>
                <p><strong>Reportado por:</strong> <span style={{ color: '#0284c7', fontWeight: '800' }}>{selectedIncident.isAnonymous ? '🛡️ Anónimo Protegido' : (selectedIncident.reporterName || 'Ramsés Solano Calvo')}</span></p>
                <p><strong>Coordenadas:</strong> {selectedIncident.lat.toFixed(4)}, {selectedIncident.lng.toFixed(4)}</p>
                <p><strong>Fecha:</strong> {selectedIncident.date}</p>
                <p><strong>Estado:</strong> <span className="status-highlight">{selectedIncident.status}</span></p>
                <p className="incident-p-desc">{selectedIncident.description}</p>
                <div style={{ marginTop: '0.85rem' }}>
                  <Link to={`/incidents/${selectedIncident.id}`} style={{
                    display: 'block',
                    textAlign: 'center',
                    backgroundColor: 'var(--primary-color, #0284c7)',
                    color: '#ffffff',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}>
                    Ver trazabilidad completa &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="no-selection-prompt">
                <Info size={16} className="inline-icon text-blue" /> Haz clic sobre cualquier marcador o grupo en Google Maps para ver el reporte detallado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
