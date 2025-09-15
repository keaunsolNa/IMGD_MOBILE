import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { styles } from '@/styles/screens/community/CreateArticleScreen';
import { CommunityAPI, Tag, ArticleWithTags } from '@/services/community';

interface CreateArticleScreenProps {
  navigation: any;
  onArticleCreated?: () => void;
}

export default function CreateArticleScreen({ navigation, route }: any) {
  const { onArticleCreated } = route.params || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    loadAvailableTags();
  }, []);

  const loadAvailableTags = async () => {
    try {
      setLoadingTags(true);
      const response = await CommunityAPI.getTags();
      setAvailableTags(response.data || []);
    } catch (error) {
      console.error('태그 목록 로딩 실패:', error);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSelectTag = (tagName: string) => {
    if (!tags.includes(tagName)) {
      setTags([...tags, tagName]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('오류', '제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('오류', '내용을 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      // 선택된 태그들을 Tag 객체 배열로 변환
      const selectedTags = tags.map(tagName => {
        const tag = availableTags.find(t => t.name === tagName);
        return tag || { id: 0, name: tagName, color: '#ccc', articleCount: 0 };
      });
      
      // ArticleWithTags 형태로 데이터 구성 (백엔드 구조에 맞춤)
      const articleData: ArticleWithTags = {
        // articleId는 AUTO_INCREMENT이므로 제거
        postPwd: password.trim(),
        type: 'POST', // TYPE을 POST로 설정
        title: title.trim(),
        article: content.trim(), // content 대신 article 사용
        regDtm: new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tagList: selectedTags // tags 대신 tagList 사용
      };
      
      const response = await CommunityAPI.createArticle(articleData);
      
      if (response.data?.success) {
        Alert.alert('성공', '게시글이 작성되었습니다.', [
          { 
            text: '확인', 
            onPress: () => {
              onArticleCreated?.(); // 게시글 목록 새로고침
              navigation.goBack();
            }
          }
        ]);
      } else {
        Alert.alert('오류', '게시글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      Alert.alert('오류', '게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim() || password.trim() || tags.length > 0) {
      Alert.alert(
        '작성 취소',
        '작성 중인 내용이 있습니다. 정말 취소하시겠습니까?',
        [
          { text: '계속 작성', style: 'cancel' },
          { text: '취소', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const renderAvailableTag = ({ item }: { item: Tag }) => {
    const isSelected = tags.includes(item.name);
    
    return (
      <TouchableOpacity
        style={[
          styles.availableTagItem,
          isSelected && styles.selectedAvailableTag
        ]}
        onPress={() => handleSelectTag(item.name)}
        disabled={isSelected}
      >
        <View style={[styles.availableTagColor, { backgroundColor: item.color }]} />
        <Text style={[
          styles.availableTagText,
          isSelected && styles.selectedAvailableTagText
        ]}>
          {item.name}
        </Text>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>글쓰기</Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? '작성 중...' : '완료'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력하세요"
            placeholderTextColor="#999"
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* 내용 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="내용을 입력하세요"
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            maxLength={5000}
          />
          <Text style={styles.charCount}>{content.length}/5000</Text>
        </View>

        {/* 비밀번호 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="게시글 비밀번호를 입력하세요"
            placeholderTextColor="#999"
            secureTextEntry
            maxLength={20}
          />
          <Text style={styles.charCount}>{password.length}/20</Text>
        </View>

        {/* 태그 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>태그</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="태그를 입력하세요"
              placeholderTextColor="#999"
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={styles.addTagButton}
              onPress={handleAddTag}
            >
              <Text style={styles.addTagText}>추가</Text>
            </TouchableOpacity>
          </View>
          
          {/* 선택된 태그 목록 */}
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity 
                    style={styles.removeTagButton}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <Text style={styles.removeTagText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* 사용 가능한 태그 목록 */}
          <View style={styles.availableTagsSection}>
            <Text style={styles.availableTagsLabel}>사용 가능한 태그</Text>
            {loadingTags ? (
              <Text style={styles.loadingText}>태그를 불러오는 중...</Text>
            ) : (
              <FlatList
                data={availableTags}
                renderItem={renderAvailableTag}
                keyExtractor={(item, index) => item?.id?.toString() || `available-tag-${index}`}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.availableTagsList}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
