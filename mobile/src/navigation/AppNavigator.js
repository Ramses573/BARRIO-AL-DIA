import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'

import NewsFeedScreen from '../screens/NewsFeedScreen'
import ReportScreen from '../screens/ReportScreen'
import TrackScreen from '../screens/TrackScreen'
import ChatScreen from '../screens/ChatScreen'

const Tab = createBottomTabNavigator()

export default function AppNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Noticias"
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 17,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName
          if (route.name === 'Noticias') {
            iconName = focused ? 'newspaper' : 'newspaper-outline'
          } else if (route.name === 'Reportar') {
            iconName = focused ? 'add-circle' : 'add-circle-outline'
          } else if (route.name === 'Rastrear') {
            iconName = focused ? 'search' : 'search-outline'
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
          }
          return <Ionicons name={iconName} size={22} color={color} />
        },
      })}
    >
      <Tab.Screen
        name="Noticias"
        component={NewsFeedScreen}
        options={{
          title: 'Boletín Cantonal',
          tabBarLabel: 'Noticias'
        }}
      />
      <Tab.Screen
        name="Reportar"
        component={ReportScreen}
        options={{
          title: 'Reporte Ciudadano',
          tabBarLabel: 'Reportar'
        }}
      />
      <Tab.Screen
        name="Rastrear"
        component={TrackScreen}
        options={{
          title: 'Seguimiento de Ticket',
          tabBarLabel: 'Rastrear'
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Asistencia y Chat',
          tabBarLabel: 'Asistencia'
        }}
      />
    </Tab.Navigator>
  )
}
