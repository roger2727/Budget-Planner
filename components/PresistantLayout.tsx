// components/PersistentLayout.tsx
import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import NavBar from './NavBar';

// Define the props interface to include `children`
interface PersistentLayoutProps {
  children: ReactNode;
}

const PersistentLayout: React.FC<PersistentLayoutProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Render the children (screen content) */}
      <View style={styles.content}>
        {children}
      </View>
      {/* NavBar is persistent across screens */}
      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default PersistentLayout;