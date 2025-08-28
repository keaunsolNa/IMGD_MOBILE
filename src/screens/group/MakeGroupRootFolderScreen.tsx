import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Button from '../../components/Button';
import { GroupAPI, FileAPI } from '@/services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import { styles } from '@/styles/screens/group/MakeGroupRootFolderScreen';

export default function MakeGroupRootFolderScreen({ navigation }: any) {
  const [groups, setGroups] = useState<Array<{ groupId?: number; groupNm: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [showPicker, setShowPicker] = useState(false);
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
    
    try {
      const response = await FileAPI.makeGroupDir({ 
        groupId: selected.groupId, 
        groupNm: selected.groupNm,
        groupMstUserId: subject 
      });
      
      // 백엔드에서 DTO를 직접 반환하는 경우 (fileId가 있는 경우)
      if (response.data && response.data.fileId) {
        await loadGroups();
        alert('그룹 루트 폴더 생성 완료');
        // Groups 페이지로 이동
        navigation.navigate('Groups');
      } else if (response.data && response.data.success === true) {
        await loadGroups();
        alert('그룹 루트 폴더 생성 완료');
        // Groups 페이지로 이동
        navigation.navigate('Groups');
      } else if (response.data && response.data.success === false) {
        alert('그룹 루트 폴더 생성에 실패했습니다.');
      } else {
        alert('그룹 루트 폴더 생성에 실패했습니다.');
      }
    } catch (error: any) {
      alert('그룹 루트 폴더 생성에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
    }
  };

  const canMake = !!(selected && typeof selected.groupId === 'number');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>그룹 선택</Text>
      <View style={styles.pickerContainer}>
        <TouchableOpacity 
          style={styles.pickerButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {selectedGroupId ? groups.find(g => String(g.groupId) === selectedGroupId)?.groupNm : '그룹을 선택하세요'}
          </Text>
        </TouchableOpacity>
        
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>그룹 선택</Text>
              <ScrollView style={styles.modalScrollView}>
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedGroupId('');
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>그룹을 선택하세요</Text>
                </TouchableOpacity>
                {groups.map((g, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedGroupId(String(g.groupId));
                      setShowPicker(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{g.groupNm}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.modalCloseButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Make Group Root Folder" onPress={doMake} disabled={!canMake} />
      </View>
    </View>
  );
} 