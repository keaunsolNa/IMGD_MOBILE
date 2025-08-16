import axios from 'axios';
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './storage';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL as string;

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let queue: Array<(token?: string) => void> = [];

function onRrefreshed(token?: string) { queue.forEach(cb => cb(token)); queue = []; }

api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error?.response?.status === 401 && !original._retry) {
            original._retry = true;
            if (isRefreshing) {
                return new Promise((resolve) => {
                    queue.push((token) => {
                        if (token) original.headers.Authorization = `Bearer ${token}`;
                        resolve(api(original));
                    });
                });
            }
            isRefreshing = true;
            try {
                const refreshToken = await getRefreshToken();
                const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
                await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? refreshToken });
                isRefreshing = false; onRrefreshed(data.accessToken);
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(original);
            } catch (e) {
                isRefreshing = false; onRrefreshed(); await clearTokens();
                return Promise.reject(e);
            }
        }
        return Promise.reject(error);
    }
);

export const HealthAPI = {
    ping: () => api.get('/actuator/health') // 서버에 맞는 간단 GET 엔드포인트로 변경 가능
};

// Convenience wrappers for domain APIs used in your project
export const GroupAPI = {
    addGroupUser: (dto: any, userId: string) => api.post(`/group/addGroupUser`, dto, { params: { userId } }),
    makeGroupDir: (payload: { groupId: number; groupNm: string; groupMstUserId: string }) => api.post(`/file/makeGroupDir`, payload)
};

export const FileAPI = {
    makeFile: (payload: { folderId: number|string; userId: string; fileName: string; originalFile: string; }) =>
        api.post(`/file/makeFile`, payload),
    uploadBinary: async (uri: string, token?: string) => {
        const form = new FormData();
        // NOTE: Adjust field name to match Spring controller (e.g., @RequestPart("file"))
        form.append('file', {
            uri,
            type: 'image/jpeg',
            name: 'upload.jpg'
        } as any);
        return fetch(`${API_BASE_URL}/file/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form
        }).then(r => r.json());
    }
};