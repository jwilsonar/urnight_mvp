import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { color } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.crimson,
        tabBarInactiveTintColor: color.smoke,
        tabBarStyle: {
          backgroundColor: color.bgBase,
          borderTopColor: color.steel,
        },
        sceneStyle: { backgroundColor: color.bgRoot },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color: tint, size }) => (
            <Ionicons name="moon" size={size} color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="eventos"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color: tint, size }) => (
            <Ionicons name="calendar" size={size} color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="entradas"
        options={{
          title: 'Entradas',
          tabBarIcon: ({ color: tint, size }) => (
            <Ionicons name="ticket" size={size} color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color: tint, size }) => (
            <Ionicons name="person-circle" size={size} color={tint} />
          ),
        }}
      />
    </Tabs>
  );
}
