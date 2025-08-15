import React, { useState } from 'react';
import { View } from 'react-native';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
            <TextField placeholder="ID" autoCapitalize="none" value={id} onChangeText={setId} />
            <TextField placeholder="Password" secureTextEntry value={pw} onChangeText={setPw} />
            <Button title="Sign in" onPress={() => signIn(id, pw)} />
        </View>
    );
}