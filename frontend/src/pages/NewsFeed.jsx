import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Newspaper,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  ExternalLink,
  Filter,
  CheckCircle2,
  Flame,
  Droplets,
  Construction,
  Zap,
  Radio,
  PlusCircle,
  X,
  Video,
  Navigation
} from 'lucide-react'
import { fetchNewsFromApi, getNews } from '../services/newsService'
import './NewsFeed.css'

export default function NewsFeed() {
  const navigate = useNavigate()
  const [news, setNews] = useState(getNews())
  const [selectedCanton, setSelectedCanton] = useState('todos')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)

  useEffect(() => {
    loadNews()
  }, [selectedCanton, selectedCategory, urgentOnly])

  const loadNews = async () => {
    try {
      const data = await fetchNewsFromApi({
        canton: selectedCanton,
        category: selectedCategory,
        urgentOnly
      })
      if (Array.isArray(data)) {
        setNews(data)
      }
    } catch {
      // Fallback a caché
    }
  }

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Vial': return <Construction size={14} className="text-amber" />
      case 'Agua y Alcantarillado': return <Droplets size={14} className="text-blue" />
      case 'Alerta CNE': return <AlertTriangle size={14} className="text-red" />
      case 'Electricidad': return <Zap size={14} className="text-purple" />
      default: return <Radio size={14} className="text-green" />
    }
  }

  return (
    <div className="news-page-wrapper">
      <div className="news-container">

        {/* Encabezado */}
        <header className="news-header">
          <div className="news-badge">
            <Radio size={13} className="inline-icon" /> COMUNICADOS OFICIALES Y ALERTAS CANTONALES
          </div>
          <h1>Boletín Cantonal en Tiempo Real</h1>
          <p className="news-subtitle">
            Avisos de obras viales, cortes programados de agua, alertas meteorológicas y comunicados oficiales de las Municipalidades de Cartago, Turrialba y Tarrazú.
          </p>

          {/* Filtros */}
          <div className="news-filters-bar">
            <div className="filter-group">
              <label htmlFor="canton-filter">
                <MapPin size={13} className="inline-icon text-blue" /> Cantón:
              </label>
              <select
                id="canton-filter"
                value={selectedCanton}
                onChange={(e) => setSelectedCanton(e.target.value)}
                className="news-select"
              >
                <option value="todos">Todos los cantones</option>
                <option value="Cartago">Cartago</option>
                <option value="Turrialba">Turrialba</option>
                <option value="Tarrazú">Tarrazú</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="cat-filter">
                <Filter size={13} className="inline-icon text-blue" /> Categoría:
              </label>
              <select
                id="cat-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="news-select"
              >
                <option value="todos">Todas las categorías</option>
                <option value="Vial">Obras Viales / Cierres</option>
                <option value="Agua y Alcantarillado">Agua y Acueductos</option>
                <option value="Alerta CNE">Alertas y Emergencias CNE</option>
                <option value="Electricidad">Alumbrado y Electricidad</option>
                <option value="Comunitario">Gestión Comunitaria</option>
              </select>
            </div>

            <label className="checkbox-urgent-label">
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={(e) => setUrgentOnly(e.target.checked)}
              />
              <span>Solo avisos urgentes</span>
            </label>
          </div>
        </header>

        {/* Listado de Noticias */}
        <div className="news-grid">
          {news.length === 0 ? (
            <div className="news-empty-card">
              <Newspaper size={36} className="text-muted" />
              <h3>No hay avisos para los filtros seleccionados</h3>
              <p>Probá cambiando de cantón o categoría para ver comunicados recientes.</p>
            </div>
          ) : (
            news.map((item) => (
              <article
                key={item.id}
                className={`news-card ${item.isUrgent ? 'urgent-border' : ''}`}
                onClick={() => setSelectedArticle(item)}
              >
                {/* Imagen / Video Preview Thumbnail */}
                {item.imageUrl && (
                  <div className="news-card-media-banner">
                    <img src={item.imageUrl} alt={item.title} className="news-card-media-img" />
                    {item.mediaType === 'video' && (
                      <span className="news-media-pill video-pill">
                        <Video size={12} /> Video adjunto
                      </span>
                    )}
                  </div>
                )}

                <div className="news-card-body-content">
                  <div className="news-card-header">
                    <div className="news-tags-row">
                      <span className="news-canton-chip">
                        <MapPin size={11} /> {item.canton}
                      </span>
                      <span className="news-category-chip">
                        {getCategoryIcon(item.category)} {item.category}
                      </span>
                      {item.isUrgent && (
                        <span className="news-urgent-chip">
                          <Flame size={12} /> URGENTE
                        </span>
                      )}
                    </div>
                    <span className="news-date">
                      <Calendar size={12} className="inline-icon" />{' '}
                      {new Date(item.publishedAt).toLocaleDateString('es-CR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-summary">{item.summary}</p>

                  <div className="news-card-footer">
                    <div className="news-author">
                      <Building2 size={13} className="inline-icon text-blue" />
                      <span>{item.authorEntity}</span>
                    </div>

                    <div className="news-card-actions">
                      <button
                        type="button"
                        className="btn-news-map-shortcut"
                        title="Ver en el mapa en tiempo real"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/map?lat=${item.lat || 9.8644}&lng=${item.lng || -83.9194}&title=${encodeURIComponent(item.title)}`)
                        }}
                      >
                        <Navigation size={12} className="inline-icon" /> Ver en mapa
                      </button>
                      <button type="button" className="btn-read-more">
                        Detalles →
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Modal de Lectura de Comunicado Completo */}
        {selectedArticle && (
          <div className="news-modal-backdrop" onClick={() => setSelectedArticle(null)}>
            <div className="news-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="news-modal-header">
                <div className="news-modal-badges">
                  <span className="news-canton-chip">
                    <MapPin size={12} /> {selectedArticle.canton}
                  </span>
                  <span className="news-category-chip">
                    {getCategoryIcon(selectedArticle.category)} {selectedArticle.category}
                  </span>
                  {selectedArticle.isUrgent && (
                    <span className="news-urgent-chip">
                      <Flame size={12} /> ALERTA URGENTE
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-close-news-modal"
                  onClick={() => setSelectedArticle(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Evidencia Multimedia en el Modal (Video o Foto) */}
              {selectedArticle.videoUrl ? (
                <div className="news-modal-media-frame">
                  <video
                    src={selectedArticle.videoUrl}
                    poster={selectedArticle.imageUrl}
                    controls
                    playsInline
                    className="news-modal-video-player"
                  />
                  <div className="media-caption-bar">
                    <Video size={13} className="inline-icon" /> Video testimonial / evidencia de la situación en vivo
                  </div>
                </div>
              ) : selectedArticle.imageUrl ? (
                <div className="news-modal-media-frame">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="news-modal-photo-img"
                  />
                </div>
              ) : null}

              <h2>{selectedArticle.title}</h2>

              <div className="news-modal-meta">
                <span>
                  <Building2 size={13} className="inline-icon text-blue" /> Emisor:{' '}
                  <strong>{selectedArticle.authorEntity}</strong>
                </span>
                <span>
                  <Calendar size={13} className="inline-icon text-blue" /> Publicado:{' '}
                  {new Date(selectedArticle.publishedAt).toLocaleString('es-CR')}
                </span>
              </div>

              <div className="news-modal-body">
                <p>{selectedArticle.content}</p>
              </div>

              {/* Botón de Navegación Directa al Mapa */}
              <div className="news-modal-cta-row">
                <button
                  type="button"
                  className="btn-modal-map-link"
                  onClick={() => {
                    navigate(`/map?lat=${selectedArticle.lat || 9.8644}&lng=${selectedArticle.lng || -83.9194}&title=${encodeURIComponent(selectedArticle.title)}`)
                  }}
                >
                  <Navigation size={15} className="inline-icon" /> Ver punto exacto en el Mapa en Tiempo Real
                </button>

                {selectedArticle.officialLink && (
                  <a
                    href={selectedArticle.officialLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-official-external-link"
                  >
                    Portal Municipal <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
