// storage.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { store } from '@/redux/store';
import { setAuth, clearAuth } from '@/redux/authSlice';

const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';

async function setItem(key: string, val: string) {
    if (Platform.OS === 'web') localStorage.setItem(key, val);
    else await SecureStore.setItemAsync(key, val);
}
async function getItem(key: string) {
    return Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key);
}
async function delItem(key: string) {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(tokens: { accessToken?: string; refreshToken?: string }) {
  if (tokens.accessToken) {
    await setItem(ACCESS, tokens.accessToken);
    store.dispatch(setAuth({ accessToken: tokens.accessToken }));
  }
  if (tokens.refreshToken) await setItem(REFRESH, tokens.refreshToken);
}

export async function setAccessToken(token: string) {
  await setItem(ACCESS, token);
  store.dispatch(setAuth({ accessToken: token }));
}
export async function getAccessToken() { return getItem(ACCESS); }
export async function getRefreshToken() { return getItem(REFRESH); }
export async function clearTokens() {
  await delItem(ACCESS);
  await delItem(REFRESH);
  store.dispatch(clearAuth());
}