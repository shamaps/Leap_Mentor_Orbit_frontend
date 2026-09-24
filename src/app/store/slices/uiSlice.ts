// src/store/slices/uiSlice.js
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface GlobalError {
    message: string;
    code?: string | number;
}

interface UiState {
    globalError: GlobalError | null;
}

const initialState: UiState = {
    globalError: null,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setGlobalError(state, action: PayloadAction<GlobalError>) {
            state.globalError = action.payload;
        },
        clearGlobalError(state) {
            state.globalError = null;
        },
    },
});

export const { setGlobalError, clearGlobalError } = uiSlice.actions;
export default uiSlice.reducer;
