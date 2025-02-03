import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';

type Route = {
  path: '/' | '/screens/main/IncomeScreen' | '/screens/main/ExpanseScreen' | '/screens/main/SummaryScreen' | '/screens/main/SavingScreen';
  label: string;
  icon: string;
};

const NavBar: React.FC = () => {
  const currentPath = usePathname();

  const routes: Route[] = [
    { path: '/screens/main/IncomeScreen', label: 'Income', icon: 'dollar' },
    { path: '/screens/main/ExpanseScreen', label: 'Spending', icon: 'credit-card' },
    { path: '/screens/main/SavingScreen', label: 'Saving', icon: 'money' },
    { path: '/screens/main/SummaryScreen', label: 'Summary', icon: 'pie-chart' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {routes.map((route) => (
          <View key={route.path} style={styles.navItemContainer}>
            {currentPath === route.path && <View style={styles.activeIndicator} />}
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push(route.path)}
            >
              <Icon 
                name={route.icon} 
                size={40} 
                color={currentPath === route.path ? '#4F46E5' : '#666'}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f0f0f',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 25,
    backgroundColor: '#0f0f0f',
    // For Android in Expo Go
    borderTopWidth: 1,
    borderColor: 'rgba(139, 133, 247, 0.3)', // Lighter version of #8B85F7
    elevation: 24, // Increased elevation
  },
  navItemContainer: {
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -25,
    width: 35,
    height: 3,
    backgroundColor: '#4F46E5',
    alignSelf: 'center',
    borderRadius: 2,
    // For Android in Expo Go
    elevation: 8,
    borderWidth: 0.5,
    borderColor: '#8B85F7',
  },
  navButton: {
    paddingVertical: 0,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 4,
  },
});

export default NavBar;