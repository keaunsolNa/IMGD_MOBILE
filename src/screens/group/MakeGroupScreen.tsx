import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { GroupAPI } from '@/services/api';
import { styles } from '@/styles/screens/group/MakeGroupScreen';

export default function MakeGroupScreen() {
  const [groupNm, setGroupNm] = useState('');

  const createGroup = async () => {
    if (!groupNm.trim()) return alert('그룹명을 입력하세요.');
    await GroupAPI.createGroup({ groupNm: groupNm.trim() });
    alert('그룹 생성 완료');
    setGroupNm('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Name</Text>
      <View style={styles.inputContainer}>
        <TextField value={groupNm} onChangeText={setGroupNm} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Create" onPress={createGroup} />
      </View>
    </View>
  );
}