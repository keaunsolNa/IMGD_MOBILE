import React from 'react';
import { View, Text } from 'react-native';
import Button from '../components/Button';
import { useAuth } from '@/hooks/useAuth';
import { HealthAPI } from '@/services/api';

export default function HomeScreen({ navigation }: any) {
    const { signOut } = useAuth();
    return (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>IMGD Mobile</Text>
            <Button title="Group" onPress={() => navigation.navigate('Groups')} />
            <Button title="Upload" onPress={() => navigation.navigate('Upload')} />
            <Button title="Sign out" onPress={signOut} />
            <Button
                title="Ping API"
                onPress={async () => {
                    try {
                        const { data, status } = await HealthAPI.ping();
                        alert(`OK ${status}: ${JSON.stringify(data)}`);
                    } catch (e: any) {
                        alert('ERR: ' + (e?.message ?? 'unknown'));
                        console.log(e?.response?.status, e?.response?.data);
                    }
                }}
            />
        </View>
    );
}

