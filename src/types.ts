
// 백엔드 ApiResponse 구조에 맞춘 타입 정의
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// 기존 DTO들
export interface IGroupTableDTO {
  groupId?: number; // optional for create
  groupNm: string;
  groupMstUserId?: string;
}

export interface IMakeDirDTO {
  userId: string;
  parentId: number;
  dirNm: string;
  groupId: number;
}

export interface IMakeFileDTO {
  folderId: number;
  userId: string;
  groupId: number;
  fileName: string;
  // originalFile: handled as multipart in API layer
}