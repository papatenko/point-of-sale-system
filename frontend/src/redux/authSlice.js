import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,  // Puede ser null
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token || null; // Si no hay token, null
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    
  },
});

export const { setLogin, setLogout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;