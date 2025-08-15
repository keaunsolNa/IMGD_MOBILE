import { create } from 'zustand';
import { loginWithPassword, logout } from '../services/auth';
import { getAccessToken } from '../services/storage';

type State = {
    isReady: boolean;
    isAuthenticated: boolean;
    boot: () => Promise<void>;
    signIn: (id: string, pw: string) => Promise<void>;
    signOut: () => Promise<void>;
};

export const useAuth = create<State>((set) => ({
    isReady: false,
    isAuthenticated: false,
    boot: async () => {
        const token = await getAccessToken();
        set({ isReady: true, isAuthenticated: !!token });
    },
    signIn: async (id, pw) => {
        await loginWithPassword({ username: id, password: pw });
        set({ isAuthenticated: true });
    },
    signOut: async () => {
        await logout();
        set({ isAuthenticated: false });
    }
}));