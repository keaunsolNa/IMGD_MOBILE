import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { styles } from '@/styles/screens/community/CreateTagModal';
import { CommunityAPI } from '@/services/community';

interface CreateTagModalProps {
  visible: boolean;
  onClose: () => void;
  onTagCreated: () => void;
}

export default function CreateTagModal({ visible, onClose, onTagCreated }: CreateTagModalProps) {
  const [tagName, setTagName] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [tagColor, setTagColor] = useState('#007AFF');
  const [loading, setLoading] = useState(false);

  const predefinedColors = [
    '#007AFF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE',
    '#5AC8FA', '#FF2D92', '#FFCC00', '#8E8E93', '#000000'
  ];

  const handleSubmit = async () => {
    if (!tagName.trim()) {
      Alert.alert('오류', '태그 이름을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await CommunityAPI.createTag({
        name: tagName.trim(),
        description: tagDescription.trim(),
        color: tagColor
      });
      
      // ApiResponse<List<Tag>> 구조에 맞춰 응답 처리
      if (response.data?.success) {
        Alert.alert('성공', '태그가 생성되었습니다.');
        setTagName('');
        setTagDescription('');
        setTagColor('#007AFF');
        onClose();
        // 모달을 닫은 후 데이터 새로고침
        onTagCreated();
      } else {
        Alert.alert('오류', response.data?.message || '태그 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('태그 생성 실패:', error);
      Alert.alert('오류', '태그 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTagName('');
    setTagDescription('');
    setTagColor('#007AFF');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.modal}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.title}>새 태그 만들기</Text>
              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                disabled={loading}
              >
                <Text style={styles.submitText}>
                  {loading ? '생성 중...' : '완료'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* 태그 이름 입력 */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>태그 이름</Text>
                <TextInput
                  style={styles.textInput}
                  value={tagName}
                  onChangeText={setTagName}
                  placeholder="태그 이름을 입력하세요"
                  placeholderTextColor="#999"
                  maxLength={20}
                />
                <Text style={styles.charCount}>{tagName.length}/20</Text>
              </View>

              {/* 태그 설명 입력 */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>태그 설명</Text>
                <TextInput
                  style={[styles.textInput, styles.descriptionInput]}
                  value={tagDescription}
                  onChangeText={setTagDescription}
                  placeholder="태그에 대한 설명을 입력하세요 (선택사항)"
                  placeholderTextColor="#999"
                  multiline
                  textAlignVertical="top"
                  maxLength={100}
                />
                <Text style={styles.charCount}>{tagDescription.length}/100</Text>
              </View>

              {/* 색상 선택 */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>태그 색상</Text>
                <View style={styles.colorContainer}>
                  {predefinedColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        tagColor === color && styles.selectedColorButton
                      ]}
                      onPress={() => setTagColor(color)}
                    >
                      {tagColor === color && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.selectedColorPreview}>
                  <Text style={styles.previewLabel}>미리보기:</Text>
                  <View style={[styles.previewTag, { backgroundColor: tagColor + '20' }]}>
                    <Text style={[styles.previewTagText, { color: tagColor }]}>
                      #{tagName || '태그이름'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
