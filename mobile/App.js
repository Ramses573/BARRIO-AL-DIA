import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0284c7" />

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
        </View>

        {/* Tarjetas de Acceso Rápido */}
        <Text style={styles.sectionTitle}>Módulos Ciudadanos</Text>

        <View style={styles.cardsGrid}>
          {/* Tarjeta 1: Reporte Ciudadano */}
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="camera" size={26} color="#0284c7" />
            </View>
            <Text style={styles.cardTitle}>Reportar Incidencia</Text>
            <Text style={styles.cardDesc}>Captura foto, video corto y GPS en vivo de la situación.</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLink, { color: '#0284c7' }]}>Abrir formulario ›</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 2: Seguimiento de Ticket */}
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="search" size={26} color="#d97706" />
            </View>
            <Text style={styles.cardTitle}>Seguimiento de Ticket</Text>
            <Text style={styles.cardDesc}>Consulta el estado oficial de tu reporte con tu código TKT.</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLink, { color: '#d97706' }]}>Rastrear ticket ›</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 3: Boletín Cantonal */}
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="newspaper" size={26} color="#059669" />
            </View>
            <Text style={styles.cardTitle}>Boletín de Noticias</Text>
            <Text style={styles.cardDesc}>Alertas oficiales de CNE, cierres viales y acueductos.</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLink, { color: '#059669' }]}>Ver avisos ›</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 4: Asistencia con Audio */}
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="mic" size={26} color="#7c3aed" />
            </View>
            <Text style={styles.cardTitle}>Asistencia Comunitaria</Text>
            <Text style={styles.cardDesc}>Chat de ayuda vinculado al ticket con soporte para notas de voz.</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLink, { color: '#7c3aed' }]}>Iniciar chat ›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Estado de Sincronización del Sistema */}
        <View style={styles.statusBox}>
          <Ionicons name="shield-checkmark" size={20} color="#0284c7" />
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
    backgroundColor: '#0284c7',
  },
  header: {
    backgroundColor: '#0284c7',
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
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: '#0f172a',
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
    color: '#38bdf8',
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
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  cardsGrid: {
    gap: 14,
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#0f172a',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12.5,
    color: '#64748b',
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
    color: '#0369a1',
  },
  statusBoxDesc: {
    fontSize: 11.5,
    color: '#0284c7',
    marginTop: 2,
  },
})
