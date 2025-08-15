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