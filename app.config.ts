import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
    name: 'imgd-mobile',
    slug: 'imgd-mobile',
    scheme: 'imgd', // deep link: imgd://
    extra: {
        API_BASE_URL: process.env.API_BASE_URL,
        AUTH_REDIRECT_SCHEME: 'imgd'
    },
    web: {
        bundler: 'metro',
        // COOP 관련 설정 추가
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
        }
    },
    // OAuth 관련 설정 - expo-auth-session은 더 이상 플러그인이 아님
    plugins: []
};

export default config;