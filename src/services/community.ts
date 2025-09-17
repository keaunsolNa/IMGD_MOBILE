import { api } from './api';
import { ApiResponse } from '@/types';
import { ArticleSearch } from '@/types/dto';

// 커뮤니티 관련 타입 정의
export interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  tags: string[];
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface Tag {
  tagId: number;
  name: string;
  description?: string;
  color: string;
  regDtm: string;
  regId: string;
  modDtm: string;
  modId: string;
  articleCount?: number;
}

export interface CreateTagRequest {
  name: string;
  description?: string;
  color: string;
}

export interface Comment {
  id: number;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  articleId: number;
}

export interface CreateCommentRequest {
  content: string;
  articleId: number;
}

// 백엔드 API에서 반환되는 ArticleWithTags 타입
export interface ArticleWithTags {
  articleId?: number;
  postPwd?: string | null;
  type?: string;
  tagIds?: string | null;
  tagList?: Tag[] | null;
  title: string;
  article: string;
  regDtm: string;
  regId?: string;
  modDtm?: string | null;
  modId?: string | null;
  userId?: string;
  userNm?: string;
  pictureNm?: string | null;
  like?: number | null;
  watch?: number | null;
  likeCnt?: number | null;
  watchCnt?: number | null;
  commentCnt?: number | null;
  comments?: ArticleWithTags[];
}

// Article API (실제 백엔드 API 사용)
export const ArticleAPI = {
  // 모든 게시글 조회 (백엔드 API 사용)
  getArticles: (search?: ArticleSearch) => {
    const params = new URLSearchParams();
    if (search?.title) params.append('title', search.title);
    if (search?.article) params.append('article', search.article);
    if (search?.userNm) params.append('userNm', search.userNm);
    
    const queryString = params.toString();
    const url = queryString ? `/api/article/findAllArticle?${queryString}` : '/api/article/findAllArticle';
    
    return api.get<ArticleWithTags[]>(url);
  },

  // 게시글 상세 조회
  getArticle: (id: number) => 
    api.get<ArticleWithTags>(`/api/article/findArticleById?articleId=${id}`),

  // 게시글 생성
  createArticle: (data: ArticleWithTags) => 
    api.post<ApiResponse<ArticleWithTags[]>>('/api/article/insertArticle', data),

  // 게시글 수정
  updateArticle: (id: number, data: UpdateArticleRequest) => 
    api.put<ApiResponse<ArticleWithTags>>(`/api/article/${id}`, data),

  // 게시글 삭제
  deleteArticle: (id: number) => 
    api.delete<ApiResponse<void>>(`/api/article/${id}`),

  // 게시글 좋아요
  likeArticle: (articleId: number) => 
    api.put<ApiResponse<ArticleWithTags>>('/api/article/likeArticle', articleId),

  // 댓글 추가
  insertComment: (articleId: number, commentData: ArticleWithTags) => 
    api.post<ApiResponse<ArticleWithTags>>(`/api/article/insertComment?articleId=${articleId}`, commentData),

  // 댓글 삭제
  deleteComment: (articleId: number, commentId: number) => 
    api.delete<ApiResponse<ArticleWithTags>>(`/api/article/deleteArticleComment?articleId=${articleId}&commentId=${commentId}`),

};

// Tag API (실제 백엔드 API 사용)
export const TagAPI = {
  // 모든 태그 조회
  getTags: () => {
    return api.get<Tag[]>('/api/tag/findAllTag');
  },

  // 신규 태그 생성
  createTag: (data: CreateTagRequest) => 
    api.post<ApiResponse<Tag[]>>('/api/tag/makeNewTag', data)
};

// Comment API (실제 백엔드 API 사용)
export const CommentAPI = {
  // 댓글 목록 조회
  getComments: (articleId: number) => 
    api.get<Comment[]>(`/api/comment/${articleId}`),

  // 댓글 생성
  createComment: (data: CreateCommentRequest) => 
    api.post<ApiResponse<Comment>>('/api/comment/create', data)
};

// 통합 커뮤니티 API (기존 코드와의 호환성을 위해)
export const CommunityAPI = {
  getArticles: ArticleAPI.getArticles,
  getTags: TagAPI.getTags,
  createTag: TagAPI.createTag,
  getArticle: ArticleAPI.getArticle,
  createArticle: ArticleAPI.createArticle,
  updateArticle: ArticleAPI.updateArticle,
  deleteArticle: ArticleAPI.deleteArticle,
  likeArticle: ArticleAPI.likeArticle,
  insertComment: ArticleAPI.insertComment,
  deleteComment: ArticleAPI.deleteComment,
  getComments: CommentAPI.getComments,
  createComment: CommentAPI.createComment,
};
