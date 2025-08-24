import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { GroupAPI } from '@/services/api';
import { styles } from '@/styles/screens/group/GroupUserScreen';

type GroupUser = {
  userId: string;
  userNm: string;
  regDtm: string;
};

export default function GroupUserScreen({ route }: any) {
  const { groupId, groupNm, userId } = route.params;
  const [user, setUser] = useState<GroupUser | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await GroupAPI.findGroupUserWhatInside(groupId);
        const users = Array.isArray(data) ? data : [];
        const targetUser = users.find(u => u.userId === userId);
        setUser(targetUser || null);
      } catch (e: any) {
        console.error('유저 정보 조회 실패:', e);
        setUser(null);
      }
    };
    
    if (groupId && userId) {
      loadUser();
    }
  }, [groupId, userId]);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.groupTitle}>{groupNm}</Text>
          <Text style={styles.subTitle}>유저 정보를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.groupTitle}>{groupNm}</Text>
        <Text style={styles.subTitle}>유저 상세 정보</Text>
      </View>
      
      <View style={styles.userCard}>
        <Text style={styles.userName}>소속 유저: {user.userNm}</Text>
        <Text style={styles.joinDate}>가입 일자: {user.regDtm}</Text>
        <Text style={styles.userId}>userId: {user.userId}</Text>
      </View>
    </View>
  );
}
