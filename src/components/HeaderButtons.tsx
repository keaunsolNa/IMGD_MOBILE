import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logout } from '@/services/auth';
import { styles } from '@/styles/components/HeaderButtons';
import { API_BASE_URL, UserAPI, getProfileImageUrl } from '@/services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import type { UserTableDTO } from '@/types/dto';

export default function HeaderButtons() {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState<UserTableDTO | null>(null);
  
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const currentUserId = getSubjectFromToken(accessToken);

  // 현재 로그인한 사용자의 프로필 정보 가져오기
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUserId) return;
      
      try {
        const { data } = await UserAPI.findUserByToken();
        setUserProfile(data);
      } catch (error) {
        console.error('사용자 프로필 로드 실패:', error);
      }
    };

    loadUserProfile();
  }, [currentUserId]);

  return (
    <View style={styles.headerButtons}>
      <TouchableOpacity 
        style={styles.myPageIcon} 
        onPress={() => navigation.navigate('MyPage' as never)}
      >
        <Image 
          source={getProfileImageUrl(userProfile?.pictureNm)}
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
