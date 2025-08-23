import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Button from '../components/Button';
import { logout } from '@/services/auth';
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
          <Button title="Upload" onPress={() => navigation.navigate('Upload')} />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome to IMGD</Text>
          <TouchableOpacity style={styles.logoutIcon} onPress={logout}>
            <View style={styles.logoutIconContainer}>
              <Text style={styles.logoutIconText}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.welcomeText}>
          Select an action from the sidebar to get started
        </Text>
      </View>
    </View>
  );
}

