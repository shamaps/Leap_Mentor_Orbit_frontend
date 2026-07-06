// src/store/slices/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    globalError: null, // { message, code } | null
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setGlobalError(state, action) {
            state.globalError = action.payload; // { message, code }
        },
        clearGlobalError(state) {
            state.globalError = null;
        },
    },
});

export const { setGlobalError, clearGlobalError } = uiSlice.actions;
export default uiSlice.reducer;