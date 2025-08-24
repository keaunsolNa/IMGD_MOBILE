import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/styles/screens/myPage/MyPageScreen';

export default function MyPageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Page</Text>
    </View>
  );
}
