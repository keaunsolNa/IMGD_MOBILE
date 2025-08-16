export default function (api) {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            // Reanimated 사용 시 마지막에 유지
            "react-native-worklets/plugin"
        ]
    };
};