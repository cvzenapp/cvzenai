import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecruiterUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  avatar?: string;
  company: {
    id: string;
    name: string;
    location: string;
  };
}

interface RecruiterState {
  isAuthenticated: boolean;
  user: RecruiterUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: RecruiterState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

const recruiterSlice = createSlice({
  name: 'recruiter',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: RecruiterUser; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      // Clear localStorage
      localStorage.removeItem('recruiter_token');
      localStorage.removeItem('recruiter_user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    // Initialize from localStorage
    initializeFromStorage: (state) => {
      const token = localStorage.getItem('recruiter_token');
      const userStr = localStorage.getItem('recruiter_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          state.isAuthenticated = true;
          state.user = user;
          state.token = token;
        } catch (error) {
          // Invalid stored data, clear it
          localStorage.removeItem('recruiter_token');
          localStorage.removeItem('recruiter_user');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  initializeFromStorage,
} = recruiterSlice.actions;

export default recruiterSlice.reducer;