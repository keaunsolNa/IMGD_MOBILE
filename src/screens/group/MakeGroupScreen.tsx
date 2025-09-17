import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Button from '../../components/Button';
import { validateGroupName, validateGroupNameInput } from '@/utils/folderValidation';
import { GroupAPI, FileAPI } from '@/services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import { styles } from '@/styles/screens/group/MakeGroupScreen';

export default function MakeGroupScreen({ navigation }: any) {
  const [groupNm, setGroupNm] = useState('');
  const [creating, setCreating] = useState(false);
  const [groupValidation, setGroupValidation] = useState<{
    isValid: boolean;
    errorMessage?: string;
    sanitizedSuggestion?: string;
  }>({ isValid: true });
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const subject = getSubjectFromToken(accessToken);

  // 그룹명 입력 핸들러
  const handleGroupNameChange = (text: string) => {
    setGroupNm(text);
    const validation = validateGroupNameInput(text);
    setGroupValidation(validation);
  };

  // 정리된 그룹명 적용
  const handleApplySanitizedName = () => {
    if (groupValidation.sanitizedSuggestion) {
      setGroupNm(groupValidation.sanitizedSuggestion);
      setGroupValidation({ isValid: true });
    }
  };

  const createGroup = async () => {
    if (!groupNm.trim()) return alert('그룹명을 입력하세요.');
    if (!subject) return alert('사용자 정보를 가져올 수 없습니다.');

    // 그룹명 유효성 검사
    const validation = validateGroupName(groupNm.trim());
    if (!validation.isValid) {
      alert(validation.errorMessage || '그룹명이 올바르지 않습니다.');
      return;
    }
    
    setCreating(true);
    try {
      // 1단계: 그룹 생성
      const groupResponse = await GroupAPI.createGroup({ groupNm: groupNm.trim() });
      
      // ApiResponse 구조 확인
      if (!groupResponse.data.success) {
        const errorMessage = groupResponse.data.error?.message || '그룹 생성에 실패했습니다.';
        alert(`그룹 생성 실패: ${errorMessage}`);
        return;
      }
      
      // 성공한 경우 data에서 groupId 추출
      const groupData = groupResponse.data.data;
      let groupId: number | undefined;
      
      if (groupData && groupData.groupId) {
        groupId = groupData.groupId;
      } else if (Array.isArray(groupData) && groupData.length > 0 && groupData[0].groupId) {
        groupId = groupData[0].groupId;
      }
      
      if (!groupId) {
        alert('그룹 생성에 실패했습니다. groupId를 찾을 수 없습니다.');
        return;
      }
      
      // 2단계: 그룹 루트 폴더 자동 생성
      try {
        const folderResponse = await FileAPI.makeGroupDir({
          groupId: groupId,
          groupNm: groupNm.trim(),
          groupMstUserId: subject
        });
        
        // ApiResponse 구조 확인
        if (folderResponse.data.success) {
          alert('그룹과 루트 폴더가 성공적으로 생성되었습니다!');
          setGroupNm('');
          // Groups 페이지로 이동
          navigation.navigate('Groups');
        } else {
          // API에서 에러 응답을 받은 경우
          const errorMessage = folderResponse.data.error?.message || '그룹은 생성되었지만 루트 폴더 생성에 실패했습니다.';
          alert(errorMessage);
          setGroupNm('');
          navigation.navigate('Groups');
        }
      } catch (folderError: any) {
        console.error('루트 폴더 생성 실패:', folderError);
        
        // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
        if (folderError.response && folderError.response.data) {
          const responseData = folderError.response.data;
          
          // ApiResponse 구조인 경우
          if (responseData.error && responseData.error.message) {
            alert(`그룹은 생성되었지만 루트 폴더 생성에 실패했습니다: ${responseData.error.message}`);
          } else if (responseData.message) {
            alert(`그룹은 생성되었지만 루트 폴더 생성에 실패했습니다: ${responseData.message}`);
          } else {
            alert('그룹은 생성되었지만 루트 폴더 생성에 실패했습니다. 수동으로 생성해주세요.');
          }
        } else {
          // 네트워크 에러나 기타 에러
          alert('그룹은 생성되었지만 루트 폴더 생성에 실패했습니다. 수동으로 생성해주세요.');
        }
        setGroupNm('');
        navigation.navigate('Groups');
      }
      
    } catch (error: any) {
      console.error('그룹 생성 에러:', error);
      
      // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        
        // ApiResponse 구조인 경우
        if (responseData.error && responseData.error.message) {
          alert(`그룹 생성 실패: ${responseData.error.message}`);
        } else if (responseData.message) {
          alert(`그룹 생성 실패: ${responseData.message}`);
        } else {
          alert('그룹 생성에 실패했습니다.');
        }
      } else {
        // 네트워크 에러나 기타 에러
        alert('그룹 생성에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Name</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.groupNameInput,
            !groupValidation.isValid && styles.groupNameInputError
          ]}
          placeholder="그룹명을 입력하세요"
          value={groupNm}
          onChangeText={handleGroupNameChange}
        />
        
        {/* 유효성 검사 에러 메시지 */}
        {!groupValidation.isValid && groupValidation.errorMessage && (
          <View style={styles.validationErrorContainer}>
            <Text style={styles.validationErrorText}>
              {groupValidation.errorMessage}
            </Text>
            
            {/* 정리된 이름 제안 */}
            {groupValidation.sanitizedSuggestion && (
              <View style={styles.sanitizedSuggestionContainer}>
                <Text style={styles.sanitizedSuggestionText}>
                  제안: {groupValidation.sanitizedSuggestion}
                </Text>
                <TouchableOpacity 
                  style={styles.applySuggestionButton}
                  onPress={handleApplySanitizedName}
                >
                  <Text style={styles.applySuggestionButtonText}>적용</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          title={creating ? "생성 중..." : "Create"} 
          onPress={createGroup} 
          disabled={creating || !groupValidation.isValid}
        />
      </View>
    </View>
  );
}