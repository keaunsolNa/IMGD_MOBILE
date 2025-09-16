import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from '@/styles/screens/community/CommunityScreen';
import { CommunityAPI, ArticleWithTags } from '@/services/community';
import { showErrorAlert } from '@/utils/alert';
import TextField from '@/components/TextField';
import { ArticleSearch } from '@/types/dto';

export default function CommunityScreen({ navigation, route }: any) {
  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 검색 조건 상태
  const [searchConditions, setSearchConditions] = useState<ArticleSearch>({
    title: '',
    article: '',
    userNm: ''
  });

  useFocusEffect(
    React.useCallback(() => {
      // 업데이트된 게시글 정보가 있으면 해당 게시글만 업데이트
      if (route.params?.updatedArticle) {
        const updatedArticle = route.params.updatedArticle;
        setArticles(prevArticles => 
          prevArticles.map(article => 
            article.articleId === updatedArticle.articleId ? updatedArticle : article
          )
        );
        // 파라미터 초기화
        navigation.setParams({ updatedArticle: null, refreshNeeded: false });
      } else {
        loadData();
      }
    }, [route.params?.updatedArticle])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('데이터 로딩 시작...');
      
      try {
        const articlesResponse = await CommunityAPI.getArticles(searchConditions);
        
        console.log('Articles Response:', articlesResponse);
        
        // 백엔드 API 응답 구조에 맞춰 데이터 설정
        const articles = articlesResponse.data || [];
        
        console.log('Parsed Articles:', articles);
        
        setArticles(articles);
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

        setArticles(mockArticles);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      showErrorAlert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleArticlePress = (article: ArticleWithTags) => {
    navigation.navigate('ArticleDetail', { article });
  };

  const handleCreateArticle = () => {
    navigation.navigate('CreateArticle', { onArticleCreated: loadData });
  };

  // 검색 조건 변경 핸들러
  const handleSearchChange = (field: keyof ArticleSearch, value: string) => {
    setSearchConditions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 검색 실행
  const handleSearch = () => {
    loadData();
  };

  // 검색 초기화
  const handleSearchReset = () => {
    setSearchConditions({
      title: '',
      article: '',
      userNm: ''
    });
    // 초기화 후 바로 검색 실행
    setTimeout(() => loadData(), 0);
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
            <View style={styles.likeButton}>
              <Text style={styles.articleStat}>❤️ {item.likeCnt || 0}</Text>
            </View>
            <Text style={styles.articleStat}>👁 {item.watchCnt || 0}</Text>
            <Text style={styles.articleStat}>💬 {item.commentCnt || 0}</Text>
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
      </View>

      {/* 검색 영역 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Text style={styles.searchLabel}>제목:</Text>
          <TextField
            value={searchConditions.title}
            onChangeText={(value) => handleSearchChange('title', value)}
            placeholder="제목으로 검색"
            style={styles.searchInput}
          />
        </View>
        <View style={styles.searchRow}>
          <Text style={styles.searchLabel}>본문:</Text>
          <TextField
            value={searchConditions.article}
            onChangeText={(value) => handleSearchChange('article', value)}
            placeholder="본문으로 검색"
            style={styles.searchInput}
          />
        </View>
        <View style={styles.searchRow}>
          <Text style={styles.searchLabel}>작성자:</Text>
          <TextField
            value={searchConditions.userNm}
            onChangeText={(value) => handleSearchChange('userNm', value)}
            placeholder="작성자로 검색"
            style={styles.searchInput}
          />
        </View>
        <View style={styles.searchButtons}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>검색</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleSearchReset}>
            <Text style={styles.resetButtonText}>초기화</Text>
          </TouchableOpacity>
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
    </View>
  );
}
