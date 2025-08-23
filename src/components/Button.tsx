import React from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from '@/styles/components/Button';

export default function Button({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
	return (
		<Pressable onPress={disabled ? undefined : onPress} style={[styles.button, disabled && styles.buttonDisabled]}>
			<Text style={styles.text}>{title}</Text>
		</Pressable>
	);
}