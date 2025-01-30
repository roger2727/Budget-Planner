import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface CustomHeaderProps {
  title: string;
  iconName: string;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, iconName }) => {
  return (
    <View style={styles.headerContainer}>
      <Icon name={iconName} size={20} color="white" /> {/* FontAwesome Icon */}
      <Text style={styles.headerTitle}>{title}</Text> {/* Title wrapped in <Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10, // Space between icon and title
  },
});

export default CustomHeader;