import React from 'react';
import { TextInput } from 'react-native';
import { styles } from '@/styles/components/TextField';

export default function TextField(props: React.ComponentProps<typeof TextInput>) {
    return <TextInput placeholderTextColor="#999" style={styles.input} {...props} />;
}