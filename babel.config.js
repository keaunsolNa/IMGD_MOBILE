export default function (api) {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            // Reanimated 플러그인 제거 - worklets 오류 방지
        ]
    };
};