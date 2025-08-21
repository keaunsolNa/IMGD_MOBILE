// src/redux/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '@/services/api';

export interface AuthState {
  accessToken: string | null;
  redirectUrl: string | null;
  isLoading: boolean;
  error: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  redirectUrl: null,
  isLoading: false,
  error: false,
};

// Refresh thunk (optional, used by API when 401)
export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (refreshToken: string | null, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/getAccessToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken })
      });
      if (!res.ok) throw new Error('Failed to refresh token');
      const data = await res.json();
      return { accessToken: data.accessToken as string, redirectUrl: (data.redirectUrl ?? null) as string | null };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'refresh failed');
    }
  }
);

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ accessToken: string | null; redirectUrl?: string | null }>) => {
      state.accessToken = action.payload.accessToken;
      state.redirectUrl = action.payload.redirectUrl ?? null;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.redirectUrl = null;
      state.error = false;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshAccessToken.pending, (state) => {
        state.isLoading = true;
        state.error = false;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accessToken = action.payload.accessToken;
        state.redirectUrl = action.payload.redirectUrl;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.isLoading = false;
        state.error = true;
      });
  },
});

export const { setAuth, clearAuth } = slice.actions;
export default slice.reducer;
