import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

export default function Button({ title, onPress }: { title: string; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={styles.btn}>
            <Text style={styles.txt}>{title}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    btn: { padding: 12, borderRadius: 10, backgroundColor: '#2e6ef7' },
    txt: { color: '#fff', fontWeight: '600', textAlign: 'center' }
});