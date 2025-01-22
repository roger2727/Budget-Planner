import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';

type Route = {
  path: '/' | '/Home' | '/IncomeScreen' | '/ExpanseScreen' | '/SummaryScreen';
  label: string;
  icon: string;
};

const NavBar: React.FC = () => {
  const currentPath = usePathname();

  const routes: Route[] = [
    { path: '/Home', label: 'Home', icon: 'home' },
    { path: '/IncomeScreen', label: 'Income', icon: 'dollar' },
    { path: '/ExpanseScreen', label: 'Spending', icon: 'credit-card' },
    { path: '/SummaryScreen', label: 'Summary', icon: 'pie-chart' }
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
          <Icon 
            name={route.icon} 
            size={30} 
            color={currentPath === route.path ? '#4F46E5' : '#666'}
            style={styles.icon}
          />
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
    paddingVertical: 8,
    backgroundColor: '#171717',
    borderTopWidth: 0.5,
    borderTopColor: '#4F46E5',
    shadowColor: 'white',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  activeNavButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginBottom: 4,
  },
  navButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activeNavButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});

export default NavBar;