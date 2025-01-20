// components/NavBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';

type Route = {
  path: '/' | '/Home' | '/IncomeScreen' | '/ExpanseScreen' | '/SummaryScreen';
  label: string;
};

const NavBar: React.FC = () => {
  const currentPath = usePathname();

  const routes: Route[] = [
    { path: '/Home', label: 'Home' },
    { path: '/IncomeScreen', label: 'Income' },
    { path: '/ExpanseScreen', label: 'Spending' },
    { path: '/SummaryScreen', label: 'Summary' }
  ];

  return (
    <View style={styles.navBar}>
      {routes.map((route) => (
        <TouchableOpacity
          key={route.path}
          style={[
            styles.navButton,
            currentPath === route.path && styles.activeNavButton
          ]}
          onPress={() => router.push(route.path)}
        >
          <Text style={[
            styles.navButtonText,
            currentPath === route.path && styles.activeNavButtonText
          ]}>
            {route.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  activeNavButton: {
    backgroundColor: '#f0f0f0',
  },
  navButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  activeNavButtonText: {
    fontWeight: 'bold',
  },
});

export default NavBar