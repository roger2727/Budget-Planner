import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';

type Route = {
  path: '/' | '/screens/main/IncomeScreen' | '/screens/main/Home' | '/screens/main/ExpanseScreen' | '/screens/main/SummaryScreen' | '/screens/main/SavingScreen' ;
  label: string;
  icon: string;
};

const NavBar: React.FC = () => {
  const currentPath = usePathname();

  const routes: Route[] = [
    { path: '/screens/main/Home', label: 'Home', icon: 'home' },
    { path: '/screens/main/IncomeScreen', label: 'Income', icon: 'dollar' },
    { path: '/screens/main/ExpanseScreen', label: 'Spending', icon: 'credit-card' },
    { path: '/screens/main/SavingScreen', label: 'Saving', icon: 'money' },
    { path: '/screens/main/SummaryScreen', label: 'Summary', icon: 'pie-chart' },
  ];

  return (
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
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 25,
    backgroundColor: '#0f0f0f',
    shadowColor: '#8B85F7', // Using same color as active indicator
    shadowOffset: {
        width: 0,
        height: -4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
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
    shadowColor: '#8B85F7',
    shadowOffset: {
        width: 0,
        height:0,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,

    borderRadius: 2,
    overflow: 'visible'
},
  navButton: {
    paddingVertical: 0,
    paddingHorizontal: 12,
    alignItems: 'center',

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