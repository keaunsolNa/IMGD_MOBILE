import React, { useState } from 'react';
import { View, Image, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/Button';
import { FileAPI } from '@/services/api';
import { getAccessToken } from '@/services/storage';
import TextField from '../components/TextField';

export default function UploadScreen() {
    const [uri, setUri] = useState<string | null>(null);
    const [folderId, setFolderId] = useState<string>('1');
    const [groupId, setGroupId] = useState<string>('1');
    const [userId, setUserId] = useState<string>('ksna');
    const [fileName, setFileName] = useState<string>('upload.jpg');

    const pick = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return alert('권한이 필요합니다.');
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (!r.canceled) setUri(r.assets[0].uri);
    };

    const upload = async () => {
        if (!uri) return;
        const token = await getAccessToken();
        const res = await FileAPI.uploadBinary(
            uri,
            { folderId: Number(folderId), userId, groupId: Number(groupId), fileName },
            token ?? undefined
        );
        alert('업로드 완료: ' + JSON.stringify(res));
    };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text>Folder ID</Text>
            <TextField value={folderId} onChangeText={setFolderId} keyboardType="numeric" />
            <Text>Group ID</Text>
            <TextField value={groupId} onChangeText={setGroupId} keyboardType="numeric" />
            <Text>User ID</Text>
            <TextField value={userId} onChangeText={setUserId} />
            <Text>File Name</Text>
            <TextField value={fileName} onChangeText={setFileName} />
            <View style={{ height: 12 }} />
            <Button title="Pick Image" onPress={pick} />
            {uri && (<>
                <Image source={{ uri }} style={{ width: 160, height: 160, marginVertical: 12 }} />
                <Button title="Upload" onPress={upload} />
            </>)}
        </View>
    );
}