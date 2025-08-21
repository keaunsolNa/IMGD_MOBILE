import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { GroupAPI } from '@/services/api';

export default function MakeGroupScreen() {
  const [groupNm, setGroupNm] = useState('');

  const createGroup = async () => {
    if (!groupNm.trim()) return alert('그룹명을 입력하세요.');
    await GroupAPI.createGroup({ groupNm: groupNm.trim() });
    alert('그룹 생성 완료');
    setGroupNm('');
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Group Name</Text>
      <TextField value={groupNm} onChangeText={setGroupNm} />
      <View style={{ height: 12 }} />
      <Button title="Create" onPress={createGroup} />
    </View>
  );
}