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
        output: 'static',
        // COOP 관련 설정 추가
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
        }
    },
    // OAuth 관련 설정
    plugins: [
        [
            'expo-auth-session',
            {
                // COOP 정책 우회를 위한 설정
                useProxy: true
            }
        ]
    ]
};

export default config;