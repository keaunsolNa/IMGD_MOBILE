import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image } from 'react-native';
import { showErrorAlert, showSuccessAlert } from '@/utils/alert';
import * as ImagePicker from 'expo-image-picker';
import { UserAPI, getProfileImageUrl } from '@/services/api';
import { styles } from '@/styles/screens/myPage/MyPageScreen';
import type { UserTableDTO } from '@/types/dto';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import { getAccessToken, clearTokens } from '@/services/storage';
import ProgressBar from '@/components/ProgressBar';
import { setAuth } from '@/redux/authSlice';

export default function MyPageScreen({ route }: any) {
  const { targetUserId, groupNm } = route.params || {};
  const [user, setUser] = useState<UserTableDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newNickName, setNewNickName] = useState('');
  const [updateMessage, setUpdateMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  
  // 프로필 이미지 업로드 관련 상태
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const dispatch = useDispatch();
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
      
      // targetUserId가 있으면 해당 사용자 정보 조회, 없으면 현재 로그인한 사용자 정보 조회
      if (targetUserId) {
        const { data } = await UserAPI.findUserById(targetUserId);
        setUser(data);
      } else {
        const { data } = await UserAPI.findUserByToken();
        setUser(data);
      }
    } catch (e: any) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

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
      
      // ApiResponse 구조 확인
      if (response.data.success) {
        // 로컬 상태 업데이트
        setUser(prev => prev ? { ...prev, nickName: newNickName.trim() } : null);
        setIsEditing(false);
        setNewNickName('');
        
        showUpdateMessage('유저 정보가 변경되었습니다.', 'success');
        
        // 사용자 정보 다시 로드
        loadUserInfo();
      } else {
        // API에서 에러 응답을 받은 경우
        const errorMessage = response.data.error?.message || '유저 정보 변경에 실패했습니다.';
        showUpdateMessage(errorMessage, 'error');
      }
    } catch (e: any) {
      console.error('유저 정보 변경 실패:', e);
      
      // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
      if (e.response && e.response.data) {
        const responseData = e.response.data;
        
        // ApiResponse 구조인 경우
        if (responseData.error && responseData.error.message) {
          showUpdateMessage(responseData.error.message, 'error');
        } else if (responseData.message) {
          showUpdateMessage(responseData.message, 'error');
        } else {
          showUpdateMessage('유저 정보 변경에 실패했습니다.', 'error');
        }
      } else {
        // 네트워크 에러나 기타 에러
        showUpdateMessage('유저 정보 변경에 실패했습니다.', 'error');
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewNickName('');
  };

  const handleDeleteAccount = () => {
    if (!user || !currentUserId) return;
    
    // 현재 로그인한 사용자와 마이페이지 사용자가 일치하는지 확인
    if (user.userId !== String(currentUserId)) {
      showErrorAlert('다른 사용자의 계정은 삭제할 수 없습니다.');
      return;
    }

    // 웹 환경을 고려한 확인 다이얼로그
    const confirmDelete = window.confirm(
      '정말로 계정을 삭제하시겠습니까?\n\n삭제된 계정은 복구할 수 없으며, 관련된 모든 데이터가 영구적으로 삭제됩니다.'
    );
    
    if (confirmDelete) {
      confirmDeleteAccount();
    }
  };

  const confirmDeleteAccount = async () => {
    if (!user || !currentUserId) return;

    try {
      const response = await UserAPI.deleteUser(user.userId);
      
      // ApiResponse 구조 확인
      if (response.data.success) {
        showSuccessAlert('계정이 성공적으로 삭제되었습니다.');
        
        // 로그아웃 처리
        await clearTokens();
        dispatch(setAuth({ accessToken: null }));
        
        // 로그인 화면으로 이동 (navigation을 통해 처리)
        // navigation.navigate('Login');
      } else {
        const errorMessage = response.data.error?.message || '계정 삭제에 실패했습니다.';
        showErrorAlert(errorMessage);
      }
    } catch (e: any) {
      console.error('계정 삭제 실패:', e);
      
      // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
      if (e.response && e.response.data) {
        const responseData = e.response.data;
        
        // ApiResponse 구조인 경우
        if (responseData.error && responseData.error.message) {
          showErrorAlert(responseData.error.message);
        } else if (responseData.message) {
          showErrorAlert(responseData.message);
        } else {
          showErrorAlert('계정 삭제에 실패했습니다.');
        }
      } else {
        // 네트워크 에러나 기타 에러
        showErrorAlert('계정 삭제에 실패했습니다.');
      }
    }
  };

  const handleProfileImageUpload = async () => {
    
    if (!user || !currentUserId) {
      return;
    }
    
    // 현재 로그인한 사용자와 마이페이지 사용자가 일치하는지 확인
    if (user.userId !== currentUserId) {
      showErrorAlert('다른 사용자의 프로필은 수정할 수 없습니다.');
      return;
    }

    try {
      // 이미지 선택 권한 요청
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        showErrorAlert('갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      
      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        // 업로드 시작
        setUploadingProfileImage(true);
        setUploadProgress(0);
        
        // 프로그레스 시뮬레이션
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90; // 90%에서 멈춤 (실제 완료 시 100%로 설정)
            }
            return prev + 15;
          });
        }, 300);
        
        // 프로필 이미지 업로드
        const token = await getAccessToken();
        
        const response = await UserAPI.uploadProfileImage(
          selectedImage,
          user.userId,
          token ?? undefined
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (response && (response.success || response.userId)) {
          showSuccessAlert('프로필 이미지가 업로드되었습니다.');
          // 사용자 정보 다시 로드하여 새로운 이미지 URL 반영
          loadUserInfo();
        } else {
          showErrorAlert('프로필 이미지 업로드에 실패했습니다.');
        }
      } else {
      }
    } catch (error) {
      showErrorAlert('프로필 이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingProfileImage(false);
      setUploadProgress(0);
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
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          {targetUserId ? `${groupNm || 'Group'} - User Profile` : 'My Page'}
        </Text>
        {!targetUserId && user && user.userId === String(currentUserId) && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>회원 탈퇴</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.userCard}>
        <View style={styles.profileSection}>
          {/* 프로필 이미지 (좌측) */}
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={targetUserId ? undefined : handleProfileImageUpload}
            activeOpacity={targetUserId ? 1 : 0.7}
            disabled={uploadingProfileImage}
          >
            <Image
              source={getProfileImageUrl(user.pictureNm)}
              style={styles.profileImage}
            />
            {/* 본인 프로필일 때만 변경 오버레이 표시 */}
            {!targetUserId && (
              <View style={styles.profileImageOverlay}>
                <Text style={styles.profileImageOverlayText}>
                  {uploadingProfileImage ? '업로드 중...' : '변경'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* 유저 정보 (우측) */}
          <View style={styles.userInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>아이디</Text>
              <Text style={styles.value}>{user.userId}</Text>
            </View>
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
      
      <ProgressBar 
        visible={uploadingProfileImage} 
        message="프로필 이미지를 업로드하는 중..." 
        progress={uploadProgress}
        showPercentage={true}
      />
    </View>
  );
}
