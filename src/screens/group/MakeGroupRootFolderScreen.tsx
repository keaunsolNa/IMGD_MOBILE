import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Button from '../../components/Button';
import { GroupAPI, FileAPI } from '@/services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import { Picker } from '@react-native-picker/picker';

export default function MakeGroupRootFolderScreen() {
  const [groups, setGroups] = useState<Array<{ groupId?: number; groupNm: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const subject = getSubjectFromToken(accessToken);

  const loadGroups = async () => {
    if (!subject) return;
    try {
      const { data } = await GroupAPI.findGroupName(subject);
      const list = (Array.isArray(data) ? data : []).filter((g: any) => typeof g.groupId === 'number');
      setGroups(list);
      setSelectedGroupId('');
    } catch (e: any) {
      alert('그룹 목록 조회 실패: ' + (e?.message ?? 'unknown'));
    }
  };

  useEffect(() => {
    (async () => { await loadGroups(); })();
  }, [subject]);

  const selected = selectedGroupId
    ? groups.find(x => String(x.groupId) === selectedGroupId) ?? null
    : null;

  const doMake = async () => {
    if (!subject) return;
    if (!selected || typeof selected.groupId !== 'number') {
      return alert('유효한 그룹을 선택하세요.');
    }
    await FileAPI.makeGroupDir({ 
      groupId: selected.groupId, 
      groupNm: selected.groupNm,
      groupMstUserId: subject 
    });
    await loadGroups();
    alert('그룹 루트 폴더 생성 완료');
  };

  const canMake = !!(selected && typeof selected.groupId === 'number');

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>그룹 선택</Text>
      <View style={{ height: 8 }} />
      <Picker
        selectedValue={selectedGroupId}
        onValueChange={(value) => {
          setSelectedGroupId(value);
        }}
      >
        <Picker.Item label="그룹을 선택하세요" value="" />
        {groups.map((g, idx) => (
          <Picker.Item key={idx} label={g.groupNm} value={String(g.groupId)} />
        ))}
      </Picker>
      <View style={{ height: 12 }} />
      <Button title="Make Group Root Folder" onPress={doMake} disabled={!canMake} />
    </View>
  );
} 