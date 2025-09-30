// src/services/api.ts
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getRefreshToken, saveTokens, clearTokens } from './storage';
import { store } from '@/redux/store';
import { setAuth } from '@/redux/authSlice';
import { ArticleSearch } from '@/types/dto';

function resolveApiBaseUrl(): string {
  console.log('resolveApiBaseUrl');
  
  const fromExtra = Constants.expoConfig?.extra?.API_BASE_URL as string | undefined;
  console.log('fromExtra', fromExtra);
  console.log('Constants.expoConfig?.extra 전체:', Constants.expoConfig?.extra);
  console.log('process.env.API_BASE_URL:', process.env.API_BASE_URL);

  // 웹 환경에서는 강제로 Nginx 포트 사용 (최우선)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    console.log('웹 환경: http://localhost 강제 사용');
    return 'http://localhost';
  }
  
  
  if (fromExtra && /^https?:\/\//i.test(fromExtra)) {
    console.log('extra 값 사용:', fromExtra);
    return stripTrailingSlash(fromExtra);
  }

  if (Platform.OS === 'android') return 'http://192.168.35.252:80';
  return 'http://localhost:80';
}

function stripTrailingSlash(s: string) {
  return s.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

export const getProfileImageUrl = (pictureUrl: string | null | undefined): any => {
  if (!pictureUrl) {
    return { uri: `${API_BASE_URL}/images/default/user_profile_default.png` };
  }
  
  const filename = pictureUrl.split('/').pop() || pictureUrl;
  const filenameWithExtension = filename.includes('.') ? filename : `${filename}.webp`;
  
  return { uri: `${API_BASE_URL}/images/profile/${filenameWithExtension}` };
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let queue: Array<(token?: string) => void> = [];

function onRefreshed(token?: string) { queue.forEach(cb => cb(token)); queue = []; }

api.interceptors.request.use(async (config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    // 타입 경고 회피
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config ?? {};
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            if (token) (original.headers ||= {})['Authorization'] = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      isRefreshing = true;
      try {
        const refreshToken = await getRefreshToken();
        const { data } = await api.post(
          `/auth/getAccessToken`,
          { refreshToken }
        );
        await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? refreshToken });
        isRefreshing = false; onRefreshed(data.accessToken);
        (original.headers ||= {})['Authorization'] = `Bearer ${data.accessToken}`;
        store.dispatch(setAuth({ accessToken: data.accessToken }));
        return api(original);
      } catch (e) {
        isRefreshing = false; onRefreshed(); await clearTokens();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

// --- 간단 헬스 체크 API
export const HealthAPI = {
  ping: () => api.get('/actuator/health')
};

// --- 도메인 API
export const GroupAPI = {
  // ApiResponse 구조를 반환하는 API들
  createGroup: (payload: { groupNm: string }) => api.post(`/api/group/createGroup`, payload),
  addGroupUser: (dto: any, userId: string) => api.post(`/api/group/makeNewGroupUser`, dto, { params: { userId } }),
  deleteGroupUser: (dto: any, userId: string) => api.delete(`/api/group/deleteGroupUser`, { data: dto, params: { userId } }),
  changeMstUserGroup: (dto: any, userId: string) => api.post(`/api/group/changeMstUserGroup`, dto, { params: { userId } }),
  deleteGroup: (groupId: number) => api.delete(`/api/group/deleteGroup`, { params: { groupId } }),
  
  // 기존 구조를 유지하는 API들 (ApiResponse를 사용하지 않음)
  findGroupName: (userId: string) => api.get(`/api/group/findGroupName`, { params: { userId } }),
  findGroupWhatInside: (userId: string) => api.get(`/api/group/findGroupWhatInside`, { params: { userId } }),
  findGroupUserWhatInside: (groupId: number) => api.get(`/api/group/findGroupUserWhatInside`, { params: { groupId } }),
};

export const UserAPI = {
  findUserByToken: () => api.get(`/api/user/findUserByToken`),
  findUserById: (userId: string) => api.get(`/api/user/findUserById`, { params: { userId } }),
  updateUser: (userData: { userId: string; nickName: string }) => api.post(`/api/user/updateUser`, userData),
  deleteUser: (userId: string) => api.delete(`/api/user/deleteUser`, { params: { userId } }),
  findFriendEachOther: (userId: string) => api.get(`/api/user/findFriendEachOther`, { params: { userId } }),
  insertUserFriendTable: (userId: string, targetUserId: string, relationship: string = 'F') => api.post(`/api/userFriend/insertUserFriendTable?userId=${userId}&targetUserId=${targetUserId}&relationship=${relationship}`),
  deleteUserFriendTable: (userId: string, targetUserId: string) => api.delete(`/api/userFriend/deleteUserFriendTable`, { params: { userId, targetUserId } }),
  findFriendWhoAddMeButImNot: (userId: string) => api.get(`/api/user/findFriendWhoAddMeButImNot`, { params: { userId } }),
  findFriendWhoImAddButNot: (userId: string) => api.get(`/api/user/findFriendWhoImAddButNot`, { params: { userId } }),
  findFriendWhoImAddButReject: (userId: string) => api.get(`/api/user/findFriendWhoImAddButReject`, { params: { userId } }),
  findFriend: (userId: string) => api.get(`/api/user/findFriend`, { params: { userId } }),
  searchFriend: (userId: string) => api.get(`/api/user/searchFriend`, { params: { userId } }),
  findFriendEachOtherAndNotInGroup: (userId: string, groupId: number) => api.get(`/api/user/findFriendEachOtherAndNotInGroup`, { params: { userId, groupId } }),
  uploadProfileImage: async (
    imageAsset: any,
    userId: string,
    token?: string
  ) => {
    
    try {
      let fileUri;
      let tempFileUri: string | null = null;
      
      // 웹 환경에서는 FileSystem을 사용하지 않고 직접 이미지 URI 사용
      if (Platform.OS === 'web') {
        // 웹에서 이미지 URI가 data: 형식인 경우 처리
        if (imageAsset.uri.startsWith('data:')) {
          fileUri = imageAsset.uri;
        } else {
          fileUri = imageAsset.uri;
        }
      } else {
        // 네이티브 환경에서는 FileSystem 사용
        tempFileUri = `${FileSystem.documentDirectory}temp_profile_${Date.now()}.jpg`;
        
        await FileSystem.copyAsync({
          from: imageAsset.uri,
          to: tempFileUri
        });
        fileUri = tempFileUri;
      }

      const form = new FormData();
      form.append('folderId', '1'); // 프로필 이미지용 기본 폴더 ID
      form.append('userId', userId);
      form.append('groupId', '1'); // 프로필 이미지용 기본 그룹 ID
      form.append('fileName', 'profile.jpg');
      
      // 파일 추가
      if (Platform.OS === 'web') {
        // 웹에서는 Blob으로 변환
        try {
          const response = await fetch(fileUri);
          const blob = await response.blob();
          form.append('originalFile', blob, 'profile.jpg');
        } catch (blobError) {
          // Blob 변환 실패 시 원본 URI 사용
          form.append('originalFile', {
            uri: fileUri,
            type: 'image/jpeg',
            name: 'profile.jpg'
          } as any);
        }
      } else {
        // 네이티브에서는 파일 경로 사용
        form.append('originalFile', {
          uri: fileUri,
          type: 'image/jpeg',
          name: 'profile.jpg'
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/api/file/profileImg`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form
      });

      // 네이티브 환경에서만 임시 파일 삭제
      if (Platform.OS !== 'web' && tempFileUri) {
        try {
          await FileSystem.deleteAsync(tempFileUri);
        } catch (deleteError) {
          // 임시 파일 삭제 실패
        }
      }

      // 응답 처리 개선 - 백엔드에서 DTO를 직접 반환하는 경우
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const responseData = await response.json();
          
          // 백엔드에서 DTO를 직접 반환하는 경우 (userId, groupId, fileId 등이 있는 경우)
          if (responseData && (responseData.userId || responseData.groupId || responseData.fileId || responseData.success === true)) {
            return responseData;
          } else if (responseData && responseData.success === false) {
            // 실패 응답인 경우
            return responseData;
          } else {
            // 기존 ResponseEntity 형태인 경우
            return { success: true, message: '프로필 이미지 업로드 성공' };
          }
        } else {
          // 빈 응답인 경우 성공으로 처리
          return { success: true, message: '프로필 이미지 업로드 성공' };
        }
      } else {
        return { success: false, error: `프로필 이미지 업로드 실패: HTTP ${response.status} - ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '프로필 이미지 업로드 중 오류가 발생했습니다.' };
    }
  }
};

export const FileAPI = {
  makeGroupDir: (dto: { groupId: number; groupNm: string; groupMstUserId?: string }) => api.post(`/api/file/groupDir`, dto),
  findFileAndDirectory: (parentId: number, groupId: number) => api.get(`/api/file/${parentId}/${groupId}`),
  makeDir: (dto: { userId: string; parentId: number; dirNm: string; groupId: number; path: string }) => api.post(`/api/file/dir`, dto),

  // 파일 업로드: multipart/form-data로 /api/file/makeFile 호출
  makeFile: async (
    uri: string,
    params: { folderId: number|string; userId: string; groupId: number|string; fileName?: string },
    token?: string
  ) => {
    const form = new FormData();
    form.append('folderId', String(params.folderId));
    form.append('userId', params.userId);
    form.append('groupId', String(params.groupId));
    const fileName = params.fileName ?? 'upload.jpg';
    form.append('fileName', fileName);
    
    // 웹과 네이티브 환경에 따라 파일 처리 방식 다름
    if (Platform.OS === 'web') {
      // 웹에서는 Blob으로 변환
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        form.append('originalFile', blob, fileName);
      } catch (blobError) {
        // Blob 변환 실패 시 원본 URI 사용
        form.append('originalFile', {
          uri,
          type: 'image/jpeg',
          name: fileName
        } as any);
      }
    } else {
      // 네이티브에서는 파일 경로 사용
      form.append('originalFile', {
        uri,
        type: 'image/jpeg',
        name: fileName
      } as any);
    }

    return fetch(`${API_BASE_URL}/api/file`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form
    }).then(r => r.json());
  },

  // 파일 ID로 파일 정보 조회
  findFileById: (fileId: number) => api.get(`/api/file/${fileId}`),

  // 파일 다운로드
  downloadFile: async (file: { fileId?: number; fileOrgNm?: string }) => {
    // 웹 환경에서만 다운로드 기능 제공
    if (Platform.OS !== 'web') {
      throw new Error('다운로드 기능은 웹 환경에서만 사용할 수 있습니다.');
    }

    if (!file.fileId) {
      throw new Error('파일 ID가 없습니다.');
    }

    try {

      // Redux store에서 토큰 가져오기
      const state = store.getState();
      const token = state.auth.accessToken;
      
      const headers: HeadersInit = {
        'Accept': '*/*',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/file/file?fileId=${file.fileId}`, {
        method: 'GET',
        headers: headers,
        credentials: 'include', // 쿠키 포함
      });
      
      if (!response.ok) {
        return { success: false, error: `파일 다운로드 실패: HTTP ${response.status} - ${response.statusText}` };
      }
      
      const blob = await response.blob();
      
      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileOrgNm || `file_${file.fileId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      return { success: false, error: error instanceof Error ? error.message : '파일 다운로드 중 오류가 발생했습니다.' };
    }
  },

  // 파일 삭제
  deleteFile: (fileId: number) => api.delete(`/api/file/file`, { params: { fileId } }),

  // 폴더 삭제
  deleteDir: (fileId: number) => api.delete(`/api/file/dir`, { params: { fileId } }),
};

// Community API (community.ts에서 이동)
export const ArticleAPI = {
  // 모든 게시글 조회
  getArticles: (search?: ArticleSearch) => {
    const params = new URLSearchParams();
    if (search?.title) params.append('title', search.title);
    if (search?.article) params.append('article', search.article);
    if (search?.userNm) params.append('userNm', search.userNm);
    
    const queryString = params.toString();
    const url = queryString ? `/api/article/condition?${queryString}` : '/api/article/condition';
    
    return api.get(url);
  },

  // 게시글 상세 조회
  getArticle: (id: number) => 
    api.get(`/api/article/${id}`),

  // 게시글 생성
  createArticle: (data: any) => 
    api.post('/api/article', data),

  // 게시글 수정
  updateArticle: (id: number, data: any) => 
    api.put(`/api/article/${id}`, data),

  // 댓글 삭제
  deleteArticle: (id: number) => 
    api.delete(`/api/article/comment/${id}`),

  // 게시글 좋아요
  likeArticle: (articleId: number) => 
    api.put('/api/article/comment', articleId),

  // 댓글 추가
  insertComment: (articleId: number, commentData: any) => 
    api.post(`/api/article/comment?articleId=${articleId}`, commentData),

  // 댓글 삭제
  deleteComment: (articleId: number, commentId: number) => 
    api.delete(`/api/article/comment?articleId=${articleId}&commentId=${commentId}`),
};

export const TagAPI = {
  // 모든 태그 조회
  getTags: () => {
    return api.get('/api/tag/findAllTag');
  },

  // 신규 태그 생성
  createTag: (data: { name: string; description?: string; color: string }) => 
    api.post('/api/tag/makeNewTag', data)
};

export const CommentAPI = {
  // 댓글 목록 조회
  getComments: (articleId: number) => 
    api.get(`/api/comment/${articleId}`),

  // 댓글 생성
  createComment: (data: { content: string; articleId: number }) => 
    api.post('/api/comment/create', data)
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