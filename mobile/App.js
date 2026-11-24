import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from './src/theme/colors'
import { getIncidents } from './src/services/incidentService'
import { getNews } from './src/services/newsService'

export default function App() {
  const [incidentsCount, setIncidentsCount] = useState(0)
  const [newsCount, setNewsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [incidents, news] = await Promise.all([
        getIncidents(),
        getNews()
      ])
      setIncidentsCount(incidents.length)
      setNewsCount(news.length)
    } catch {
      // Ignorar fallback
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Barra de Encabezado Superior */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="office-building" size={24} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.brandTitle}>
              Barrio<Text style={styles.brandHighlight}>AlDía</Text>
            </Text>
            <Text style={styles.brandSubtitle}>Aplicativo Móvil Cantonal</Text>
          </View>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.dotOnline} />
          <Text style={styles.onlineText}>API .NET 9</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Banner de Bienvenida */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeTag}>COBERTURA OFICIAL</Text>
          <Text style={styles.welcomeTitle}>Cartago • Turrialba • Tarrazú</Text>
          <Text style={styles.welcomeDesc}>
            Plataforma ciudadana para el reporte vial, fiscalización comunitaria y asistencia en tiempo real desde tu dispositivo móvil.
          </Text>

          {/* Estadísticas en Vivo */}
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>3</Text>
              <Text style={styles.statLabel}>Cantones</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              {loading ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <Text style={styles.statNum}>{incidentsCount}</Text>
              )}
              <Text style={styles.statLabel}>Reportes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              {loading ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <Text style={styles.statNum}>{newsCount}</Text>
              )}
              <Text style={styles.statLabel}>Avisos</Text>
            </View>
          </View>
        </View>

        {/* Tarjetas de Acceso Rápido */}
        <Text style={styles.sectionTitle}>Módulos Ciudadanos</Text>

        <View style={styles.cardsGrid}>
          {/* Tarjeta 1: Reporte Ciudadano */}
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name="camera" size={26} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Reportar Incidencia</Text>
            <Text style={styles.cardDesc}>Captura foto, video corto y GPS en vivo de la situación.</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLink, { color: colors.primary }]}>Abrir formulario ›</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 2: Seguimiento de Ticket */}
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.urgencyMediumBg }]}>
              <Ionicons name="search" size={26} color={colors.vial} />
            </View>
            <Text style={styles.cardTitle}>Seguimiento de Ticket</Text>
            <Text style={styles.cardDesc}>Consulta el estado oficial de tu reporte con tu código TKT.</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLink, { color: colors.vial }]}>Rastrear ticket ›</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 3: Boletín Cantonal */}
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.urgencyLowBg }]}>
              <Ionicons name="newspaper" size={26} color={colors.community} />
            </View>
            <Text style={styles.cardTitle}>Boletín de Noticias</Text>
            <Text style={styles.cardDesc}>Alertas oficiales de CNE, cierres viales y acueductos.</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLink, { color: colors.community }]}>Ver avisos ›</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 4: Asistencia con Audio */}
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="mic" size={26} color={colors.electric} />
            </View>
            <Text style={styles.cardTitle}>Asistencia Comunitaria</Text>
            <Text style={styles.cardDesc}>Chat de ayuda vinculado al ticket con soporte para notas de voz.</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLink, { color: colors.electric }]}>Iniciar chat ›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Estado de Sincronización del Sistema */}
        <View style={styles.statusBox}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <View style={styles.statusBoxText}>
            <Text style={styles.statusBoxTitle}>Conexión Segura con el Backend</Text>
            <Text style={styles.statusBoxDesc}>Sincronizado con ASP.NET Core 9 Web API y SignalR Hub.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  brandHighlight: {
    color: '#bae6fd',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#e0f2fe',
    fontWeight: '500',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  dotOnline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  onlineText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: colors.darkHeader,
    borderRadius: 16,
    padding: 20,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  welcomeTag: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeDesc: {
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  cardsGrid: {
    gap: 14,
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cardLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  statusBoxText: {
    flex: 1,
  },
  statusBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  statusBoxDesc: {
    fontSize: 11.5,
    color: colors.primary,
    marginTop: 2,
  },
})
