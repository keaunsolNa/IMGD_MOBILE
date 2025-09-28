import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';

// 웹 환경에서 CKEditor 대신 간단한 HTML 에디터 사용
import { styles } from '@/styles/screens/community/CreateArticleScreen';
import { CommunityAPI, Tag, ArticleWithTags } from '@/services/community';
import { FileAPI } from '@/services/api';
import CreateTagModal from './CreateTagModal';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '@/utils/alert';

interface CreateArticleScreenProps {
  navigation: any;
  onArticleCreated?: () => void;
}

export default function CreateArticleScreen({ navigation, route }: any) {
  const { onArticleCreated } = route.params || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);
  
  // 파일 첨부 관련 상태
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // 웹 에디터 관련 상태
  const [useWebEditor, setUseWebEditor] = useState(true);
  const webViewRef = useRef<WebView>(null);

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

  const handleCreateTag = () => {
    setShowTagModal(true);
  };

  const handleTagCreated = async () => {
    // 태그 생성 후 사용 가능한 태그 목록 새로고침
    await loadAvailableTags();
  };

  // 파일 첨부 기능
  const handleAttachFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `file_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 0,
        }));
        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('파일 선택 실패:', error);
      showErrorAlert('파일 선택에 실패했습니다.');
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 웹 환경용 에디터 컴포넌트
  const WebEditor = () => {
    if (Platform.OS === 'web') {
      // 웹 환경에서는 간단한 HTML 에디터 사용
      return (
        <View style={styles.webEditorContainer}>
          <View style={styles.toolbar}>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={() => {
                const newContent = content + '<b></b>';
                setContent(newContent);
              }}
            >
              <Text style={styles.toolbarButtonText}>B</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={() => {
                const newContent = content + '<i></i>';
                setContent(newContent);
              }}
            >
              <Text style={styles.toolbarButtonText}>I</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={() => {
                const newContent = content + '<u></u>';
                setContent(newContent);
              }}
            >
              <Text style={styles.toolbarButtonText}>U</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={() => {
                const newContent = content + '<br/>• ';
                setContent(newContent);
              }}
            >
              <Text style={styles.toolbarButtonText}>•</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={() => {
                const url = prompt('링크 URL을 입력하세요:');
                if (url) {
                  const newContent = content + `<a href="${url}">링크</a>`;
                  setContent(newContent);
                }
              }}
            >
              <Text style={styles.toolbarButtonText}>🔗</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.webEditorInput}
            value={content}
            onChangeText={setContent}
            placeholder="내용을 입력하세요 (HTML 태그 사용 가능)"
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            maxLength={5000}
          />
        </View>
      );
    } else {
      // 네이티브 환경에서는 WebView 사용
      return (
        <View style={styles.webEditorContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: getWebEditorHTML() }}
            style={styles.webEditor}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={false}
          />
        </View>
      );
    }
  };

  // 웹 에디터 HTML 생성 (네이티브용)
  const getWebEditorHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
          }
          .editor-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .toolbar {
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            padding: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }
          .toolbar button {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          }
          .toolbar button:hover {
            background: #e9ecef;
          }
          .toolbar button.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
          }
          .editor {
            min-height: 200px;
            padding: 12px;
            border: none;
            outline: none;
            font-size: 16px;
            line-height: 1.5;
          }
          .editor:empty:before {
            content: "내용을 입력하세요...";
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="editor-container">
          <div class="toolbar">
            <button onclick="formatText('bold')" title="굵게">B</button>
            <button onclick="formatText('italic')" title="기울임">I</button>
            <button onclick="formatText('underline')" title="밑줄">U</button>
            <button onclick="formatText('strikeThrough')" title="취소선">S</button>
            <button onclick="insertList('ul')" title="목록">•</button>
            <button onclick="insertList('ol')" title="번호목록">1.</button>
            <button onclick="insertLink()" title="링크">🔗</button>
            <button onclick="insertImage()" title="이미지">🖼️</button>
            <button onclick="clearFormat()" title="서식지우기">🧹</button>
          </div>
          <div class="editor" contenteditable="true" id="editor"></div>
        </div>
        
        <script>
          function formatText(command) {
            document.execCommand(command, false, null);
            document.getElementById('editor').focus();
          }
          
          function insertList(type) {
            document.execCommand('insertUnorderedList', false, null);
            document.getElementById('editor').focus();
          }
          
          function insertLink() {
            const url = prompt('링크 URL을 입력하세요:');
            if (url) {
              document.execCommand('createLink', false, url);
            }
            document.getElementById('editor').focus();
          }
          
          function insertImage() {
            const url = prompt('이미지 URL을 입력하세요:');
            if (url) {
              const img = document.createElement('img');
              img.src = url;
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              document.execCommand('insertHTML', false, img.outerHTML);
            }
            document.getElementById('editor').focus();
          }
          
          function clearFormat() {
            document.execCommand('removeFormat', false, null);
            document.getElementById('editor').focus();
          }
          
          // 에디터 내용 변경 시 React Native로 전송
          document.getElementById('editor').addEventListener('input', function() {
            const content = this.innerHTML;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'contentChange',
              content: content
            }));
          });
          
          // 초기 내용 설정
          document.getElementById('editor').innerHTML = '${content.replace(/'/g, "\\'")}';
        </script>
      </body>
      </html>
    `;
  };

  // 웹 에디터에서 내용 변경 처리
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'contentChange') {
        setContent(data.content);
      }
    } catch (error) {
      console.error('웹뷰 메시지 처리 실패:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showErrorAlert('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      showErrorAlert('내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setUploadingFiles(true);
      
      // 선택된 태그들을 Tag 객체 배열로 변환
      const selectedTags = tags.map(tagName => {
        const tag = availableTags.find(t => t.name === tagName);
        return tag || { 
          tagId: 0, 
          name: tagName, 
          color: '#ccc', 
          regDtm: new Date().toISOString(),
          regId: 'user',
          modDtm: new Date().toISOString(),
          modId: 'user',
          articleCount: 0 
        };
      });
      
      // ArticleWithTags 형태로 데이터 구성 (백엔드 구조에 맞춤)
      const articleData: ArticleWithTags = {
        // articleId는 AUTO_INCREMENT이므로 제거
        postPwd: '', // 비밀번호 제거됨
        type: 'POST', // TYPE을 POST로 설정
        title: title.trim(),
        article: content.trim(), // content 대신 article 사용
        regDtm: new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tagList: selectedTags, // tags 대신 tagList 사용
        // attachedFiles: attachedFiles.map(file => ({
        //   fileName: file.name,
        //   fileId: Date.now() + Math.random(), // 임시 ID
        //   fileSize: file.size
        // }))
      };
      
      const response = await CommunityAPI.createArticle(articleData);
      
      if (response.data?.success) {
        // 게시글 목록 새로고침
        onArticleCreated?.();
        
        // 성공 후 해당 게시글을 바로 보기
        showSuccessAlert('게시글이 작성되었습니다.', () => {
          // 응답에서 생성된 게시글 ID를 사용하여 상세 화면으로 이동
          if (response.data?.data && response.data.data.length > 0) {
            const createdArticle = response.data.data[0];
            navigation.navigate('ArticleDetail', { article: createdArticle });
          } else {
            // fallback: 커뮤니티 화면으로 이동
            navigation.navigate('Community');
          }
        });
      } else {
        showErrorAlert('게시글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      showErrorAlert('게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim() || tags.length > 0) {
      showConfirmAlert(
        '작성 취소',
        '작성 중인 내용이 있습니다. 정말 취소하시겠습니까?',
        () => navigation.goBack(),
        () => {} // 계속 작성 (아무것도 하지 않음)
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
          <View style={styles.contentHeader}>
            <Text style={styles.label}>내용</Text>
            <TouchableOpacity 
              style={styles.editorToggle}
              onPress={() => setUseWebEditor(!useWebEditor)}
            >
              <Text style={styles.editorToggleText}>
                {useWebEditor ? '텍스트 모드' : '에디터 모드'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {useWebEditor ? (
            <WebEditor />
          ) : (
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
          )}
          <Text style={styles.charCount}>{content.length}/5000</Text>
        </View>

        {/* 파일 첨부 */}
        <View style={styles.inputSection}>
          <View style={styles.fileHeader}>
            <Text style={styles.label}>파일 첨부</Text>
            <TouchableOpacity 
              style={styles.attachButton}
              onPress={handleAttachFile}
              disabled={uploadingFiles}
            >
              <Text style={styles.attachButtonText}>
                {uploadingFiles ? '업로드 중...' : '+ 파일 첨부'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {attachedFiles.length > 0 && (
            <View style={styles.attachedFilesContainer}>
              {attachedFiles.map((file, index) => (
                <View key={index} style={styles.attachedFileItem}>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileSize}>
                      {file.size ? `${(file.size / 1024).toFixed(1)}KB` : '크기 미상'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeFileButton}
                    onPress={() => handleRemoveFile(index)}
                  >
                    <Text style={styles.removeFileText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
          
          {/* 새 태그 만들기 버튼 */}
          <TouchableOpacity 
            style={styles.createTagButton}
            onPress={handleCreateTag}
          >
            <Text style={styles.createTagText}>+ 새 태그 만들기</Text>
          </TouchableOpacity>
          
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
                keyExtractor={(item, index) => item?.tagId?.toString() || `available-tag-${index}`}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.availableTagsList}
              />
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* 태그 생성 모달 */}
      <CreateTagModal
        visible={showTagModal}
        onClose={() => setShowTagModal(false)}
        onTagCreated={handleTagCreated}
      />
    </KeyboardAvoidingView>
  );
}
