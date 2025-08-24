// src/services/authClient.ts
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { api } from './api';
import { setAccessToken } from './storage';

// COOP 관련 문제 해결을 위한 설정
WebBrowser.maybeCompleteAuthSession();

export type Provider = 'GOOGLE' | 'NAVER' | 'KAKAO';

// 절대 URL 보장 (웹은 http/https)
const toAbsolute = (raw: string) => {
  const base =
    (api?.defaults?.baseURL as string | undefined) ||
    (Platform.OS === 'web' ? window.location.origin : undefined);
  if (!raw) throw new Error('백엔드 응답에 redirectUrl이 없습니다.');
  try {
    return new URL(raw, base).toString();
  } catch {
    throw new Error(`유효하지 않은 URL: ${raw}`);
  }
};

const makeReturnUrl = () => {
  if (Platform.OS === 'web') {
    // 콘솔과 백엔드 화이트리스트에 등록 필요
    return new URL('/auth-callback', window.location.origin).toString();
  }
  // app.json에 "scheme": "imgd" 있어야 함
  return AuthSession.makeRedirectUri({ scheme: 'imgd', preferLocalhost: true });
};

export async function loginWith(provider: Provider) {
  try {
    // 1) 백엔드에서 인가 URL 수신 (camel/snake 둘 다 대응)
    const { data } = await api.get<{ redirectUrl?: string; redirect_url?: string }>(
      `/auth/${provider}`
    );
    const rawAuth = data.redirectUrl ?? data.redirect_url; // ✅ 핵심 수정
    let authUrl = toAbsolute(rawAuth!);

    // 2) 반환(redirect) URI 생성
    const returnUrl = makeReturnUrl();

    // 3) 인가 URL에 redirect_uri 없으면 주입
    const u = new URL(authUrl);

    // 🔧 웹은 프론트 기준으로 항상 강제 세팅(포트/경로가 정확히 일치해야 함)
    if (Platform.OS === 'web') {
      u.searchParams.set('redirect_uri', returnUrl);
    } else {
      // 네이티브는 없으면 넣고, 있으면 서버 설정 유지(환경 따라 선택)
      if (!u.searchParams.has('redirect_uri')) {
        u.searchParams.set('redirect_uri', returnUrl);
      }
    }

    authUrl = u.toString();

    // 4) 실제 브라우저 탭 열기 (COOP 문제 해결을 위한 옵션 추가)
    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl, {
      // COOP 정책 우회를 위한 설정
      showInRecents: true,
      createTask: false,
      // 웹 환경에서 팝업 차단 방지
      ...(Platform.OS === 'web' && {
        windowFeatures: 'width=500,height=600,scrollbars=yes,resizable=yes'
      })
    });

    if (result.type !== 'success' || !result.url) {
      throw new Error(
        result.type === 'cancel' || result.type === 'dismiss'
          ? '사용자가 취소했습니다.'
          : '인가 실패'
      );
    }

    // 5) code 추출
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (!code) throw new Error('인가 코드가 없습니다.');

    // 6) 백엔드로 교환 요청 (필요 시 redirectUri도 함께 전달)
    const cb = await api.post<{ redirectUrl: string; accessToken?: string }>(
      `/auth/login/GOOGLE/callback`,
      { authorizationCode: code, redirectUri: returnUrl }   // ← 반드시 포함
    );

    if (cb.data?.accessToken) await setAccessToken(cb.data.accessToken);
    return cb.data;
  } catch (error) {
    console.error('OAuth 로그인 에러:', error);
    // COOP 관련 에러인 경우 사용자에게 친화적인 메시지 표시
    if (error instanceof Error && error.message.includes('Cross-Origin-Opener-Policy')) {
      throw new Error('보안 정책으로 인해 로그인 창이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.');
    }
    throw error;
  }
}
