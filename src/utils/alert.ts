import { Platform, Alert } from 'react-native';

// 웹 환경 감지
export const isWeb = Platform.OS === 'web';

// 웹 환경에서 사용할 알림 함수
const showWebAlert = (title: string, message: string, buttons?: any[]) => {
  if (typeof window !== 'undefined' && window.confirm) {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result && buttons && buttons.length > 0) {
      // 확인 버튼이 있고 사용자가 확인을 누른 경우
      const confirmButton = buttons.find(btn => btn.text === '확인' || btn.text === 'OK');
      if (confirmButton && confirmButton.onPress) {
        confirmButton.onPress();
      }
    }
  } else {
    // fallback
    console.log(`${title}: ${message}`);
  }
};

// 플랫폼에 맞는 알림 함수
export const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (isWeb) {
    showWebAlert(title, message, buttons);
  } else {
    Alert.alert(title, message, buttons);
  }
};

// 성공 알림 (확인 버튼만)
export const showSuccessAlert = (message: string, onPress?: () => void) => {
  showAlert('성공', message, [
    { text: '확인', onPress }
  ]);
};

// 오류 알림 (확인 버튼만)
export const showErrorAlert = (message: string, onPress?: () => void) => {
  showAlert('오류', message, [
    { text: '확인', onPress }
  ]);
};

// 확인/취소 알림
export const showConfirmAlert = (
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel?: () => void
) => {
  showAlert(title, message, [
    { text: '취소', onPress: onCancel, style: 'cancel' },
    { text: '확인', onPress: onConfirm }
  ]);
};
