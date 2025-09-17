import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Image
} from 'react-native';
import { useSelector } from 'react-redux';
import { CommunityAPI, ArticleWithTags } from '@/services/community';
import { showErrorAlert, showSuccessAlert } from '@/utils/alert';
import TextField from '@/components/TextField';
import { getProfileImageUrl } from '@/services/api';
import { getSubjectFromToken } from '@/services/jwt';
import type { RootState } from '@/redux/store';

interface ArticleDetailScreenProps {
  navigation: any;
  route: any;
}

export default function ArticleDetailScreen({ navigation, route }: ArticleDetailScreenProps) {
  const { article: initialArticle } = route.params || {};
  const [article, setArticle] = useState<ArticleWithTags | null>(initialArticle);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // 댓글 관련 상태
  const [commentTitle, setCommentTitle] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // 현재 로그인한 유저 정보 가져오기
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const currentUserId = getSubjectFromToken(accessToken);

  useEffect(() => {
    if (initialArticle?.articleId) {
      loadArticle(initialArticle.articleId);
    }
  }, [initialArticle?.articleId]);

  const loadArticle = async (articleId: number) => {
    try {
      setLoading(true);
      const response = await CommunityAPI.getArticle(articleId);
      if (response.data) {
        setArticle(response.data);
      }
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
      showErrorAlert('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (article?.articleId) {
      setRefreshing(true);
      await loadArticle(article.articleId);
      setRefreshing(false);
    }
  };

  const handleLike = async () => {
    if (!article?.articleId) return;
    
    // 현재 로그인한 유저와 게시글 작성자가 같은지 확인
    if (currentUserId && article.userId && currentUserId === article.userId) {
      showErrorAlert('자신의 게시글에는 좋아요를 누를 수 없습니다.');
      return;
    }
    
    try {
      const response = await CommunityAPI.likeArticle(article.articleId);
      
      if (response.data?.success) {
        // 업데이트된 게시글 정보로 상태 업데이트
        setArticle(response.data.data);
      } else {
        showErrorAlert('좋아요 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      showErrorAlert('좋아요 처리에 실패했습니다.');
    }
  };

  const handleBack = () => {
    // 업데이트된 게시글 정보를 커뮤니티 화면에 전달
    if (article) {
      navigation.navigate('Community', { 
        updatedArticle: article,
        refreshNeeded: true 
      });
    } else {
      navigation.goBack();
    }
  };

  // 댓글 삭제 함수
  const handleCommentDelete = async (articleId: number, commentId: number) => {
    if (!articleId || !commentId) return;

    // 확인 다이얼로그
    const confirmMessage = '댓글을 삭제하시겠습니까?';
    
    if (typeof window !== 'undefined' && window.confirm) {
      // 웹 환경
      if (!window.confirm(confirmMessage)) return;
    } else {
      // 네이티브 환경에서는 간단한 확인 처리
      console.log('네이티브 환경에서 확인 다이얼로그 필요');
    }

    try {
      const response = await CommunityAPI.deleteComment(articleId, commentId);
      
      if (response.data?.success) {
        // 댓글 삭제 성공 시 게시글 정보 새로고침
        if (article?.articleId) {
          await loadArticle(article.articleId);
        }
        showSuccessAlert('댓글이 삭제되었습니다.');
      } else {
        showErrorAlert('댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      showErrorAlert('댓글 삭제에 실패했습니다.');
    }
  };

  // 댓글 좋아요 함수
  const handleCommentLike = async (commentArticleId: number) => {
    if (!commentArticleId) return;

    try {
      const response = await CommunityAPI.likeArticle(commentArticleId);
      
      if (response.data?.success) {
        // 댓글 좋아요 성공 시 게시글 정보 새로고침
        if (article?.articleId) {
          await loadArticle(article.articleId);
        }
      } else {
        showErrorAlert('댓글 좋아요에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 좋아요 실패:', error);
      showErrorAlert('댓글 좋아요에 실패했습니다.');
    }
  };

  // 댓글 제출 함수
  const handleCommentSubmit = async () => {
    if (!article?.articleId) return;
    
    if (!commentTitle.trim() || !commentContent.trim()) {
      showErrorAlert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    if (commentContent.length > 200) {
      showErrorAlert('댓글 내용은 200자를 초과할 수 없습니다.');
      return;
    }
    
    try {
      setIsSubmittingComment(true);
      
      // 댓글 데이터 생성 (type을 COMMENT로 설정)
      const commentData: ArticleWithTags = {
        articleId: 0, // 댓글은 articleId가 0
        postPwd: '', // 비밀번호 제거됨
        type: 'COMMENT',
        tagIds: '',
        tagList: [],
        userId: currentUserId || '',
        userNm: '익명',
        title: commentTitle,
        article: commentContent,
        likeCnt: 0,
        watchCnt: 0,
        regDtm: new Date().toISOString(),
        regId: currentUserId || '',
        modDtm: new Date().toISOString(),
        modId: currentUserId || ''
      };
      
      const response = await CommunityAPI.insertComment(article.articleId, commentData);
      
      if (response.data?.success) {
        // 댓글 제출 후 게시글 정보 새로고침
        await loadArticle(article.articleId);
        
        // 입력 필드 초기화
        setCommentTitle('');
        setCommentContent('');
        
        showSuccessAlert('댓글이 작성되었습니다.');
      } else {
        showErrorAlert('댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      showErrorAlert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!article) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>게시글</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>게시글</Text>
        <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
          <Text style={styles.likeText}>❤️ {article.likeCnt || 0}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 게시글 헤더 */}
        <View style={styles.articleHeader}>
          <Text style={styles.title}>{article.title}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.author}>작성자: {article.userNm || '알 수 없음'}</Text>
            <Text style={styles.date}>{article.regDtm}</Text>
          </View>
        </View>

        {/* 태그 목록 */}
        {article.tagList && article.tagList.length > 0 && (
          <View style={styles.tagsContainer}>
            {article.tagList.map((tag, index) => (
              <View 
                key={index} 
                style={[
                  styles.tagItem, 
                  { backgroundColor: (tag.color || '#ccc') + '20' }
                ]}
              >
                <Text style={[styles.tagText, { color: tag.color || '#666' }]}>
                  #{tag.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 게시글 내용 */}
        <View style={styles.articleContent}>
          <Text style={styles.contentText}>{article.article}</Text>
        </View>

        {/* 게시글 통계 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>조회수</Text>
            <Text style={styles.statValue}>{article.watchCnt || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>좋아요</Text>
            <Text style={styles.statValue}>{article.likeCnt || 0}</Text>
          </View>
        </View>

        {/* 댓글 목록 */}
        {article.comments && article.comments.length > 0 && (
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsTitle}>댓글 ({article.comments.length})</Text>
            {article.comments.map((comment, index) => (
              <View key={index} style={styles.commentItem}>
                <View style={styles.commentContentContainer}>
                  {/* 프로필 사진 */}
                  <Image
                    source={getProfileImageUrl(comment.pictureNm)}
                    style={styles.commentProfileImage}
                  />
                  
                  {/* 댓글 내용 */}
                  <View style={styles.commentTextContainer}>
                    <Text style={styles.commentTitleContent}>
                      <Text style={styles.commentTitle}>{comment.title}</Text>
                      <Text style={styles.commentTitleSeparator}> : </Text>
                      <Text style={styles.commentContent}>{comment.article}</Text>
                    </Text>
                    <View style={styles.commentFooter}>
                      <Text style={styles.commentAuthorDate}>
                        <Text style={styles.commentAuthorLabel}>작성자 : </Text>
                        <Text style={styles.commentAuthor}>{comment.userNm || '익명'}</Text>
                        <Text style={styles.commentDateSeparator}> ( </Text>
                        <Text style={styles.commentDate}>{comment.regDtm || ''}</Text>
                        <Text style={styles.commentDateSeparator}> )</Text>
                      </Text>
                      <View style={styles.commentActions}>
                        <TouchableOpacity 
                          style={styles.commentLikeButton}
                          onPress={() => handleCommentLike(comment.articleId!)}
                        >
                          <Text style={styles.commentLikeButtonText}>👍 {comment.likeCnt || 0}</Text>
                        </TouchableOpacity>
                        {/* 본인이 작성한 댓글만 삭제 버튼 표시 */}
                        {comment.userId === currentUserId && (
                          <TouchableOpacity 
                            style={styles.commentDeleteButton}
                            onPress={() => handleCommentDelete(article?.articleId!, comment.articleId!)}
                          >
                            <Text style={styles.commentDeleteButtonText}>🗑️</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 댓글 입력창 */}
        <View style={styles.commentFormContainer}>
          <Text style={styles.commentFormTitle}>댓글 작성</Text>
          
          <View style={styles.commentInputRow}>
            <Text style={styles.commentLabel}>제목:</Text>
            <TextField
              value={commentTitle}
              onChangeText={setCommentTitle}
              placeholder="댓글 제목을 입력하세요"
              style={styles.commentInput}
            />
          </View>
          
          <View style={styles.commentInputRow}>
            <Text style={styles.commentLabel}>내용:</Text>
            <View style={styles.commentInputContentContainer}>
              <TextField
                value={commentContent}
                onChangeText={setCommentContent}
                placeholder="댓글 내용을 입력하세요 (최대 200자)"
                multiline
                numberOfLines={3}
                maxLength={200}
                style={[styles.commentInput, styles.commentTextArea]}
              />
              <Text style={styles.characterCount}>
                {commentContent.length}/200
              </Text>
            </View>
          </View>
          
          
          <TouchableOpacity
            style={[styles.commentSubmitButton, isSubmittingComment && styles.commentSubmitButtonDisabled]}
            onPress={handleCommentSubmit}
            disabled={isSubmittingComment}
          >
            <Text style={styles.commentSubmitButtonText}>
              {isSubmittingComment ? '작성 중...' : '댓글 작성'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  likeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  articleHeader: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  articleContent: {
    paddingVertical: 20,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // 댓글 입력창 스타일
  commentFormContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    width: 80,
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  commentTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  commentInputContentContainer: {
    flex: 1,
    position: 'relative',
  },
  characterCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 12,
    color: '#999',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  commentSubmitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  commentSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  // 댓글 목록 스타일
  commentsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  commentContentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  commentTextContainer: {
    flex: 1,
  },
  commentTitleContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTitle: {
    fontWeight: '600',
    color: '#333',
  },
  commentTitleSeparator: {
    color: '#666',
  },
  commentContent: {
    color: '#555',
  },
  commentAuthorDate: {
    fontSize: 12,
    color: '#666',
  },
  commentAuthorLabel: {
    color: '#999',
  },
  commentAuthor: {
    fontWeight: '500',
    color: '#333',
  },
  commentDateSeparator: {
    color: '#999',
  },
  commentDate: {
    color: '#999',
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentLikeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  commentLikeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  commentDeleteButton: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  commentDeleteButtonText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
});
