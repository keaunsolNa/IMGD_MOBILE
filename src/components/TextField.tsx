import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

export default function TextField(props: React.ComponentProps<typeof TextInput>) {
    return <TextInput placeholderTextColor="#999" style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginVertical: 6 }
});