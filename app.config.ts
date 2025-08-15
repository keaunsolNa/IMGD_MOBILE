import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
    name: 'imgd-mobile',
    slug: 'imgd-mobile',
    scheme: 'imgd', // deep link: imgd://
    extra: {
        API_BASE_URL: process.env.API_BASE_URL,
        AUTH_REDIRECT_SCHEME: 'imgd'
    }
};

export default config;