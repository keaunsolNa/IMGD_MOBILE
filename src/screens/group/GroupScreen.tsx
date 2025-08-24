import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Button from '../../components/Button';
import { GroupAPI } from '@/services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import { styles } from '@/styles/screens/group/GroupScreen';

type GroupCard = {
  groupId?: number;
  groupNm: string;
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
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const subject = getSubjectFromToken(accessToken);

  useEffect(() => {
    (async () => {
      if (!subject) return;
      try {
        const { data } = await GroupAPI.findGroupWhatInside(subject);
        setGroups(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error('그룹 목록 조회 실패:', e);
      }
    })();
  }, [subject]);

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
          console.error('그룹 유저 목록 조회 실패:', e);
          // 에러 발생 시 빈 배열로 설정
          setGroupUsers(new Map(groupUsers.set(groupId, [])));
        }
      }
    }
  };

  const navigateToGroupUser = (groupId: number, groupNm: string, userId: string) => {
    navigation.navigate('GroupUser', { groupId, groupNm, userId });
  };

  return (
    <View style={styles.container}>
      {/* Left Sidebar */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Menus</Text>
        <Button title="Make New Group" onPress={() => navigation.navigate('MakeGroup')} />
        <View style={styles.spacing} />
        <Button title="Make Group Root Folder" onPress={() => navigation.navigate('MakeGroupRootFolder')} />
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
                  <Text style={styles.groupName}>{group.groupNm}</Text>
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
              {group.groupId && expandedGroups.has(group.groupId) && (
                <View style={styles.userSection}>
                  <View style={styles.userSectionHeader}>
                    <Text style={styles.userSectionTitle}>소속 유저 목록</Text>
                  </View>
                  {groupUsers.get(group.groupId!)?.map((user, userIdx) => (
                    <TouchableOpacity 
                      key={userIdx} 
                      style={styles.userItem}
                      onPress={() => navigateToGroupUser(group.groupId!, group.groupNm, user.userId)}
                    >
                      <Text style={styles.userName}>소속 유저: {user.userNm}</Text>
                      <Text style={styles.joinDate}>가입 일자: {user.regDtm}</Text>
                    </TouchableOpacity>
                  )) || (
                    <Text style={styles.noUsersText}>유저 정보를 불러오는 중...</Text>
                  )}
                </View>
              )}
            </View>
          ))}
          {groups.length === 0 && (
            <Text style={styles.emptyText}>No groups found</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}