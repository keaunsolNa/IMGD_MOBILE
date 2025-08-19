// src/services/api.ts
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './storage';

// --- 1) 백엔드 baseURL 확정 (항상 절대 URL) -------------------------
function resolveApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.API_BASE_URL as string | undefined;
  if (fromExtra && /^https?:\/\//i.test(fromExtra)) {
    return stripTrailingSlash(fromExtra);
  }

  // 개발 편의: 웹에서 extra가 없으면 현재 오리진 기준으로 백엔드 포트로 매핑
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const u = new URL(window.location.origin);
    // 프론트(예: 8081/19006) -> 백엔드 포트로 치환
    u.protocol = 'http:';          // 개발 서버 가정
    u.port = '8080';              // ✅ 실제 백엔드 포트로 바꾸세요
    return stripTrailingSlash(u.toString());
  }

  // 네이티브(에뮬레이터/실기기) 기본값 (원하는 값으로 교체)
  // Android 에뮬레이터: 10.0.2.2, iOS 시뮬레이터: localhost
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080';
  return 'http://localhost:8080';
}

function stripTrailingSlash(s: string) {
  return s.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

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
  const token = await getAccessToken();
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
        // refresh는 절대 URL로 호출해도 OK. (혹은 api.post 사용해도 무방)
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/getAccessToken`,
          { refreshToken },
          { withCredentials: true }
        );
        await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? refreshToken });
        isRefreshing = false; onRefreshed(data.accessToken);
        (original.headers ||= {})['Authorization'] = `Bearer ${data.accessToken}`;
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
  addGroupUser: (dto: any, userId: string) => api.post(`/group/addGroupUser`, dto, { params: { userId } }),
  makeGroupDir: (payload: { groupId: number; groupNm: string; groupMstUserId: string }) => api.post(`/file/makeGroupDir`, payload)
};

export const FileAPI = {
  makeFile: (payload: { folderId: number|string; userId: string; fileName: string; originalFile: string; }) =>
    api.post(`/file/makeFile`, payload),

  // 2) 업로드는 credentials 포함 + Content-Type 자동(=설정하지 않음)
  uploadBinary: async (uri: string, token?: string) => {
    const form = new FormData();
    // 서버 컨트롤러의 필드명에 맞춰 조정(@RequestPart("file")면 'file')
    form.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'upload.jpg'
    } as any);

    return fetch(`${API_BASE_URL}/file/upload`, {
      method: 'POST',
      credentials: 'include', // ✅ 쿠키 사용 시 필수
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form
      // ⚠️ Content-Type 수동 지정하지 말 것(FormData가 boundary 포함 자동 설정)
    }).then(r => r.json());
  }
};
