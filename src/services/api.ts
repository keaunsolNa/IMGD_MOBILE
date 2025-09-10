// src/services/api.ts
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getRefreshToken, saveTokens, clearTokens } from './storage';
import { store } from '@/redux/store';
import { setAuth } from '@/redux/authSlice';

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
  
  // 기존 구조를 유지하는 API들 (ApiResponse를 사용하지 않음)
  findGroupName: (userId: string) => api.get(`/api/group/findGroupName`, { params: { userId } }),
  findGroupWhatInside: (userId: string) => api.get(`/api/group/findGroupWhatInside`, { params: { userId } }),
  findGroupUserWhatInside: (groupId: number) => api.get(`/api/group/findGroupUserWhatInside`, { params: { groupId } }),
};

export const UserAPI = {
  findUserByToken: () => api.get(`/api/user/findUserByToken`),
  findUserById: (userId: string) => api.get(`/api/user/findUserById`, { params: { userId } }),
  updateUser: (userData: { userId: string; nickName: string }) => api.post(`/api/user/updateUser`, userData),
  findFriendEachOther: (userId: string) => api.get(`/api/user/findFriendEachOther`, { params: { userId } }),
  insertUserFriendTable: (userId: string, targetUserId: string, relationship: string = 'F') => api.post(`/api/user/insertUserFriendTable?userId=${userId}&targetUserId=${targetUserId}&relationship=${relationship}`),
  deleteUserFriendTable: (userId: string, targetUserId: string) => api.delete(`/api/user/deleteUserFriendTable`, { params: { userId, targetUserId } }),
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

      const response = await fetch(`${API_BASE_URL}/api/file/makeUserProfileImg`, {
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw error;
    }
  }
};

export const FileAPI = {
  makeGroupDir: (dto: { groupId: number; groupNm: string; groupMstUserId?: string }) => api.post(`/api/file/makeGroupDir`, dto),
  findFileAndDirectory: (parentId: number, groupId: number) => api.get(`/api/file/findFileAndDirectory`, { params: { parentId, groupId } }),
  makeDir: (dto: { userId: string; parentId: number; dirNm: string; groupId: number; path: string }) => api.post(`/api/file/makeDir`, dto),

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

    return fetch(`${API_BASE_URL}/api/file/makeFile`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form
    }).then(r => r.json());
  },

  // 파일 ID로 파일 정보 조회
  findFileById: (fileId: number) => api.get(`/api/file/findFileById`, { params: { fileId } }),

  // 파일 삭제
  deleteFile: (fileId: number) => api.delete(`/api/file/deleteFile`, { params: { fileId } }),

  // 폴더 삭제
  deleteDir: (fileId: number) => api.delete(`/api/file/deleteDir`, { params: { fileId } }),
};