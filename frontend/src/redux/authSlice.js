import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    initAuth: (state) => {
      const token = localStorage.getItem("token");
      const user = (() => {
        try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
      })();
      if (token && user) {
        state.token = token;
        state.user = user;
      }
    },
  },
});

export const { setLogin, setLogout, setLoading, setError, initAuth } = authSlice.actions;
export default authSlice.reducer;