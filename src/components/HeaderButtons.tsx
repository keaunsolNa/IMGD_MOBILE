import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logout } from '@/services/auth';
import { styles } from '@/styles/components/HeaderButtons';

export default function HeaderButtons() {
  const navigation = useNavigation();

  return (
    <View style={styles.headerButtons}>
      <TouchableOpacity 
        style={styles.myPageIcon} 
        onPress={() => navigation.navigate('MyPage' as never)}
      >
        <Image 
          source={require('../assets/user/user_profile_default.png')} 
          style={styles.myPageIconImage}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutIcon} onPress={logout}>
        <Image 
          source={require('../assets/common/logout.png')} 
          style={styles.logoutIconImage}
        />
      </TouchableOpacity>
    </View>
  );
}
