import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadows } from '../theme/colors'
import { getWebMapUrl, WEB_APP_URL } from '../config'

const CANTONES_MAP = [
  {
    name: 'Cartago Centro',
    canton: 'Cartago',
    desc: 'Casco central, Taras, El Tejar y zonas industriales',
    lat: 9.8644,
    lng: -83.9194,
    icon: 'business'
  },
  {
    name: 'Turrialba',
    canton: 'Turrialba',
    desc: 'Sector El Mora, La Suiza, Santa Rosa y cuenca del río',
    lat: 9.9047,
    lng: -83.6835,
    icon: 'water'
  },
  {
    name: 'Zona Los Santos (Tarrazú)',
    canton: 'Tarrazú',
    desc: 'San Marcos, San Lorenzo y rutas cafetaleras',
    lat: 9.6611,
    lng: -84.0206,
    icon: 'trail-sign'
  }
]

export default function MapScreen() {
  const handleOpenGlobalMap = () => {
    Linking.openURL(`${WEB_APP_URL}/map`)
  }

  const handleOpenCanton = (c) => {
    Linking.openURL(getWebMapUrl(c.lat, c.lng, `Cantón de ${c.name}`))
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tarjeta Principal de Entrada al Mapa Web */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="radio" size={14} color="#ffffff" />
          <Text style={styles.heroBadgeText}>SISTEMA GEOGRÁFICO EN VIVO</Text>
        </View>

        <Text style={styles.heroTitle}>Mapa Cantonal en Tiempo Real</Text>
        <Text style={styles.heroDesc}>
          Visualizá todas las afectaciones viales, inundaciones, postes sin luz y cuadrillas de Cartago, Turrialba y Tarrazú en el mapa interactivo oficial.
        </Text>

        <TouchableOpacity
          style={styles.btnLaunchWebMap}
          onPress={handleOpenGlobalMap}
          activeOpacity={0.85}
        >
          <Ionicons name="map" size={18} color="#ffffff" />
          <Text style={styles.btnLaunchWebMapText}>Abrir Mapa en el Aplicativo Web</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Accesos Directos por Cantón */}
      <Text style={styles.sectionTitle}>Sectores Cantonales Monitoreados</Text>

      {CANTONES_MAP.map((c) => (
        <TouchableOpacity
          key={c.name}
          style={styles.cantonCard}
          onPress={() => handleOpenCanton(c)}
          activeOpacity={0.8}
        >
          <View style={styles.cantonIconWrap}>
            <Ionicons name={c.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.cantonInfo}>
            <Text style={styles.cantonName}>{c.name}</Text>
            <Text style={styles.cantonDesc}>{c.desc}</Text>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      ))}

      {/* Nota informativa */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={18} color={colors.textMuted} />
        <Text style={styles.infoBannerText}>
          El mapa interactivo se despliega en tiempo real en la plataforma web vinculada ({WEB_APP_URL}).
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...shadows.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  heroDesc: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  btnLaunchWebMap: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnLaunchWebMapText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  cantonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...shadows.sm,
  },
  cantonIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cantonInfo: {
    flex: 1,
  },
  cantonName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 2,
  },
  cantonDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgSubtle,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  infoBannerText: {
    fontSize: 11.5,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
})
