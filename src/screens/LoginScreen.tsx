import React, { useState } from 'react';
import { View, Button, ActivityIndicator, Alert } from 'react-native';
// import { CommonActions } from '@react-navigation/native'; // ❌ 필요 없음
import { loginWith } from '@/services/authClient';
// (주의) loginWithPassword / 소셜 콜백 내부에서 saveTokens(...)를 호출하도록 이미 구현됨

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    try {
      setLoading(true);
      await loginWith('GOOGLE');
      // ✅ 토큰 저장 시 Redux 동기화 → RootNavigator가 자동으로 전환
    } catch (e: any) {
      console.error(e);
      Alert.alert('로그인 실패', e.message ?? '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Button title="SIGN IN WITH GOOGLE" onPress={onGoogle} disabled={loading} />
      {loading && <ActivityIndicator />}
    </View>
  );
}
