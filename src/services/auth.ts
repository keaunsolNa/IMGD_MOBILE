import { api } from './api';
import { saveTokens, clearTokens } from './storage';

export type LoginReq = { username: string; password: string };

export async function loginWithPassword(body: LoginReq) {
    const { data } = await api.post('/auth/login', body);
    await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data;
}

export async function logout() {
    try { await api.post('/auth/logout'); } catch {}
    await clearTokens();
}