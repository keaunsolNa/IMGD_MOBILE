import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
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

export default function GroupScreen({ navigation }: any) {
  const [groups, setGroups] = useState<GroupCard[]>([]);
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
              <Text style={styles.groupName}>{group.groupNm}</Text>
              <Text style={styles.masterName}>Master: {group.groupMstUserNm || 'N/A'}</Text>
              <Text style={styles.regDtm}>그룹 생성 시간: {group.regDtm || 'N/A'}</Text>
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