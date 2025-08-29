import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { GroupAPI, FileAPI } from '@/services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import { styles } from '@/styles/screens/group/MakeGroupScreen';

export default function MakeGroupScreen({ navigation }: any) {
  const [groupNm, setGroupNm] = useState('');
  const [creating, setCreating] = useState(false);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const subject = getSubjectFromToken(accessToken);

  const createGroup = async () => {
    if (!groupNm.trim()) return alert('그룹명을 입력하세요.');
    if (!subject) return alert('사용자 정보를 가져올 수 없습니다.');
    
    setCreating(true);
    try {
      // 1단계: 그룹 생성
      const groupResponse = await GroupAPI.createGroup({ groupNm: groupNm.trim() });
      
      let groupId: number | undefined;
      
      // 백엔드 응답에서 groupId 추출
      if (groupResponse.data && Array.isArray(groupResponse.data) && groupResponse.data.length > 0 && groupResponse.data[0].groupId) {
        groupId = groupResponse.data[0].groupId;
      } else if (groupResponse.data && groupResponse.data.groupId) {
        groupId = groupResponse.data.groupId;
      } else if (groupResponse.data && groupResponse.data.success === true && groupResponse.data.groupId) {
        groupId = groupResponse.data.groupId;
      }
      
      if (!groupId) {
        alert('그룹 생성에 실패했습니다.');
        return;
      }
      
      // 2단계: 그룹 루트 폴더 자동 생성
      try {
        const folderResponse = await FileAPI.makeGroupDir({
          groupId: groupId,
          groupNm: groupNm.trim(),
          groupMstUserId: subject
        });
        
        if (folderResponse.data && (folderResponse.data.fileId || folderResponse.data.success === true)) {
          alert('그룹과 루트 폴더가 성공적으로 생성되었습니다!');
          setGroupNm('');
          // Groups 페이지로 이동
          navigation.navigate('Groups');
        } else {
          alert('그룹은 생성되었지만 루트 폴더 생성에 실패했습니다.');
          setGroupNm('');
          navigation.navigate('Groups');
        }
      } catch (folderError: any) {
        console.error('루트 폴더 생성 실패:', folderError);
        alert('그룹은 생성되었지만 루트 폴더 생성에 실패했습니다. 수동으로 생성해주세요.');
        setGroupNm('');
        navigation.navigate('Groups');
      }
      
    } catch (error: any) {
      alert('그룹 생성에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Name</Text>
      <View style={styles.inputContainer}>
        <TextField value={groupNm} onChangeText={setGroupNm} />
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          title={creating ? "생성 중..." : "Create"} 
          onPress={createGroup} 
          disabled={creating}
        />
      </View>
    </View>
  );
}