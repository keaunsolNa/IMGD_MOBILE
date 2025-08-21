import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

export default function Button({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
	return (
		<Pressable onPress={disabled ? undefined : onPress} style={[styles.btn, disabled && styles.disabled]}>
			<Text style={styles.txt}>{title}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
    btn: { padding: 12, borderRadius: 10, backgroundColor: '#2e6ef7' },
    disabled: { backgroundColor: '#9bb5ff' },
    txt: { color: '#fff', fontWeight: '600', textAlign: 'center' }
});