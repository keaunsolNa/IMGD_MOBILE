import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UserAPI, getProfileImageUrl } from '@/services/api';
import { styles } from '@/styles/screens/friend/FriendScreen';
import type { UserTableDTO } from '@/types/dto';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';

export default function FriendScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [friends, setFriends] = useState<UserTableDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserTableDTO | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const currentUserId = getSubjectFromToken(accessToken);

  // 친구 목록 로드
  const loadFriends = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      const { data } = await UserAPI.findFriendEachOther(currentUserId);
      setFriends(data || []);
    } catch (error) {
      console.error('친구 목록 로드 실패:', error);
      Alert.alert('오류', '친구 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // navigation params에서 refresh 플래그 확인
  useEffect(() => {
    const params = route.params as { refresh?: boolean };
    if (params?.refresh) {
      loadFriends();
      // 플래그 초기화
      (navigation as any).setParams({ refresh: false });
    }
  }, [route.params, loadFriends, navigation]);

  // 친구 추가 버튼
  const handleAddFriend = () => {
    setShowAddFriendModal(true);
    setSearchUserId('');
    setSearchedUser(null);
  };

  // 친구 관리 버튼
  const handleManageFriends = () => {
    Alert.alert('친구 관리', '친구 관리 기능은 추후 구현 예정입니다.');
  };

  // 친구 프로필 클릭
  const handleFriendProfile = (friend: UserTableDTO) => {
    (navigation as any).navigate('MyPage', { 
      targetUserId: friend.userId, 
      groupNm: 'Friend' 
    });
  };

  // 사용자 검색
  const handleSearchUser = async () => {
    if (!searchUserId.trim()) {
      Alert.alert('입력 오류', '사용자 ID를 입력해주세요.');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchErrorMessage(null); // 이전 에러 메시지 제거
      const { data } = await UserAPI.findUserById(searchUserId.trim());
      setSearchedUser(data);
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      setSearchedUser(null);
      setSearchErrorMessage('일치하는 ID가 없습니다');
      
      // 3초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setSearchErrorMessage(null);
      }, 3000);
    } finally {
      setSearchLoading(false);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowAddFriendModal(false);
    setSearchUserId('');
    setSearchedUser(null);
    setSearchErrorMessage(null);
  };

  // 친구 추가하기
  const handleAddFriendToModal = async () => {
    if (!searchedUser) return;
    
    try {
      setAddFriendLoading(true);
      await UserAPI.insertUserFriendTable(currentUserId!, searchedUser.userId);
      
      // 성공 메시지 표시
      Alert.alert('성공', `${searchedUser.name}님을 친구로 추가했습니다!`);
      
      // 친구 목록 새로고침
      await loadFriends();
      
      // 모달 닫기
      handleCloseModal();
    } catch (error) {
      console.error('친구 추가 실패:', error);
      Alert.alert('실패', '친구 추가에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAddFriendLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>My Friends</Text>
        <Text style={styles.loadingText}>친구 목록을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Friends</Text>
      
      <View style={styles.content}>
        {/* 좌측 사이드바 - 친구 관리 버튼들 */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>친구 관리</Text>
          <TouchableOpacity style={styles.sidebarButton} onPress={handleAddFriend}>
            <Text style={styles.sidebarButtonText}>친구 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarButton} onPress={handleManageFriends}>
            <Text style={styles.sidebarButtonText}>친구 관리</Text>
          </TouchableOpacity>
        </View>

        {/* 우측 메인 영역 - 친구 목록 */}
        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>친구 목록</Text>
          
          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>아직 친구가 없습니다.</Text>
              <Text style={styles.emptyStateSubText}>친구 추가 버튼을 눌러 친구를 추가해보세요!</Text>
            </View>
          ) : (
            <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={true}>
              {friends.map((friend) => (
                <TouchableOpacity
                  key={friend.userId}
                  style={styles.friendCard}
                  onPress={() => handleFriendProfile(friend)}
                  activeOpacity={0.7}
                >
                  <View style={styles.friendCardHeader}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendNickname}>{friend.nickName}</Text>
                  </View>
                  
                  <View style={styles.friendCardContent}>
                    <Image
                      source={getProfileImageUrl(friend.pictureNm)}
                      style={styles.friendProfileImage}
                    />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendEmail}>{friend.email}</Text>
                      <Text style={styles.friendLoginType}>{friend.loginType}</Text>
                      <Text style={styles.friendJoinDate}>가입일: {friend.regDtm}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* 친구 추가 모달 */}
      <Modal
        visible={showAddFriendModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>친구 추가</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 사용자 ID 입력 및 검색 */}
            <View style={styles.searchSection}>
              <Text style={styles.searchLabel}>사용자 ID 입력</Text>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchUserId}
                  onChangeText={setSearchUserId}
                  placeholder="사용자 ID를 입력하세요"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.searchButton} 
                  onPress={handleSearchUser}
                  disabled={searchLoading}
                >
                  <Text style={styles.searchButtonText}>
                    {searchLoading ? '검색 중...' : '검색'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 검색 결과 표시 */}
            {searchedUser && (
              <View style={styles.searchResultSection}>
                <Text style={styles.searchResultTitle}>검색 결과</Text>
                <View style={styles.searchResultCard}>
                  <View style={styles.searchedUserCard}>
                    <View style={styles.searchedUserHeader}>
                      <Image
                        source={getProfileImageUrl(searchedUser.pictureNm)}
                        style={styles.searchedUserProfileImage}
                      />
                      <View style={styles.searchedUserInfo}>
                        <Text style={styles.searchedUserName}>{searchedUser.name}</Text>
                        <Text style={styles.searchedUserNickname}>{searchedUser.nickName}</Text>
                        <Text style={styles.searchedUserEmail}>{searchedUser.email}</Text>
                      </View>
                    </View>
                    <View style={styles.searchedUserDetails}>
                      <Text style={styles.searchedUserDetail}>로그인 타입: {searchedUser.loginType}</Text>
                      <Text style={styles.searchedUserDetail}>가입일: {searchedUser.regDtm}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 검색 에러 메시지 표시 */}
            {searchErrorMessage && (
              <View style={styles.searchErrorSection}>
                <Text style={styles.searchErrorMessage}>{searchErrorMessage}</Text>
              </View>
            )}

            {/* 친구 추가 버튼 (검색 결과가 있고 본인이 아닐 때만) */}
            {searchedUser && searchedUser.userId !== currentUserId && (
              <View style={styles.addFriendSection}>
                <TouchableOpacity 
                  style={[
                    styles.addFriendButton,
                    addFriendLoading && styles.addFriendButtonDisabled
                  ]} 
                  onPress={handleAddFriendToModal} 
                  disabled={addFriendLoading}
                >
                  <Text style={styles.addFriendButtonText}>
                    {addFriendLoading ? '추가 중...' : '친구 추가하기'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
