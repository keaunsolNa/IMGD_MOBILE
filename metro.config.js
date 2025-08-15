// Expo 51+ 기본 Metro 설정
const { getDefaultConfig } = require("@expo/metro-config");

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(__dirname);

// 필요 시 SVG, extra asset 확장자 등을 여기서 확장 가능
// 예) SVG를 react-native-svg-transformer로 처리하려면 transformer/sourceExts 수정
// const { resolver } = config;
// resolver.assetExts = resolver.assetExts.filter((ext) => ext !== "svg");
// resolver.sourceExts.push("svg");

module.exports = config;