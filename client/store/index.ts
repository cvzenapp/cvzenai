import { configureStore } from '@reduxjs/toolkit';
import recruiterReducer from './recruiterSlice';

export const store = configureStore({
  reducer: {
    recruiter: recruiterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;