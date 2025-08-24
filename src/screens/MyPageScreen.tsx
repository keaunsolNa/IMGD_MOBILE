import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserAPI } from '@/services/api';
import { styles } from '@/styles/screens/myPage/MyPageScreen';
import type { UserTableDTO } from '@/types/dto';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import { getAccessToken } from '@/services/storage';

export default function MyPageScreen() {
  const [user, setUser] = useState<UserTableDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newNickName, setNewNickName] = useState('');
  const [updateMessage, setUpdateMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const currentUserId = getSubjectFromToken(accessToken);

  // 메시지를 3초간 표시하는 함수
  const showUpdateMessage = (text: string, type: 'success' | 'error') => {
    setUpdateMessage({ text, type });
    setTimeout(() => {
      setUpdateMessage(null);
    }, 3000);
  };

  const loadUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await UserAPI.findUserByToken();

      setUser(data);
    } catch (e: any) {
      console.error('사용자 정보 조회 실패:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  const handleEditNickName = () => {
    if (!user || !currentUserId) return;
    
    // 현재 로그인한 사용자와 마이페이지 사용자가 일치하는지 확인
    if (user.userId !== currentUserId) {
      showUpdateMessage('다른 사용자의 정보는 수정할 수 없습니다.', 'error');
      return;
    }
    
    setIsEditing(true);
    setNewNickName(user.nickName);
  };

  const handleSaveNickName = async () => {
    if (!user || !currentUserId || !newNickName.trim()) return;
    
    try {
      const response = await UserAPI.updateUser({ 
        userId: user.userId,
        nickName: newNickName.trim() 
      });
      
      // 백엔드에서 성공적으로 응답이 오면 (200 OK + UserTableDTO 반환)
      if (response.status === 200 && response.data) {
        // 로컬 상태 업데이트
        setUser(prev => prev ? { ...prev, nickName: newNickName.trim() } : null);
        setIsEditing(false);
        setNewNickName('');
        
        showUpdateMessage('유저 정보가 변경되었습니다.', 'success');
        
        // 사용자 정보 다시 로드
        loadUserInfo();
      } else {
        // 응답은 받았지만 예상과 다른 경우
        showUpdateMessage('유저 정보 변경에 실패했습니다.', 'error');
      }
    } catch (e: any) {
      console.error('닉네임 변경 실패:', e);
      showUpdateMessage('유저 정보 변경에 실패했습니다.', 'error');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewNickName('');
  };

  const handleProfileImageUpload = async () => {
    console.log('handleProfileImageUpload 함수 호출됨');
    
    if (!user || !currentUserId) {
      console.log('사용자 정보 또는 currentUserId가 없음');
      return;
    }
    
    // 현재 로그인한 사용자와 마이페이지 사용자가 일치하는지 확인
    if (user.userId !== currentUserId) {
      console.log('권한 없음: 다른 사용자');
      Alert.alert('권한 없음', '다른 사용자의 프로필은 수정할 수 없습니다.');
      return;
    }

    try {
      console.log('이미지 선택 권한 요청 시작');
      // 이미지 선택 권한 요청
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        console.log('갤러리 권한 거부됨');
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      console.log('이미지 선택 시작');
      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('이미지 선택 결과:', result);
      
      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('선택된 이미지:', selectedImage);
        
        console.log('프로필 이미지 업로드 시작');
        // 프로필 이미지 업로드
        const token = await getAccessToken();
        console.log('토큰 획득:', token ? '있음' : '없음');
        
        const response = await UserAPI.uploadProfileImage(
          selectedImage,
          user.userId,
          token ?? undefined
        );

        console.log('업로드 응답:', response);

        if (response) {
          Alert.alert('성공', '프로필 이미지가 업로드되었습니다.');
          // 사용자 정보 다시 로드하여 새로운 이미지 URL 반영
          loadUserInfo();
        } else {
          Alert.alert('실패', '프로필 이미지 업로드에 실패했습니다.');
        }
      } else {
        console.log('이미지 선택이 취소됨');
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error);
      Alert.alert('오류', '프로필 이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>My Page</Text>
        <Text style={styles.loadingText}>사용자 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>My Page</Text>
        <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Page</Text>
      
      <View style={styles.userCard}>
        <View style={styles.profileSection}>
                     {/* 프로필 이미지 (좌측) */}
           <TouchableOpacity 
             style={styles.profileImageContainer}
             onPress={handleProfileImageUpload}
             activeOpacity={0.7}
           >
                           <Image
                source={
                  user.pictureUrl
                    ? { uri: user.pictureUrl }
                    : require('../../assets/icons/user_profile_default.png')
                }
                style={styles.profileImage}
                defaultSource={require('../../assets/icons/user_profile_default.png')}
              />
             <View style={styles.profileImageOverlay}>
               <Text style={styles.profileImageOverlayText}>변경</Text>
             </View>
           </TouchableOpacity>
          
          {/* 유저 정보 (우측) */}
          <View style={styles.userInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>이름</Text>
              <Text style={styles.value}>{user.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>이메일</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>닉네임</Text>
              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={newNickName}
                    onChangeText={setNewNickName}
                    placeholder="닉네임을 입력하세요"
                    autoFocus
                  />
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveNickName}>
                    <Text style={styles.saveButtonText}>저장</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.valueContainer}>
                  <Text style={styles.value}>{user.nickName}</Text>
                  {user.userId === currentUserId && (
                    <TouchableOpacity style={styles.editButton} onPress={handleEditNickName}>
                      <Text style={styles.editButtonText}>수정</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* 업데이트 메시지 표시 영역 */}
            {updateMessage && (
              <View style={styles.messageContainer}>
                <Text 
                  style={[
                    styles.messageText,
                    updateMessage.type === 'success' ? styles.successMessage : styles.errorMessage
                  ]}
                >
                  {updateMessage.text}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>로그인 타입</Text>
              <Text style={styles.value}>{user.loginType}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>마지막 로그인 일자</Text>
              <Text style={styles.value}>{user.lastLoginDate}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>가입일</Text>
              <Text style={styles.value}>{user.regDtm}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
