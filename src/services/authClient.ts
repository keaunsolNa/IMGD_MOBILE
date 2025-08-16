// src/services/authClient.ts
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { api } from './api';
import { setAccessToken } from './storage';

WebBrowser.maybeCompleteAuthSession();

export type Provider = 'GOOGLE' | 'NAVER' | 'KAKAO';

export async function loginWith(provider: Provider) {
    // 1) 백엔드에서 인가 URL 수신
    const { data } = await api.get<{ redirect_url: string }>(`/auth/${provider}`);
    const authUrl = data.redirect_url;

    // 2) 리다이렉트 URI (버전 호환: 옵션 없이 or 간단 옵션만)
    const returnUrl =
        Platform.OS === 'web'
            ? window.location.origin // 예: http://localhost:8081
            : AuthSession.makeRedirectUri(); // app.json의 scheme 사용

    // 3) 브라우저/탭 열어서 로그인 진행
    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
    if (result.type !== 'success' || !result.url) {
        throw new Error(
            result.type === 'cancel' || result.type === 'dismiss'
                ? '사용자가 취소했습니다.'
                : '인가 실패'
        );
    }

    // 4) redirect된 URL에서 code 추출
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (!code) throw new Error('인가 코드가 없습니다.');

    // 5) 백엔드 콜백으로 code 전달
    const cb = await api.post<{ redirectUrl: string; accessToken?: string }>(
        `/auth/login/${provider}/callback`,
        { authorizationCode: code }
    );

    // 6) accessToken 저장 (refresh는 쿠키로 수신)
    if (cb.data?.accessToken) await setAccessToken(cb.data.accessToken);

    return cb.data; // { redirectUrl, accessToken? }
}
