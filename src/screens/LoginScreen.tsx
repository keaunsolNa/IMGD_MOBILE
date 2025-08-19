// LoginScreen.tsx
import React, { useState } from 'react';
import { View, Button, ActivityIndicator, Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';

export default function LoginScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);

    const onGoogle = async () => {
        try {
            setLoading(true);
            // 토큰을 header에 실어둘 거라면:
            // if (r?.accessToken) api.defaults.headers.common.Authorization = `Bearer ${r.accessToken}`;
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main', params: { screen: 'Home' } }],
              }),
            );
        } catch (e: any) {
            console.error(e);
            Alert.alert('로그인 실패', e.message ?? '알 수 없는 오류');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ padding: 24, gap: 12 }}>
            <Button title="Sign in with Google" onPress={onGoogle} disabled={loading} />
            {/* 필요하다면: <Button title="Sign in with Naver" onPress={() => onProvider('NAVER')} /> */}
            {loading && <ActivityIndicator />}
        </View>
    );
}
