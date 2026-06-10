import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import SearchScreen from './src/screens/SearchScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import AccountScreen from './src/screens/AccountScreen';
import { AuthProvider } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Search') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'Watchlist') {
                iconName = focused ? 'bookmark' : 'bookmark-outline';
              } else if (route.name === 'Account') {
                iconName = focused ? 'person' : 'person-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#e63946',
            tabBarInactiveTintColor: '#888',
            tabBarStyle: {
              backgroundColor: '#1a1a2e',
              borderTopColor: '#333',
            },
            headerStyle: {
              backgroundColor: '#1a1a2e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          })}
        >
          <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{ title: 'ReAmped' }}
          />
          <Tab.Screen
            name="Watchlist"
            component={WatchlistScreen}
            options={{ title: 'My Watchlist' }}
          />
          <Tab.Screen
            name="Account"
            component={AccountScreen}
            options={{ title: 'Account' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
