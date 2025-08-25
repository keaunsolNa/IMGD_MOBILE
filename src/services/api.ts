// src/services/api.ts
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getRefreshToken, saveTokens, clearTokens } from './storage';
import { store } from '@/redux/store';
import { setAuth } from '@/redux/authSlice';

// --- 1) 백엔드 baseURL 확정 (Nginx를 통한 접근) -------------------------
function resolveApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.API_BASE_URL as string | undefined;
  if (fromExtra && /^https?:\/\//i.test(fromExtra)) {
    return stripTrailingSlash(fromExtra);
  }

  // 개발 편의: 웹에서 extra가 없으면 현재 오리진 기준으로 Nginx 포트로 매핑
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const u = new URL(window.location.origin);
    // 프론트(예: 8081/19006) -> Nginx 포트로 치환
    u.protocol = 'http:';          // 개발 서버 가정
    u.port = '80';                 // ✅ Nginx 포트 (기본 80)
    return stripTrailingSlash(u.toString());
  }

  // 네이티브(에뮬레이터/실기기) 기본값 - Nginx를 통한 접근
  // Android 에뮬레이터: 10.0.2.2, iOS 시뮬레이터: localhost
  if (Platform.OS === 'android') return 'http://10.0.2.2:80';
  return 'http://localhost:80';
}

function stripTrailingSlash(s: string) {
  return s.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

// --- 프로필 이미지 URL 생성 함수 (Nginx 정적 파일 서빙용) ----------------
export const getProfileImageUrl = (pictureUrl: string | null | undefined): any => {
  if (!pictureUrl) {
    return { uri: `${API_BASE_URL}/images/default/user_profile_default.png` };
  }
  
  // 백엔드에서 반환하는 파일명만 추출 (경로 제거)
  const filename = pictureUrl.split('/').pop() || pictureUrl;
  
  // 파일명에 확장자가 없으면 .webp 추가
  const filenameWithExtension = filename.includes('.') ? filename : `${filename}.webp`;
  
  return { uri: `${API_BASE_URL}/images/profile/${filenameWithExtension}` };
};

// -------------------------------------------------------------------

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
// NOTE: onRefreshed로 오타 정정
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
        // 공유 인스턴스(api)를 사용해 Authorization 헤더를 포함시킴
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
  createGroup: (payload: { groupNm: string }) => api.post(`/api/group/createGroup`, payload),
  addGroupUser: (dto: any, userId: string) => api.post(`/api/group/makeNewGroupUser`, dto, { params: { userId } }),
  findGroupName: (userId: string) => api.get(`/api/group/findGroupName`, { params: { userId } }),
  findGroupWhatInside: (userId: string) => api.get(`/api/group/findGroupWhatInside`, { params: { userId } }),
  findGroupUserWhatInside: (groupId: number) => api.get(`/api/group/findGroupUserWhatInside`, { params: { groupId } }),
};

export const UserAPI = {
  findUserByToken: () => api.get(`/api/user/findUserByToken`),
  findUserById: (userId: string) => api.get(`/api/user/findUserById`, { params: { userId } }),
  updateUser: (userData: { userId: string; nickName: string }) => api.post(`/api/user/updateUser`, userData),
  uploadProfileImage: async (
    imageAsset: any,
    userId: string,
    token?: string
  ) => {
    console.log('uploadProfileImage 함수 호출됨');
    console.log('imageAsset:', imageAsset);
    console.log('userId:', userId);
    console.log('token:', token ? '있음' : '없음');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Platform:', Platform.OS);
    
    try {
      let fileUri;
      
      // 웹 환경에서는 FileSystem을 사용하지 않고 직접 이미지 URI 사용
      if (Platform.OS === 'web') {
        console.log('웹 환경: FileSystem 사용하지 않음');
        
        // 웹에서 이미지 URI가 data: 형식인 경우 처리
        if (imageAsset.uri.startsWith('data:')) {
          console.log('data: URI 형식의 이미지 처리');
          fileUri = imageAsset.uri;
        } else {
          console.log('일반 URI 형식의 이미지 처리');
          fileUri = imageAsset.uri;
        }
      } else {
        // 네이티브 환경에서는 FileSystem 사용
        console.log('네이티브 환경: FileSystem 사용');
        const tempFileUri = `${FileSystem.documentDirectory}temp_profile_${Date.now()}.jpg`;
        console.log('임시 파일 경로:', tempFileUri);
        
        await FileSystem.copyAsync({
          from: imageAsset.uri,
          to: tempFileUri
        });
        console.log('임시 파일 생성 완료');
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
          console.error('Blob 변환 실패:', blobError);
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

      console.log('FormData 생성 완료, fetch 요청 시작');
      console.log('요청 URL:', `${API_BASE_URL}/api/file/makeUserProfileImg`);
      
      const response = await fetch(`${API_BASE_URL}/api/file/makeUserProfileImg`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form
      });

      console.log('fetch 응답 상태:', response.status);
      console.log('fetch 응답 헤더:', response.headers);

      // 네이티브 환경에서만 임시 파일 삭제
      if (Platform.OS !== 'web') {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        console.log('임시 파일 삭제 완료');
      }

      // 응답 처리 개선
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        } else {
          // 빈 응답인 경우 성공으로 처리
          console.log('빈 응답 수신, 성공으로 처리');
          return { success: true, message: '프로필 이미지 업로드 성공' };
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 중 오류:', error);
      throw error;
    }
  }
};

export const FileAPI = {
  makeGroupDir: (dto: { groupId: number; groupNm: string; groupMstUserId?: string }) => api.post(`/api/file/makeGroupDir`, dto),

  // 파일 생성: multipart/form-data로 /api/file/makeFile 호출
  uploadBinary: async (
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
    form.append('originalFile', {
      uri,
      type: 'image/jpeg',
      name: fileName
    } as any);

    return fetch(`${API_BASE_URL}/api/file/makeFile`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form
    }).then(r => r.json());
  }
};