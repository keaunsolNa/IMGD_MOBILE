import React, { useState } from 'react';
import { View, Image, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/Button';
import { FileAPI } from '@/services/api';
import { getAccessToken } from '@/services/storage';
import TextField from '../components/TextField';
import { styles } from '@/styles/screens/upload/UploadScreen';

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
        
        try {
            const token = await getAccessToken();
            const response = await FileAPI.uploadBinary(
                uri,
                { folderId: Number(folderId), userId, groupId: Number(groupId), fileName },
                token ?? undefined
            );
            
            // ResponseEntity<String> 형식 처리
            if (response && typeof response === 'string') {
                alert('업로드 완료: ' + response);
            } else if (response && response.success) {
                alert('업로드 완료');
            } else {
                alert('업로드에 실패했습니다.');
            }
        } catch (error: any) {
            console.error('파일 업로드 실패:', error);
            alert('업로드에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Text>Folder ID</Text>
                <TextField value={folderId} onChangeText={setFolderId} keyboardType="numeric" />
            </View>
            <View style={styles.inputContainer}>
                <Text>Group ID</Text>
                <TextField value={groupId} onChangeText={setGroupId} keyboardType="numeric" />
            </View>
            <View style={styles.inputContainer}>
                <Text>User ID</Text>
                <TextField value={userId} onChangeText={setUserId} />
            </View>
            <View style={styles.inputContainer}>
                <Text>File Name</Text>
                <TextField value={fileName} onChangeText={setFileName} />
            </View>
            <View style={styles.spacing} />
            <Button title="Pick Image" onPress={pick} />
            {uri && (<>
                <View style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.image} />
                </View>
                <Button title="Upload" onPress={upload} />
            </>)}
        </View>
    );
}