import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '../components/navigation/TabBarIcon';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      {/* Hide the index tab - it just redirects to closet */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
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
          title: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'add-circle' : 'add-circle-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfits/builder"
        options={{
          title: 'Outfits',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'cube' : 'cube-outline'} color={color} />
          ),
        }}
      />
      {/* Hide the old outfits list - accessed via builder */}
      <Tabs.Screen
        name="outfits/index"
        options={{
          href: null,
        }}
      />
      {/* Random screen is accessible via navigation from builder */}
      <Tabs.Screen
        name="outfits/random"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="item/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="outfits/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
