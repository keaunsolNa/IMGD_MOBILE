import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logout } from '@/services/auth';
import { styles } from '@/styles/components/HeaderButtons';
import { API_BASE_URL } from '@/services/api';

export default function HeaderButtons() {
  const navigation = useNavigation();

  return (
    <View style={styles.headerButtons}>
      <TouchableOpacity 
        style={styles.myPageIcon} 
        onPress={() => navigation.navigate('MyPage' as never)}
      >
        <Image 
          source={{ uri: `${API_BASE_URL}/images/default/user_profile_default.png` }}
          style={styles.myPageIconImage}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutIcon} onPress={logout}>
        <Image 
          source={{ uri: `${API_BASE_URL}/images/default/logout.png` }}
          style={styles.logoutIconImage}
        />
      </TouchableOpacity>
    </View>
  );
}
