import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiGet } from './api'

const NEWS_STORAGE_KEY = '@barrio_cantonal_news'

export const INITIAL_NEWS = [
  {
    id: 1,
    title: 'Plan de Recarpeteo y Bacheo Intensivo en Cartago Centro',
    summary: 'Cuadrillas municipales inician intervención en Avenida Central y Calle 4 durante toda la semana.',
    content: 'La Dirección de Obras de la Municipalidad de Cartago informa a la ciudadanía el inicio de labores de recarpeteo asfáltico en los sectores comprendidos entre el Mercado Municipal y la Basílica de los Ángeles. Se recomienda a los conductores utilizar vías alternas hacia El Tejar y Taras.',
    category: 'Vial',
    canton: 'Cartago',
    district: 'Oriental',
    lat: 9.8644,
    lng: -83.9194,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    mediaType: 'video',
    authorEntity: 'Municipalidad de Cartago - Obras Públicas',
    publishedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    isUrgent: true,
    officialLink: 'https://muni-cartago.go.cr/comunicados/recarpeteo-nov-2026'
  },
  {
    id: 2,
    title: 'Mantenimiento del Sistema de Acueducto en Turrialba (Sector El Mora)',
    summary: 'Suspensión temporal del servicio de agua potable este miércoles por reparación de tubería madre.',
    content: 'El Acueducto Municipal de Turrialba informa que debido a trabajos de interconexión y sustitución de tubería de alta presión en el sector de El Mora y San Rafael, habrá interrupción del suministro entre las 9:00 a.m. y las 3:00 p.m. Se solicita a los vecinos recolectar agua preventiva.',
    category: 'Agua y Alcantarillado',
    canton: 'Turrialba',
    district: 'Turrialba Centro',
    lat: 9.9047,
    lng: -83.6835,
    imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    videoUrl: null,
    mediaType: 'image',
    authorEntity: 'Municipalidad de Turrialba - Acueductos',
    publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    isUrgent: false,
    officialLink: 'https://muni-turrialba.go.cr/avisos/acueducto-el-mora'
  },
  {
    id: 3,
    title: 'Habilitación de Paso en Ruta Cafetalera San Marcos - Santa María de Dota',
    summary: 'Inspección técnica concluye remoción de escombros tras lluvias de la semana en Tarrazú.',
    content: 'La Unidad de Gestión Vial de la Municipalidad de Tarrazú confirma la apertura normal del tránsito en la ruta que conecta San Marcos con los distritos productores de café. Cuadrillas permanecen atentas a cualquier alerta preventiva por lluvias.',
    category: 'Vial',
    canton: 'Tarrazú',
    district: 'San Marcos',
    lat: 9.6611,
    lng: -84.0206,
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    mediaType: 'video',
    authorEntity: 'Municipalidad de Tarrazú - Gestión Vial',
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    isUrgent: false,
    officialLink: 'https://munitarrazu.go.cr/obras/ruta-cafetalera'
  }
]

export const getNews = async (filters = {}) => {
  // Intentar consultar API de .NET 9
  try {
    const apiData = await apiGet('/news', {
      canton: filters.canton !== 'todos' ? filters.canton : undefined,
      category: filters.category !== 'todos' ? filters.category : undefined,
      urgentOnly: filters.urgentOnly ? true : undefined
    })

    if (Array.isArray(apiData) && apiData.length > 0) {
      await AsyncStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(apiData))
      return apiData
    }
  } catch {
    // Fallback a almacenamiento local
  }

  // Fallback a AsyncStorage o seed inicial
  try {
    const stored = await AsyncStorage.getItem(NEWS_STORAGE_KEY)
    let list = stored ? JSON.parse(stored) : INITIAL_NEWS

    if (filters.canton && filters.canton !== 'todos') {
      list = list.filter(n => n.canton.toLowerCase() === filters.canton.toLowerCase())
    }
    if (filters.category && filters.category !== 'todos') {
      list = list.filter(n => n.category.toLowerCase() === filters.category.toLowerCase())
    }
    if (filters.urgentOnly) {
      list = list.filter(n => n.isUrgent)
    }

    return list
  } catch {
    return INITIAL_NEWS
  }
}
