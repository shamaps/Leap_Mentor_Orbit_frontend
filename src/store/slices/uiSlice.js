// src/store/slices/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    globalError: null, 
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setGlobalError(state, action) {
            state.globalError = action.payload; 
        },
        clearGlobalError(state) {
            state.globalError = null;
        },
    },
});

export const { setGlobalError, clearGlobalError } = uiSlice.actions;
export default uiSlice.reducer;