import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, Image, Modal, Text, ScrollView, Alert } from 'react-native';
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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [friendRequests, setFriendRequests] = useState<UserTableDTO[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
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
        // 사용자 프로필 로드 실패
      }
    };

    loadUserProfile();
  }, [currentUserId]);

  // 친구 요청 개수만 로드하는 함수
  const loadNotificationCount = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      const { data } = await UserAPI.findFriendWhoAddMeButImNot(currentUserId);
      setNotificationCount(data?.length || 0);
    } catch (error) {
      // 알림 개수 로드 실패
    }
  }, [currentUserId]);

  // 화면 포커스 시 알림 개수 로드
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotificationCount();
    });

    return unsubscribe;
  }, [navigation, loadNotificationCount]);

  // 앱 시작 시에도 한 번 로드
  useEffect(() => {
    loadNotificationCount();
  }, [loadNotificationCount]);

  // 친구 요청 목록 로드
  const loadFriendRequests = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoadingNotifications(true);
      const { data } = await UserAPI.findFriendWhoAddMeButImNot(currentUserId);
      setFriendRequests(data || []);
      setNotificationCount(data?.length || 0);
    } catch (error) {
      // 친구 요청 목록 로드 실패
    } finally {
      setLoadingNotifications(false);
    }
  }, [currentUserId]);

  // 알림 아이콘 클릭
  const handleNotificationPress = async () => {
    await loadFriendRequests();
    setShowNotificationModal(true);
  };

  // 모달 닫기
  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
  };

  // 친구 요청 수락
  const handleAcceptFriendRequest = async (friendRequest: UserTableDTO) => {
    if (!currentUserId) {
      Alert.alert('오류', '사용자 ID를 찾을 수 없습니다.');
      return;
    }
    
    try {
      await UserAPI.insertUserFriendTable(currentUserId, friendRequest.userId, 'F');
      
      // 친구 요청 목록 새로고침
      await loadFriendRequests();
      // 알림 개수도 새로고침
      await loadNotificationCount();
      
      // 성공 메시지 표시
      setSuccessMessage(`${friendRequest.name}님의 친구 요청을 수락했습니다!`);
      setShowSuccessMessage(true);
      
      // 2초 후 모달 닫고 화면 이동
      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowNotificationModal(false);
        try {
          (navigation as any).navigate('Friend', { refresh: true });
        } catch (navError) {
          // 화면 이동 실패
        }
      }, 2000);
      
    } catch (error) {
      Alert.alert('실패', '친구 요청 수락에 실패했습니다.');
    }
  };

  // 친구 요청 거절
  const handleRejectFriendRequest = async (friendRequest: UserTableDTO) => {
    if (!currentUserId) {
      Alert.alert('오류', '사용자 ID를 찾을 수 없습니다.');
      return;
    }
    
    try {
      await UserAPI.insertUserFriendTable(currentUserId, friendRequest.userId, 'R');
      
      // 친구 요청 목록 새로고침
      await loadFriendRequests();
      // 알림 개수도 새로고침
      await loadNotificationCount();
      
      // 성공 메시지 표시
      setSuccessMessage(`${friendRequest.name}님의 친구 요청을 거절했습니다.`);
      setShowSuccessMessage(true);
      
      // 2초 후 모달 닫기
      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowNotificationModal(false);
      }, 2000);
      
    } catch (error) {
      Alert.alert('실패', '친구 요청 거절에 실패했습니다.');
    }
  };

  return (
    <View style={styles.headerButtons}>
      {/* 알림 아이콘 */}
      <TouchableOpacity 
        style={styles.notificationIcon} 
        onPress={handleNotificationPress}
      >
        <Image 
          source={{ uri: `${API_BASE_URL}/images/default/alarm.png` }}
          style={styles.notificationIconImage}
        />
        {notificationCount > 0 ? (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* MyPage 아이콘 */}
      <TouchableOpacity 
        style={styles.myPageIcon} 
        onPress={() => navigation.navigate('MyPage' as never)}
      >
        <Image 
          source={getProfileImageUrl(userProfile?.pictureNm)}
          style={styles.myPageIconImage}
        />
      </TouchableOpacity>

      {/* 로그아웃 아이콘 */}
      <TouchableOpacity style={styles.logoutIcon} onPress={logout}>
        <Image 
          source={{ uri: `${API_BASE_URL}/images/default/logout.png` }}
          style={styles.logoutIconImage}
        />
      </TouchableOpacity>

      {/* 친구 요청 알림 모달 */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseNotificationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>친구 요청</Text>
              <TouchableOpacity onPress={handleCloseNotificationModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {showSuccessMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
                <Text style={styles.successSubText}>잠시 후 My Friends 화면으로 이동합니다...</Text>
              </View>
            ) : loadingNotifications ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>친구 요청을 불러오는 중...</Text>
              </View>
            ) : friendRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>새로운 친구 요청이 없습니다.</Text>
              </View>
            ) : (
              <ScrollView style={styles.friendRequestsList}>
                {friendRequests.map((friendRequest) => (
                  <View key={friendRequest.userId} style={styles.friendRequestCard}>
                    <View style={styles.friendRequestHeader}>
                      <Image
                        source={getProfileImageUrl(friendRequest.pictureNm)}
                        style={styles.friendRequestProfileImage}
                      />
                      <View style={styles.friendRequestInfo}>
                        <Text style={styles.friendRequestName}>{friendRequest.name}</Text>
                        <Text style={styles.friendRequestNickname}>{friendRequest.nickName}</Text>
                        <Text style={styles.friendRequestEmail}>{friendRequest.email}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.friendRequestActions}>
                      <TouchableOpacity 
                        style={styles.acceptButton}
                        onPress={() => handleAcceptFriendRequest(friendRequest)}
                      >
                        <Text style={styles.acceptButtonText}>수락</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.rejectButton}
                        onPress={() => handleRejectFriendRequest(friendRequest)}
                      >
                        <Text style={styles.rejectButtonText}>거절</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
