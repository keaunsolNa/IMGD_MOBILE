import React from 'react';
import { View, Text } from 'react-native';
import Button from '../components/Button';
import { styles } from '@/styles/screens/home/HomeScreen';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Left Sidebar */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Menus</Text>
        <View style={styles.buttonContainer}>
          <Button title="Group" onPress={() => navigation.navigate('Groups')} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="File" onPress={() => navigation.navigate('File')} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Friend" onPress={() => navigation.navigate('Friend')} />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome to IMGD</Text>
        </View>
        <Text style={styles.welcomeText}>
          Select an action from the sidebar to get started
        </Text>
      </View>
    </View>
  );
}

