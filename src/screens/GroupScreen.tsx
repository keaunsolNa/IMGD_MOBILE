import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { GroupAPI } from '@/services/api';

export default function GroupScreen() {
    const [groupNm, setGroupNm] = useState('테스트 그룹');
    const [mst, setMst] = useState('ksna');
    const [gid, setGid] = useState('1');

    const makeDir = async () => {
        await GroupAPI.makeGroupDir({ groupId: Number(gid), groupNm, groupMstUserId: mst });
        alert('makeGroupDir 요청 완료');
    };

    const addUser = async () => {
        // NOTE: DTO 구조는 백엔드 GroupTableDTO에 맞춰 조정
        const dto = { groupId: Number(gid), groupNm, groupMstUserId: mst };
        await GroupAPI.addGroupUser(dto, '2');
        alert('addGroupUser 요청 완료');
    };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text>Group Name</Text>
            <TextField value={groupNm} onChangeText={setGroupNm} />
            <Text>Group Master</Text>
            <TextField value={mst} onChangeText={setMst} />
            <Text>Group ID</Text>
            <TextField value={gid} onChangeText={setGid} keyboardType="numeric" />
            <View style={{ height: 12 }} />
            <Button title="Make Group Dir" onPress={makeDir} />
            <View style={{ height: 8 }} />
            <Button title="Add Group User" onPress={addUser} />
        </View>
    );
}