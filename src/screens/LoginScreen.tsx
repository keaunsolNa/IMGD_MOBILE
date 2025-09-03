import React, { useState } from 'react';
import { View, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { loginWith } from '@/services/authClient';
import { styles } from '@/styles/screens/login/LoginScreen';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    try {
      setLoading(true);
      await loginWith('GOOGLE');
      // ✅ 토큰 저장 시 Redux 동기화 → RootNavigator가 자동으로 전환
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message ?? '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.googleButton, loading && styles.googleButtonDisabled]} 
          onPress={onGoogle} 
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>
            {loading ? '로그인 중...' : 'SIGN IN WITH GOOGLE'}
          </Text>
        </TouchableOpacity>
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}
