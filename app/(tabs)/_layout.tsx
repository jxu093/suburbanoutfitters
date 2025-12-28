import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '../components/navigation/TabBarIcon'; // Corrected import path
import { Colors } from '../constants/theme'; // Corrected import path
import { useColorScheme } from '../hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="closet/index"
        options={{
          title: 'Closet',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'shirt' : 'shirt-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Item',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'add-circle' : 'add-circle-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfits/index"
        options={{
          title: 'Outfits',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'cube' : 'cube-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfits/builder"
        options={{
          title: 'Outfit Builder',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'build' : 'build-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfits/random"
        options={{
          title: 'Random Outfit',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'shuffle' : 'shuffle-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
