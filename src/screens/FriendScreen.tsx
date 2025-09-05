import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput, Pressable } from 'react-native';
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
  const [friendRequests, setFriendRequests] = useState<UserTableDTO[]>([]);
  const [pendingFriends, setPendingFriends] = useState<UserTableDTO[]>([]);
  const [rejectedFriends, setRejectedFriends] = useState<UserTableDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserTableDTO | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [deletingFriend, setDeletingFriend] = useState<string | null>(null);
  
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const currentUserId = getSubjectFromToken(accessToken);

  // 친구 목록 로드
  const loadFriends = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      const [friendsResponse, friendRequestsResponse, pendingResponse, rejectedResponse] = await Promise.all([
        UserAPI.findFriendEachOther(currentUserId),
        UserAPI.findFriendWhoAddMeButImNot(currentUserId),
        UserAPI.findFriendWhoImAddButNot(currentUserId),
        UserAPI.findFriendWhoImAddButReject(currentUserId)
      ]);
      
      setFriends(friendsResponse.data || []);
      setFriendRequests(friendRequestsResponse.data || []);
      setPendingFriends(pendingResponse.data || []);
      setRejectedFriends(rejectedResponse.data || []);
          } catch (error) {
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
      setSearchedUser(null); // 이전 검색 결과 제거
      
      const response = await UserAPI.searchFriend(searchUserId.trim());
      
      const { data } = response;
      
      // 백엔드 응답 검증
      if (!data || typeof data === 'number' || (Array.isArray(data) && data.length === 0)) {
        // 데이터가 없거나 숫자(1)이거나 빈 배열인 경우 - 존재하지 않는 유저
        setSearchedUser(null);
        setSearchErrorMessage('존재하지 않는 아이디입니다');
        
        // 3초 후 에러 메시지 자동 제거
        setTimeout(() => {
          setSearchErrorMessage(null);
        }, 3000);
      } else if (data && typeof data === 'object' && data.userId && data.name) {
        // 유효한 사용자 데이터인 경우 (단일 객체)
        
        // relationship이 'N'이면 친구 추가 가능하도록 설정
        if (data.relationship === 'N') {
          data.relationship = 'X'; // 친구 추가 가능 상태로 변경
        }
        
        setSearchedUser(data);
      } else {
        // 예상과 다른 형태의 데이터인 경우
        setSearchedUser(null);
        setSearchErrorMessage('존재하지 않는 아이디입니다');
        
        // 3초 후 에러 메시지 자동 제거
        setTimeout(() => {
          setSearchErrorMessage(null);
        }, 3000);
      }
    } catch (error) {
      setSearchedUser(null);
      setSearchErrorMessage('존재하지 않는 아이디입니다');
      
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
    setAddFriendLoading(false);
  };

  // 친구 추가 가능 여부 확인
  const canAddFriend = (targetUserId: string): { canAdd: boolean; message: string } => {
    // 본인인 경우 추가 불가
    if (targetUserId === currentUserId) {
      return { canAdd: false, message: '본인은 친구로 추가할 수 없습니다.' };
    }
    
    // searchedUser의 relationship 값 확인
    if (searchedUser?.relationship === 'F') {
      return { canAdd: false, message: '이미 친구로 추가된 사용자입니다.' };
    }
    
    if (searchedUser?.relationship === 'B') {
      return { canAdd: false, message: '차단된 유저입니다.' };
    }
    
    if (searchedUser?.relationship === 'R') {
      return { canAdd: false, message: '상대방이 요청을 거절했습니다.' };
    }
    
    // N인 경우 친구 추가 가능 (새로운 사용자)
    if (searchedUser?.relationship === 'N') {
      return { canAdd: true, message: '' };
    }
    
    // X인 경우 친구 초대 가능
    if (searchedUser?.relationship === 'X') {
      return { canAdd: true, message: '' };
    }
    
    // 기본적으로 친구 추가 가능
    return { canAdd: true, message: '' };
  };

  // 친구 추가하기
  const handleAddFriendToModal = async () => {
    if (!searchedUser || !currentUserId) return;
    
    setAddFriendLoading(true);
    try {
      await UserAPI.insertUserFriendTable(currentUserId, searchedUser.userId, 'F');
      
      // 성공 메시지 표시
      Alert.alert('성공', `${searchedUser.name}님을 친구로 추가했습니다!`);
      
      // 모달 닫고 친구 목록 새로고침
      handleCloseModal();
      loadFriends();
    } catch (error) {
      Alert.alert('실패', '친구 추가에 실패했습니다.');
    } finally {
      setAddFriendLoading(false);
    }
  };

  // 친구 삭제/요청 취소
  const handleDeleteFriend = async (targetUserId: string, targetUserName: string, actionType: 'delete' | 'cancel') => {
    console.log('handleDeleteFriend 호출됨:', { targetUserId, targetUserName, actionType, currentUserId });
    
    if (!currentUserId) {
      console.log('currentUserId가 없음');
      return;
    }
    
    const actionText = actionType === 'delete' ? '삭제' : '취소';
    const confirmMessage = actionType === 'delete' 
      ? `${targetUserName}님을 친구 목록에서 삭제하시겠습니까?`
      : `${targetUserName}님에게 보낸 친구 요청을 취소하시겠습니까?`;
    
    console.log('확인 다이얼로그 표시:', { actionText, confirmMessage });
    
    // 웹 환경에서는 window.confirm 사용
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        console.log('삭제/취소 확인됨');
        setDeletingFriend(targetUserId);
        try {
          console.log('API 호출 시작:', { currentUserId, targetUserId });
          await UserAPI.deleteUserFriendTable(currentUserId, targetUserId);
          
          console.log('API 호출 성공');
          window.alert(`${targetUserName}님을 ${actionText}했습니다.`);
          
          // 친구 목록 새로고침
          loadFriends();
        } catch (error) {
          console.error('API 호출 실패:', error);
          window.alert(`${actionText}에 실패했습니다.`);
        } finally {
          setDeletingFriend(null);
        }
      }
    } else {
      // 네이티브 환경에서는 Alert.alert 사용
      Alert.alert(
        `${actionText} 확인`,
        confirmMessage,
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: actionText,
            style: 'destructive',
            onPress: async () => {
              console.log('삭제/취소 확인됨');
              setDeletingFriend(targetUserId);
              try {
                console.log('API 호출 시작:', { currentUserId, targetUserId });
                await UserAPI.deleteUserFriendTable(currentUserId, targetUserId);
                
                console.log('API 호출 성공');
                Alert.alert('성공', `${targetUserName}님을 ${actionText}했습니다.`);
                
                // 친구 목록 새로고침
                loadFriends();
              } catch (error) {
                console.error('API 호출 실패:', error);
                Alert.alert('실패', `${actionText}에 실패했습니다.`);
              } finally {
                setDeletingFriend(null);
              }
            },
          },
        ]
      );
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
                 {/* 좌측 사이드바 - 친구 추가 버튼 */}
         <View style={styles.sidebar}>
           <Text style={styles.sidebarTitle}>친구 관리</Text>
           <TouchableOpacity style={styles.sidebarButton} onPress={handleAddFriend}>
             <Text style={styles.sidebarButtonText}>친구 추가</Text>
           </TouchableOpacity>
         </View>

        {/* 우측 메인 영역 - 친구 목록 */}
        <View style={styles.mainContent}>
          <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={true}>
            <Text style={styles.sectionTitle}>친구 목록</Text>
            
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>아직 친구가 없습니다.</Text>
                <Text style={styles.emptyStateSubText}>친구 추가 버튼을 눌러 친구를 추가해보세요!</Text>
              </View>
            ) : (
              <View style={styles.friendsList}>
                {friends.map((friend) => (
                  <View key={friend.userId} style={styles.friendCard}>
                    <TouchableOpacity
                      style={styles.friendCardTouchable}
                      onPress={() => handleFriendProfile(friend)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.friendCardHeader}>
                        <View style={styles.friendNameContainer}>
                          <Text style={styles.friendName}>{friend.name}</Text>
                          <Text style={styles.friendNickname}>{friend.nickName}</Text>
                        </View>
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
                    
                    <View style={styles.deleteButtonContainer}>
                      <Pressable 
                        style={styles.deleteButton}
                        onPress={() => {
                          console.log('친구 삭제 버튼 눌림:', friend.userId);
                          handleDeleteFriend(friend.userId, friend.name, 'delete');
                        }}
                        disabled={deletingFriend === friend.userId}
                      >
                        <Text style={styles.deleteButtonText}>
                          {deletingFriend === friend.userId ? '삭제 중...' : '친구 삭제'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 친구 요청 목록 */}
            <View style={[styles.friendRequestSection, { marginTop: friends.length === 0 ? 10 : 20 }]}>
              <Text style={styles.sectionTitle}>친구 요청</Text>
              
              {friendRequests.length > 0 ? (
                <View style={styles.friendsList}>
                  {friendRequests.map((friendRequest) => (
                    <TouchableOpacity
                      key={friendRequest.userId}
                      style={styles.friendCard}
                      onPress={() => handleFriendProfile(friendRequest)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.friendCardHeader}>
                        <View style={styles.friendNameContainer}>
                          <Text style={styles.friendName}>{friendRequest.name}</Text>
                          <Text style={styles.friendNickname}>{friendRequest.nickName}</Text>
                        </View>
                        <Text style={styles.friendRequestStatus}>요청됨</Text>
                      </View>
                      
                      <View style={styles.friendCardContent}>
                        <Image
                          source={getProfileImageUrl(friendRequest.pictureNm)}
                          style={styles.friendProfileImage}
                        />
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendEmail}>{friendRequest.email}</Text>
                          <Text style={styles.friendLoginType}>{friendRequest.loginType}</Text>
                          <Text style={styles.friendJoinDate}>가입일: {friendRequest.regDtm}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySpace} />
              )}
            </View>

            {/* 친구 수락 대기중 목록 */}
            <View style={[styles.pendingSection, { marginTop: 15 }]}>
              <Text style={styles.sectionTitle}>친구 수락 대기중</Text>
             
              {pendingFriends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>수락 대기중인 친구 요청이 없습니다.</Text>
                </View>
              ) : (
                <View style={styles.friendsList}>
                  {pendingFriends.map((pendingFriend) => (
                    <View key={pendingFriend.userId} style={styles.friendCard}>
                      <TouchableOpacity
                        style={styles.friendCardTouchable}
                        onPress={() => handleFriendProfile(pendingFriend)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.friendCardHeader}>
                          <View style={styles.friendNameContainer}>
                            <Text style={styles.friendName}>{pendingFriend.name}</Text>
                            <Text style={styles.friendNickname}>{pendingFriend.nickName}</Text>
                          </View>
                          <Text style={styles.pendingStatus}>수락 대기중</Text>
                        </View>
                        
                        <View style={styles.friendCardContent}>
                          <Image
                            source={getProfileImageUrl(pendingFriend.pictureNm)}
                            style={styles.friendProfileImage}
                          />
                          <View style={styles.friendInfo}>
                            <Text style={styles.friendEmail}>{pendingFriend.email}</Text>
                            <Text style={styles.friendLoginType}>{pendingFriend.loginType}</Text>
                            <Text style={styles.friendJoinDate}>가입일: {pendingFriend.regDtm}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      <View style={styles.deleteButtonContainer}>
                        <Pressable 
                          style={styles.deleteButton}
                          onPress={() => {
                            console.log('요청 취소 버튼 눌림:', pendingFriend.userId);
                            handleDeleteFriend(pendingFriend.userId, pendingFriend.name, 'cancel');
                          }}
                          disabled={deletingFriend === pendingFriend.userId}
                        >
                          <Text style={styles.deleteButtonText}>
                            {deletingFriend === pendingFriend.userId ? '취소 중...' : '요청 취소'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 거절한 친구 목록 */}
            <View style={[styles.rejectedSection, { marginTop: 15 }]}>
              <Text style={styles.sectionTitle}>거절한 친구</Text>
             
              {rejectedFriends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>거절한 친구 요청이 없습니다.</Text>
                </View>
              ) : (
                <View style={styles.friendsList}>
                  {rejectedFriends.map((rejectedFriend) => (
                    <View key={rejectedFriend.userId} style={styles.friendCard}>
                      <TouchableOpacity
                        style={styles.friendCardTouchable}
                        onPress={() => handleFriendProfile(rejectedFriend)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.friendCardHeader}>
                          <View style={styles.friendNameContainer}>
                            <Text style={styles.friendName}>{rejectedFriend.name}</Text>
                            <Text style={styles.friendNickname}>{rejectedFriend.nickName}</Text>
                          </View>
                          <Text style={styles.rejectedStatus}>거절됨</Text>
                        </View>
                        
                        <View style={styles.friendCardContent}>
                          <Image
                            source={getProfileImageUrl(rejectedFriend.pictureNm)}
                            style={styles.friendProfileImage}
                          />
                          <View style={styles.friendInfo}>
                            <Text style={styles.friendEmail}>{rejectedFriend.email}</Text>
                            <Text style={styles.friendLoginType}>{rejectedFriend.loginType}</Text>
                            <Text style={styles.friendJoinDate}>가입일: {rejectedFriend.regDtm}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      <View style={styles.deleteButtonContainer}>
                        <Pressable 
                          style={styles.deleteButton}
                          onPress={() => {
                            console.log('거절한 친구 삭제 버튼 눌림:', rejectedFriend.userId);
                            handleDeleteFriend(rejectedFriend.userId, rejectedFriend.name, 'delete');
                          }}
                          disabled={deletingFriend === rejectedFriend.userId}
                        >
                          <Text style={styles.deleteButtonText}>
                            {deletingFriend === rejectedFriend.userId ? '삭제 중...' : '친구 삭제'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
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
            {searchedUser && !searchErrorMessage ? (
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
            ) : null}

            {/* 검색 에러 메시지 표시 */}
            {searchErrorMessage ? (
              <View style={styles.searchErrorSection}>
                <Text style={[
                  styles.searchErrorMessage,
                  searchErrorMessage === '존재하지 않는 아이디입니다' && styles.searchErrorMessageNotFound
                ]}>
                  {searchErrorMessage}
                </Text>
              </View>
            ) : null}

                         {/* 친구 추가 버튼 또는 상태 메시지 */}
             {searchedUser && !searchErrorMessage ? (
               <View style={styles.addFriendSection}>
                 {canAddFriend(searchedUser.userId).canAdd ? (
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
                 ) : (
                   <View style={styles.friendStatusMessage}>
                     <Text style={styles.friendStatusText}>
                       {canAddFriend(searchedUser.userId).message}
                     </Text>
                   </View>
                 )}
               </View>
             ) : null}

            {/* 검색 결과가 없을 때 안내 메시지 */}
            {!searchedUser && !searchErrorMessage && !searchLoading && searchUserId.trim() !== '' ? (
              <View style={styles.searchResultSection}>
                <Text style={styles.searchResultTitle}>검색 결과</Text>
                <View style={styles.searchResultCard}>
                  <View style={styles.emptySearchResult}>
                    <Text style={styles.emptySearchResultText}>사용자를 검색해보세요</Text>
                    <Text style={styles.emptySearchResultSubText}>사용자 ID를 입력하고 검색 버튼을 눌러주세요</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
