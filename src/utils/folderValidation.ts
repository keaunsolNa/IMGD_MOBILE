// 윈도우 파일 시스템에서 허용되지 않는 문자들
const INVALID_CHARS = /[<>:"/\\|?*]/g;

// 윈도우에서 예약된 파일명들 (대소문자 구분 없음)
const RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
];

// 폴더명 유효성 검사 결과 타입
export interface FolderValidationResult {
  isValid: boolean;
  errorMessage?: string;
  sanitizedName?: string;
}

/**
 * 폴더명/그룹명 유효성 검사 함수
 * @param folderName 검사할 폴더명/그룹명
 * @returns 유효성 검사 결과
 */
export function validateFolderName(folderName: string): FolderValidationResult {
  // 빈 문자열 체크
  if (!folderName || folderName.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: '폴더명을 입력해주세요.'
    };
  }

  const trimmedName = folderName.trim();

  // 길이 체크 (윈도우 파일명 최대 길이: 255자)
  if (trimmedName.length > 255) {
    return {
      isValid: false,
      errorMessage: '폴더명은 255자를 초과할 수 없습니다.'
    };
  }

  // 허용되지 않는 문자 체크
  if (INVALID_CHARS.test(trimmedName)) {
    const invalidChars = trimmedName.match(INVALID_CHARS);
    const uniqueInvalidChars = [...new Set(invalidChars)];
    
    return {
      isValid: false,
      errorMessage: `다음 문자는 사용할 수 없습니다: ${uniqueInvalidChars.join(', ')}`
    };
  }

  // 예약된 이름 체크
  if (RESERVED_NAMES.includes(trimmedName.toUpperCase())) {
    return {
      isValid: false,
      errorMessage: `"${trimmedName}"은(는) 예약된 이름입니다.`
    };
  }

  // 점으로 시작하거나 끝나는 이름 체크
  if (trimmedName.startsWith('.') || trimmedName.endsWith('.')) {
    return {
      isValid: false,
      errorMessage: '폴더명은 점(.)으로 시작하거나 끝날 수 없습니다.'
    };
  }

  // 공백으로 시작하거나 끝나는 이름 체크
  if (trimmedName !== folderName) {
    return {
      isValid: false,
      errorMessage: '폴더명은 앞뒤 공백을 포함할 수 없습니다.'
    };
  }

  return {
    isValid: true
  };
}

/**
 * 폴더명을 윈도우 파일 시스템에 맞게 정리하는 함수
 * @param folderName 정리할 폴더명
 * @returns 정리된 폴더명
 */
export function sanitizeFolderName(folderName: string): string {
  if (!folderName) return '';

  let sanitized = folderName.trim();

  // 허용되지 않는 문자를 언더스코어로 대체
  sanitized = sanitized.replace(INVALID_CHARS, '_');

  // 연속된 언더스코어를 하나로 합치기
  sanitized = sanitized.replace(/_+/g, '_');

  // 앞뒤 언더스코어 제거
  sanitized = sanitized.replace(/^_+|_+$/g, '');

  // 점으로 시작하거나 끝나는 경우 제거
  sanitized = sanitized.replace(/^\.+|\.+$/g, '');

  // 예약된 이름인 경우 뒤에 숫자 추가
  if (RESERVED_NAMES.includes(sanitized.toUpperCase())) {
    sanitized = sanitized + '_1';
  }

  // 빈 문자열이 된 경우 기본값 설정
  if (!sanitized) {
    sanitized = 'New_Folder';
  }

  return sanitized;
}

/**
 * 실시간 폴더명 입력 검증 함수
 * @param input 현재 입력된 텍스트
 * @returns 실시간 검증 결과
 */
export function validateFolderNameInput(input: string): {
  isValid: boolean;
  errorMessage?: string;
  sanitizedSuggestion?: string;
} {
  // 빈 입력은 유효한 것으로 처리 (사용자가 입력 중일 수 있음)
  if (!input || input.trim().length === 0) {
    return { isValid: true };
  }

  const validation = validateFolderName(input);
  
  if (validation.isValid) {
    return { isValid: true };
  }

  // 유효하지 않은 경우 정리된 이름 제안
  const sanitized = sanitizeFolderName(input);
  
  return {
    isValid: false,
    errorMessage: validation.errorMessage,
    sanitizedSuggestion: sanitized !== input ? sanitized : undefined
  };
}

