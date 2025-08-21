
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