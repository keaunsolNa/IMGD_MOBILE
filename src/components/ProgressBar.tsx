import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from '@/styles/components/ProgressBar';

interface ProgressBarProps {
  visible: boolean;
  message?: string;
  progress?: number; // 0-100 사이의 값
  showPercentage?: boolean;
}

export default function ProgressBar({ 
  visible, 
  message = '처리 중...', 
  progress, 
  showPercentage = false 
}: ProgressBarProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.message}>{message}</Text>
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(100, Math.max(0, progress))}%` }
                ]} 
              />
            </View>
            {showPercentage && (
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

