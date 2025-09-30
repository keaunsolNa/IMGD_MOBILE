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
  attachedFiles?: Array<{
    fileName: string;
    fileId: number;
    fileSize: number;
  }>;
}

// API들은 이제 api.ts에서 import
export { ArticleAPI, TagAPI, CommentAPI, CommunityAPI } from './api';