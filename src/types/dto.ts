// Mirror your Spring DTOs here for type safety
export type GroupTableDTO = {
  groupId?: number;
  groupNm: string;
  groupMstUserId: string;
  regDtm?: string | null;
  regId?: string | null;
  modDtm?: string | null;
  modId?: string | null;
};

export type UserTableDTO = {
  userId: string;
  name: string;
  email: string;
  nickName: string;
  loginType: string;
  lastLoginDate: string;
  regDtm: string;
  pictureNm?: string | null;
  pictureId?: number | null;
  relationship?: string | null;
};

export type MakeFileDTO = {
  folderId: number;
  userId: string;
  groupId: number;
  fileName: string;
  originalFile: any;
};

// 커뮤니티 관련 DTO
export type ArticleDTO = {
  id?: number;
  title: string;
  content: string;
  author: string;
  authorId: string;
  createdAt?: string;
  updatedAt?: string;
  tags: string[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
};

export type CreateArticleDTO = {
  title: string;
  content: string;
  tags: string[];
};

export type UpdateArticleDTO = {
  title?: string;
  content?: string;
  tags?: string[];
};

export type TagDTO = {
  id?: number;
  name: string;
  color: string;
  articleCount?: number;
};

export type CreateTagDTO = {
  name: string;
  color: string;
};

export type CommentDTO = {
  id?: number;
  content: string;
  author: string;
  authorId: string;
  createdAt?: string;
  articleId: number;
};

export type CreateCommentDTO = {
  content: string;
  articleId: number;
};