/**
 * 그룹명 유효성 검사 함수 (폴더명과 동일한 규칙 적용)
 * @param groupName 검사할 그룹명
 * @returns 유효성 검사 결과
 */
export function validateGroupName(groupName: string): FolderValidationResult {
  // 빈 문자열 체크
  if (!groupName || groupName.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: '그룹명을 입력해주세요.'
    };
  }

  const trimmedName = groupName.trim();

  // 길이 체크 (윈도우 파일명 최대 길이: 255자)
  if (trimmedName.length > 255) {
    return {
      isValid: false,
      errorMessage: '그룹명은 255자를 초과할 수 없습니다.'
    };
  }

  // 허용되지 않는 문자 체크
  if (INVALID_CHARS.test(trimmedName)) {
    const invalidChars = trimmedName.match(INVALID_CHARS);
    const uniqueInvalidChars = [...new Set(invalidChars)];
    
    return {
      isValid: false,
      errorMessage: `다음 문자는 사용할 수 없습니다: ${uniqueInvalidChars.join(', ')}`
    };
  }

  // 예약된 이름 체크
  if (RESERVED_NAMES.includes(trimmedName.toUpperCase())) {
    return {
      isValid: false,
      errorMessage: `"${trimmedName}"은(는) 예약된 이름입니다.`
    };
  }

  // 점으로 시작하거나 끝나는 이름 체크
  if (trimmedName.startsWith('.') || trimmedName.endsWith('.')) {
    return {
      isValid: false,
      errorMessage: '그룹명은 점(.)으로 시작하거나 끝날 수 없습니다.'
    };
  }

  // 공백으로 시작하거나 끝나는 이름 체크
  if (trimmedName !== groupName) {
    return {
      isValid: false,
      errorMessage: '그룹명은 앞뒤 공백을 포함할 수 없습니다.'
    };
  }

  return {
    isValid: true
  };
}

/**
 * 그룹명을 윈도우 파일 시스템에 맞게 정리하는 함수
 * @param groupName 정리할 그룹명
 * @returns 정리된 그룹명
 */
export function sanitizeGroupName(groupName: string): string {
  if (!groupName) return '';

  let sanitized = groupName.trim();

  // 허용되지 않는 문자를 언더스코어로 대체
  sanitized = sanitized.replace(INVALID_CHARS, '_');

  // 연속된 언더스코어를 하나로 합치기
  sanitized = sanitized.replace(/_+/g, '_');

  // 앞뒤 언더스코어 제거
  sanitized = sanitized.replace(/^_+|_+$/g, '');

  // 점으로 시작하거나 끝나는 경우 제거
  sanitized = sanitized.replace(/^\.+|\.+$/g, '');

  // 예약된 이름인 경우 뒤에 숫자 추가
  if (RESERVED_NAMES.includes(sanitized.toUpperCase())) {
    sanitized = sanitized + '_1';
  }

  // 빈 문자열이 된 경우 기본값 설정
  if (!sanitized) {
    sanitized = 'New_Group';
  }

  return sanitized;
}

/**
 * 실시간 그룹명 입력 검증 함수
 * @param input 현재 입력된 텍스트
 * @returns 실시간 검증 결과
 */
export function validateGroupNameInput(input: string): {
  isValid: boolean;
  errorMessage?: string;
  sanitizedSuggestion?: string;
} {
  // 빈 입력은 유효한 것으로 처리 (사용자가 입력 중일 수 있음)
  if (!input || input.trim().length === 0) {
    return { isValid: true };
  }

  const validation = validateGroupName(input);
  
  if (validation.isValid) {
    return { isValid: true };
  }

  // 유효하지 않은 경우 정리된 이름 제안
  const sanitized = sanitizeGroupName(input);
  
  return {
    isValid: false,
    errorMessage: validation.errorMessage,
    sanitizedSuggestion: sanitized !== input ? sanitized : undefined
  };
}
