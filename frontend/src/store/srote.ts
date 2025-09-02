import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';  // Import the authentication reducer

// Configure the Redux store with the authentication slice
const store = configureStore({
  reducer: {
    auth: authReducer  // Register the auth slice under the key 'auth'
  }
});

// Export RootState and AppDispatch types for usage throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;  // Export the configured store
