// Mirror your Spring DTOs here for type safety
export type GroupTableDTO = {
  groupId?: number;
  groupNm: string;
  groupMstUserId: string;
  regDtm?: string | null;
  regId?: string | null;
  modDtm?: string | null;
  modId?: string | null;
};

export type UserTableDTO = {
  userId: string;
  name: string;
  email: string;
  nickName: string;
  loginType: string;
  lastLoginDate: string;
  regDtm: string;
  pictureUrl?: string | null;
};

export type MakeFileDTO = {
  folderId: number;
  userId: string;
  groupId: number;
  fileName: string;
  originalFile: any;
};