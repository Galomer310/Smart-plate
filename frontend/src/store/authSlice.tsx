import { createSlice } from "@reduxjs/toolkit";

// Define the interface for the authentication state
interface AuthState {
  isAdmin: any;
  token: string | null; // JWT token if logged in
  user: any; // User details (could be typed further)
}

// Set the initial state for authentication
const initialState: AuthState = {
  token: null,
  user: null,
  isAdmin: undefined,
};

// Create the auth slice with name, initial state, and reducers
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Action to set the login state with token and user info
    login(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    // Action to clear the authentication state on logout
    logout(state) {
      state.token = null;
      state.user = null;
    },
  },
});

// Export actions for use in components
export const { login, logout } = authSlice.actions;
export default authSlice.reducer; // Export the reducer to be added to the store
