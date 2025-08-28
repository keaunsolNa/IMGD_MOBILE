import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { GroupAPI } from '@/services/api';
import { styles } from '@/styles/screens/group/MakeGroupScreen';

export default function MakeGroupScreen({ navigation }: any) {
  const [groupNm, setGroupNm] = useState('');

  const createGroup = async () => {
    if (!groupNm.trim()) return alert('그룹명을 입력하세요.');
    
    try {
      const response = await GroupAPI.createGroup({ groupNm: groupNm.trim() });
      
      // 백엔드에서 DTO 배열을 직접 반환하는 경우 (data가 배열이고 groupId가 있는 경우)
      if (response.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0].groupId) {
        alert('그룹 생성 완료');
        setGroupNm('');
        // Groups 페이지로 이동
        navigation.navigate('Groups');
      } else if (response.data && response.data.groupId) {
        alert('그룹 생성 완료');
        setGroupNm('');
        // Groups 페이지로 이동
        navigation.navigate('Groups');
      } else if (response.data && response.data.success === true) {
        alert('그룹 생성 완료');
        setGroupNm('');
        // Groups 페이지로 이동
        navigation.navigate('Groups');
      } else if (response.data && response.data.success === false) {
        alert('그룹 생성에 실패했습니다.');
      } else {
        alert('그룹 생성에 실패했습니다.');
      }
    } catch (error: any) {
      alert('그룹 생성에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
    }
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