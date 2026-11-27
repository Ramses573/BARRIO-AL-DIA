import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MapPin, Crosshair } from 'lucide-react'
import './LocationPickerMap.css'

const ZONE_PRESETS = [
  { name: 'Cartago', lat: 9.8644, lng: -83.9194 },
  { name: 'Turrialba', lat: 9.9047, lng: -83.6835 },
  { name: 'Tarrazú', lat: 9.6611, lng: -84.0206 }
]

const inferCanton = (lat, lng) => {
  if (lng > -83.85 && lat > 9.8) return 'Turrialba'
  if (lat < 9.75 && lng < -83.95) return 'Tarrazú'
  return 'Cartago'
}

export default function LocationPickerMap({ lat, lng, onSelectLocation }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onSelectRef = useRef(onSelectLocation)
  onSelectRef.current = onSelectLocation

  const createPinIcon = () => L.divIcon({
    className: 'picker-custom-pin',
    html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#dc2626;border:3px solid #ffffff;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;border-radius:50%;background:#ffffff;transform:rotate(45deg);"></div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  })

  const notifyPoint = async (newLat, newLng) => {
    const canton = inferCanton(newLat, newLng)
    const fallbackLabel = `Punto en ${canton} (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`
    onSelectRef.current({
      lat: newLat.toFixed(5),
      lng: newLng.toFixed(5),
      location: fallbackLabel
    })

    // Intentar geocodificación inversa rápida para obtener calle/barrio
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 1800)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&accept-language=es`,
        { signal: controller.signal }
      )
      clearTimeout(timer)
      if (res.ok) {
        const data = await res.json()
        const addr = data?.address || {}
        const parts = [
          addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood,
          addr.city || addr.town || addr.village || canton
        ].filter(Boolean)
        if (parts.length > 0) {
          onSelectRef.current({
            lat: newLat.toFixed(5),
            lng: newLng.toFixed(5),
            location: `${parts.join(', ')} (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`
          })
        }
      }
    } catch {
      // Se mantiene el texto con cantón y coordenadas
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const startLat = lat ? Number(lat) : 9.8644
    const startLng = lng ? Number(lng) : -83.9194

    const map = L.map(containerRef.current, {
      center: [startLat, startLng],
      zoom: 15,
      zoomControl: true
    })

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google Maps'
    }).addTo(map)

    const marker = L.marker([startLat, startLng], {
      draggable: true,
      icon: createPinIcon()
    }).addTo(map)

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      notifyPoint(pos.lat, pos.lng)
    })

    map.on('click', (e) => {
      marker.setLatLng(e.latlng)
      notifyPoint(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map
    markerRef.current = marker

    setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Sincronizar pin si cambia lat/lng desde GPS o URL
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    if (!lat || !lng) return
    const numLat = Number(lat)
    const numLng = Number(lng)
    if (isNaN(numLat) || isNaN(numLng)) return

    const cur = markerRef.current.getLatLng()
    if (Math.abs(cur.lat - numLat) > 0.0001 || Math.abs(cur.lng - numLng) > 0.0001) {
      markerRef.current.setLatLng([numLat, numLng])
      mapRef.current.flyTo([numLat, numLng], 16, { duration: 0.6 })
    }
  }, [lat, lng])

  const handlePresetClick = (preset) => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([preset.lat, preset.lng])
      mapRef.current.flyTo([preset.lat, preset.lng], 15, { duration: 0.6 })
    }
    notifyPoint(preset.lat, preset.lng)
  }

  return (
    <div className="location-picker-box">
      <div className="location-picker-toolbar">
        <span className="location-picker-hint">
          <MapPin size={13} className="text-blue" /> Tocá el mapa o arrastrá el pin rojo al lugar exacto
        </span>
        <div className="location-picker-presets">
          {ZONE_PRESETS.map((z) => (
            <button
              key={z.name}
              type="button"
              className="btn-zone-preset"
              onClick={() => handlePresetClick(z)}
            >
              <Crosshair size={11} /> {z.name}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="location-picker-canvas" />
    </div>
  )
}
