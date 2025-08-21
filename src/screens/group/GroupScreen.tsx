import React from 'react';
import { View } from 'react-native';
import Button from '../../components/Button';

export default function GroupScreen({ navigation }: any) {
    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Button title="Make New Group" onPress={() => navigation.navigate('MakeGroup')} />
            <View style={{ height: 8 }} />
            <Button title="Make Group Root Folder" onPress={() => navigation.navigate('MakeGroupRootFolder')} />
        </View>
    );
}