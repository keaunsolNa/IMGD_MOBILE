import * as SecureStore from 'expo-secure-store';

const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';

export async function saveTokens(tokens: { accessToken: string; refreshToken: string }) {
    await SecureStore.setItemAsync(ACCESS, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH, tokens.refreshToken);
}

export async function getAccessToken() { return SecureStore.getItemAsync(ACCESS); }
export async function getRefreshToken() { return SecureStore.getItemAsync(REFRESH); }
export async function clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
}