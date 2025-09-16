import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Modal } from 'react-native';
import { showErrorAlert, showSuccessAlert } from '@/utils/alert';
import Button from '../../components/Button';
import { GroupAPI, UserAPI } from '@/services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import { styles } from '@/styles/screens/group/GroupScreen';
import type { UserTableDTO } from '@/types/dto';

type GroupCard = {
  groupId?: number;
  groupNm: string;
  groupMstUserId?: string;
  groupMstUserNm?: string;
  regDtm?: string;
};

type GroupUser = {
  userId: string;
  userNm: string;
  regDtm: string;
};

export default function GroupScreen({ navigation }: any) {
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [groupUsers, setGroupUsers] = useState<Map<number, GroupUser[]>>(new Map());
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [availableFriends, setAvailableFriends] = useState<UserTableDTO[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const subject = getSubjectFromToken(accessToken);

  // 그룹 목록을 로드하는 함수
  const loadGroups = useCallback(async () => {
    if (!subject) return;
    try {
      const { data } = await GroupAPI.findGroupWhatInside(subject);
      setGroups(Array.isArray(data) ? data : []);
    } catch (e: any) {
      // 그룹 목록 조회 실패
    }
  }, [subject]);

  // 초기 로드
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // 화면이 포커스될 때마다 그룹 목록 새로고침
  useEffect(() => {
    return navigation.addListener('focus', () => {
      loadGroups();
    });
  }, [navigation, loadGroups]);

  const toggleGroupExpansion = async (groupId: number) => {
    const newExpandedGroups = new Set(expandedGroups);
    
    if (newExpandedGroups.has(groupId)) {
      // 축소
      newExpandedGroups.delete(groupId);
      setExpandedGroups(newExpandedGroups);
    } else {
      // 확장
      newExpandedGroups.add(groupId);
      setExpandedGroups(newExpandedGroups);
      
      // 유저 정보 로드
      if (!groupUsers.has(groupId)) {
        try {
          const { data } = await GroupAPI.findGroupUserWhatInside(groupId);
          const users = Array.isArray(data) ? data : [];
          setGroupUsers(new Map(groupUsers.set(groupId, users)));
        } catch (e: any) {
          // 에러 발생 시 빈 배열로 설정
          setGroupUsers(new Map(groupUsers.set(groupId, [])));
        }
      }
    }
  };

  const navigateToGroupUser = (groupId: number, groupNm: string, userId: string) => {
    navigation.navigate('MyPage', { targetUserId: userId, groupNm });
  };

  // 그룹원 추가 모달 열기
  const handleAddMember = async (groupId: number, groupName: string) => {
    if (!subject) return;
    
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
    setShowAddMemberModal(true);
    setLoadingFriends(true);
    
    try {
      const { data } = await UserAPI.findFriendEachOtherAndNotInGroup(subject, groupId);
      setAvailableFriends(Array.isArray(data) ? data : []);
    } catch (error) {
      showErrorAlert('친구 목록을 불러올 수 없습니다.');
      setAvailableFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  // 그룹원 추가 모달 닫기
  const handleCloseAddMemberModal = () => {
    setShowAddMemberModal(false);
    setSelectedGroupId(null);
    setSelectedGroupName('');
    setAvailableFriends([]);
  };

  // 그룹에 친구 추가하는 함수
  const handleAddMemberToGroup = async (friend: UserTableDTO) => {
    if (!subject || !selectedGroupId) return;

    try {
      const dto = {
        groupId: selectedGroupId,
        groupNm: selectedGroupName,
        groupMstUserId: subject
      };
      
      // 로딩 상태 표시 (버튼 비활성화)
      setAvailableFriends(prev => 
        prev.map(f => 
          f.userId === friend.userId 
            ? { ...f, isAdding: true }
            : f
        )
      );
      
      const response = await GroupAPI.addGroupUser(dto, friend.userId);
      
      // ApiResponse 구조 확인
      if (response.data.success) {
        // 성공 후 처리 함수
        const handleSuccess = async () => {
          // 모달 닫기
          handleCloseAddMemberModal();
          
          // 그룹 목록 새로고침
          await loadGroups();
          
          // 해당 그룹을 자동으로 확장
          if (selectedGroupId) {
            setExpandedGroups(prev => new Set([...prev, selectedGroupId]));
            
            // 해당 그룹의 유저 목록도 새로고침
            try {
              const { data } = await GroupAPI.findGroupUserWhatInside(selectedGroupId);
              const users = Array.isArray(data) ? data : [];
              setGroupUsers(new Map(groupUsers.set(selectedGroupId, users)));
            } catch (error) {
              // 그룹 유저 목록 새로고침 실패
            }
          }
        };
        
        // 웹 환경에서는 window.alert 사용
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`그룹원 추가 성공! 🎉\n${friend.name}님이 "${selectedGroupName}" 그룹에 성공적으로 추가되었습니다.`);
          await handleSuccess();
        } else {
          // 네이티브 환경에서는 showSuccessAlert 사용
          showSuccessAlert(`${friend.name}님이 "${selectedGroupName}" 그룹에 성공적으로 추가되었습니다.`, handleSuccess);
        }
      } else {
        // API에서 에러 응답을 받은 경우
        const errorMessage = response.data.error?.message || '그룹에 친구를 추가할 수 없습니다.';
        
        // 웹 환경에서는 window.alert 사용
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`그룹원 추가 실패\n${errorMessage}`);
        } else {
          // 네이티브 환경에서는 Alert.alert 사용
          showErrorAlert(errorMessage);
        }
      }
    } catch (error: any) {
      // 네트워크 에러나 기타 예외 발생
      console.error('그룹원 추가 에러:', error);
      
      let errorMessage = '네트워크 오류가 발생했습니다. 다시 시도해주세요.';
      
      // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        
        // ApiResponse 구조인 경우
        if (responseData.error && responseData.error.message) {
          errorMessage = responseData.error.message;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      }
      
      // 웹 환경에서는 window.alert 사용
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`그룹원 추가 실패\n${errorMessage}`);
      } else {
        // 네이티브 환경에서는 Alert.alert 사용
        showErrorAlert(errorMessage);
      }
    } finally {
      // 로딩 상태 해제
      setAvailableFriends(prev => 
        prev.map(f => 
          f.userId === friend.userId 
            ? { ...f, isAdding: false }
            : f
        )
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Left Sidebar */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Menus</Text>
        <Button title="Make New Group" onPress={() => navigation.navigate('MakeGroup')} />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Text style={styles.mainTitle}>My Groups</Text>
        <ScrollView style={styles.scrollView}>
          {groups.map((group, idx) => (
            <View key={idx} style={styles.card}>
              <TouchableOpacity 
                style={styles.cardHeader}
                onPress={() => group.groupId && toggleGroupExpansion(group.groupId)}
              >
                <View style={styles.cardInfo}>
                  <Text style={styles.groupName}>
                    {group.groupNm}
                    {group.groupMstUserId === subject && ' 👑'}
                  </Text>
                  <Text style={styles.masterName}>Master: {group.groupMstUserNm || 'N/A'}</Text>
                  <Text style={styles.regDtm}>그룹 생성 시간: {group.regDtm || 'N/A'}</Text>
                </View>
                <View style={styles.expandIcon}>
                  <Text style={styles.expandIconText}>
                    {group.groupId && expandedGroups.has(group.groupId) ? '▼' : '▶'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* 확장된 그룹의 유저 정보 표시 */}
              {group.groupId && expandedGroups.has(group.groupId) ? (
                <View style={styles.userSection}>
                  <View style={styles.userSectionHeader}>
                    <Text style={styles.userSectionTitle}>소속 유저 목록</Text>
                    {group.groupMstUserId === subject && (
                      <TouchableOpacity 
                        style={styles.addMemberButton}
                        onPress={() => handleAddMember(group.groupId!, group.groupNm)}
                      >
                        <Text style={styles.addMemberButtonText}>그룹원 추가</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {groupUsers.get(group.groupId!)?.map((user, userIdx) => (
                    <TouchableOpacity 
                      key={userIdx} 
                      style={styles.userItem}
                      onPress={() => navigateToGroupUser(group.groupId!, group.groupNm, user.userId)}
                    >
                      <Text style={styles.userName}>
                        소속 유저: {user.userNm}
                        {user.userId === group.groupMstUserId && ' 👑'}
                      </Text>
                      <Text style={styles.joinDate}>가입 일자: {user.regDtm}</Text>
                    </TouchableOpacity>
                  )) || (
                    <Text style={styles.noUsersText}>유저 정보를 불러오는 중...</Text>
                  )}
                </View>
              ) : null}
            </View>
          ))}
          {groups.length === 0 && (
            <Text style={styles.emptyText}>No groups found</Text>
          )}
        </ScrollView>
      </View>

      {/* 그룹원 추가 모달 */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseAddMemberModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedGroupName} - 그룹원 추가</Text>
              <TouchableOpacity onPress={handleCloseAddMemberModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingFriends ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>친구 목록을 불러오는 중...</Text>
              </View>
            ) : availableFriends.length === 0 ? (
              <View style={styles.emptyFriendsContainer}>
                <Text style={styles.emptyFriendsText}>그룹에 추가할 수 있는 친구가 없습니다.</Text>
                <Text style={styles.emptyFriendsSubText}>모든 친구가 이미 이 그룹에 소속되어 있습니다.</Text>
              </View>
            ) : (
              <ScrollView style={styles.friendsList}>
                {availableFriends.map((friend, index) => (
                  <View key={index} style={styles.friendItem}>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <Text style={styles.friendNickname}>{friend.nickName}</Text>
                      <Text style={styles.friendEmail}>{friend.email}</Text>
                    </View>
                    <View style={styles.friendActions}>
                      <TouchableOpacity 
                        style={[
                          styles.modalAddMemberButton,
                          (friend as any).isAdding && styles.modalAddMemberButtonDisabled
                        ]}
                        onPress={() => handleAddMemberToGroup(friend)}
                        disabled={(friend as any).isAdding}
                      >
                        <Text style={[
                          styles.modalAddMemberButtonText,
                          (friend as any).isAdding && styles.modalAddMemberButtonTextDisabled
                        ]}>
                          {(friend as any).isAdding ? '추가 중...' : '추가'}
                        </Text>
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