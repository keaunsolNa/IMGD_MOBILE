import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { styles } from '@/styles/screens/community/CommunityScreen';
import { CommunityAPI, ArticleWithTags, Tag } from '@/services/community';
import CreateTagModal from './CreateTagModal';

export default function CommunityScreen({ navigation }: any) {
  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('데이터 로딩 시작...');
      
      try {
        const [articlesResponse, tagsResponse] = await Promise.all([
          CommunityAPI.getArticles(),
          CommunityAPI.getTags()
        ]);
        
        console.log('Articles Response:', articlesResponse);
        console.log('Tags Response:', tagsResponse);
        
        // 백엔드 API 응답 구조에 맞춰 데이터 설정
        const articles = articlesResponse.data || [];
        const tags = tagsResponse.data || [];
        
        console.log('Parsed Articles:', articles);
        console.log('Parsed Tags:', tags);
        
        setArticles(articles);
        setTags(tags);
      } catch (apiError) {
        console.log('API 호출 실패, 목업 데이터 사용:', apiError);
        
        // 임시 목업 데이터
        const mockArticles: ArticleWithTags[] = [
          {
            articleId: 1,
            title: "React Native 개발 팁",
            article: "React Native로 모바일 앱을 개발할 때 유용한 팁들을 공유합니다. 성능 최적화, 네비게이션, 상태 관리 등 다양한 주제를 다룹니다.",
            regDtm: "2024년 01월 15일",
            regId: "user1",
            userId: "user1",
            userNm: "나큰솔",
            tagIds: "1",
            tagList: [{ 
              tagId: 1, 
              name: "React Native", 
              color: "#61DAFB", 
              description: "React Native 관련",
              regDtm: "2024년 01월 15일",
              regId: "user1",
              modDtm: "2024년 01월 15일",
              modId: "user1"
            }],
            like: 5,
            watch: 10
          },
          {
            articleId: 2,
            title: "TypeScript 베스트 프랙티스",
            article: "TypeScript를 사용할 때 알아두면 좋은 베스트 프랙티스들을 정리했습니다. 타입 안정성과 코드 품질 향상을 위한 가이드입니다.",
            regDtm: "2024년 01월 14일",
            regId: "user2",
            userId: "user2",
            userNm: "개발자",
            tagIds: "2",
            tagList: [{ 
              tagId: 2, 
              name: "TypeScript", 
              color: "#3178C6", 
              description: "TypeScript 관련",
              regDtm: "2024년 01월 14일",
              regId: "user2",
              modDtm: "2024년 01월 14일",
              modId: "user2"
            }],
            like: 3,
            watch: 7
          }
        ];

        const mockTags: Tag[] = [
          { 
            tagId: 1, 
            name: "React Native", 
            color: "#61DAFB", 
            description: "React Native 관련",
            regDtm: "2024년 01월 15일",
            regId: "user1",
            modDtm: "2024년 01월 15일",
            modId: "user1",
            articleCount: 5 
          },
          { 
            tagId: 2, 
            name: "TypeScript", 
            color: "#3178C6", 
            description: "TypeScript 관련",
            regDtm: "2024년 01월 14일",
            regId: "user2",
            modDtm: "2024년 01월 14일",
            modId: "user2",
            articleCount: 3 
          },
          { 
            tagId: 3, 
            name: "모바일", 
            color: "#FF6B6B", 
            description: "모바일 개발 관련",
            regDtm: "2024년 01월 13일",
            regId: "user3",
            modDtm: "2024년 01월 13일",
            modId: "user3",
            articleCount: 8 
          },
          { 
            tagId: 4, 
            name: "개발", 
            color: "#4ECDC4", 
            description: "일반 개발 관련",
            regDtm: "2024년 01월 12일",
            regId: "user4",
            modDtm: "2024년 01월 12일",
            modId: "user4",
            articleCount: 12 
          }
        ];

        setArticles(mockArticles);
        setTags(mockTags);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTagPress = (tagId: number) => {
    setSelectedTag(selectedTag === tagId ? null : tagId);
    // 태그 필터링 로직 (클라이언트 사이드)
    if (selectedTag === tagId) {
      loadData(); // 모든 게시글 표시
    } else {
      const filteredArticles = articles.filter(article => 
        article.tagList?.some(tag => tag.tagId === tagId) || false
      );
      setArticles(filteredArticles);
    }
  };

  const handleArticlePress = (article: ArticleWithTags) => {
    navigation.navigate('ArticleDetail', { article });
  };

  const handleCreateArticle = () => {
    navigation.navigate('CreateArticle', { onArticleCreated: loadData });
  };

  const handleCreateTag = () => {
    setShowTagModal(true);
  };

  const handleTagCreated = async () => {
    // 태그 생성 후 데이터 새로고침
    await loadData();
  };

  const handleLike = async (articleId: number | undefined) => {
    if (!articleId) return;
    
    try {
      await CommunityAPI.toggleLike(articleId);
      // 좋아요 수는 백엔드에서 관리되므로 새로고침
      loadData();
    } catch (error) {
      Alert.alert('오류', '좋아요 처리에 실패했습니다.');
    }
  };

  const renderTag = ({ item }: { item: Tag }) => {
    if (!item || !item.tagId) return null;
    
    return (
      <TouchableOpacity
        style={[
          styles.tagButton,
          selectedTag === item.tagId && styles.selectedTagButton
        ]}
        onPress={() => handleTagPress(item.tagId)}
      >
        <Text style={[
          styles.tagText,
          selectedTag === item.tagId && styles.selectedTagText
        ]}>
          {item.name || 'Unknown Tag'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderArticle = ({ item }: { item: ArticleWithTags }) => {
    if (!item || !item.articleId) return null;
    
    return (
      <TouchableOpacity
        style={styles.articleItem}
        onPress={() => handleArticlePress(item)}
      >
        <View style={styles.articleHeader}>
          <Text style={styles.articleTitle}>{item.title || '제목 없음'}</Text>
          <Text style={styles.articleAuthor}>{item.userNm || '작성자'}</Text>
        </View>
        <Text style={styles.articleContent} numberOfLines={2}>
          {item.article && item.article.length > 50 
            ? item.article.substring(0, 50) + '...' 
            : item.article || '내용 없음'}
        </Text>
        <View style={styles.articleFooter}>
          <View style={styles.articleTags}>
            {(item.tagList || []).map((tag, index) => (
              <View key={index} style={[styles.articleTag, { backgroundColor: (tag.color || '#ccc') + '20' }]}>
                <Text style={[styles.articleTagText, { color: tag.color || '#666' }]}>#{tag.name || 'Unknown'}</Text>
              </View>
            ))}
          </View>
          <View style={styles.articleStats}>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={() => handleLike(item.articleId)}
            >
              <Text style={styles.articleStat}>❤️ 0</Text>
            </TouchableOpacity>
            <Text style={styles.articleStat}>👁 0</Text>
            <Text style={styles.articleStat}>💬 0</Text>
            <Text style={styles.articleDate}>
              {item.regDtm || '날짜 없음'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      {/* 고정된 상단 영역 */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>커뮤니티</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateArticle}
          >
            <Text style={styles.createButtonText}>+ 글쓰기</Text>
          </TouchableOpacity>
        </View>
        
        {/* 태그 필터 */}
        <View style={styles.tagContainer}>
          <FlatList
            data={tags}
            renderItem={renderTag}
            keyExtractor={(item, index) => item?.tagId?.toString() || `tag-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagList}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleCreateTag}
              >
                <Text style={styles.addTagText}>+ 태그 추가</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>

      {/* 게시글 목록 */}
      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item, index) => item?.articleId?.toString() || `article-${index}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.articleList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? '로딩 중...' : '게시글이 없습니다.'}
            </Text>
          </View>
        }
      />

      {/* 태그 생성 모달 */}
      <CreateTagModal
        visible={showTagModal}
        onClose={() => setShowTagModal(false)}
        onTagCreated={handleTagCreated}
      />
    </View>
  );
}
