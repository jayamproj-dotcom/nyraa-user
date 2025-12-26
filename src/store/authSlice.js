import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    token: null,
    user: null, // We'll store user in Redux only
    isLoggedIn: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isLoggedIn = true;
            localStorage.setItem("token", action.payload.token);
        },
        updateUser: (state, action) => {
            state.user = action.payload;
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isLoggedIn = false;
        },
    },
});

export const { loginSuccess, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
