// src/store/slices/menteeProfileSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import getErrorMessage from "../../utils/getErrorMessage";

// Fetches /users/me + /mentee-profile/me, mirrors useMenteeDashboard.jsx's
// original fetchData(). Navigation stays in the hook; this thunk only
// fetches and reports outcome via payload.
export const fetchMenteeDashboard = createAsyncThunk(
    "menteeProfile/fetchMenteeDashboard",
    async (_, { rejectWithValue }) => {
        try {
            const userRes = await axiosInstance.get("/users/me");
            const userData = userRes.data;

            if (!userData.roles?.includes("mentee")) {
                return rejectWithValue({ reason: "wrong-role" });
            }

            try {
                const profileRes = await axiosInstance.get("/mentee-profile/me");
                return { user: userData, profile: profileRes.data };
            } catch (profileErr) {
                if (profileErr?.response?.status === 404) {
                    return rejectWithValue({ reason: "no-profile", user: userData });
                }
                if (profileErr?.response?.status === 401) {
                    return rejectWithValue({ reason: "unauthorized" });
                }
                throw profileErr;
            }
        } catch (err) {
            if (err?.response?.status === 401) {
                return rejectWithValue({ reason: "unauthorized" });
            }
            return rejectWithValue({
                reason: "error",
                message: getErrorMessage(err, "Something went wrong. Please try again."),
            });
        }
    }
);

const menteeProfileSlice = createSlice({
    name: "menteeProfile",
    initialState: {
        user: null,
        profile: null,
        loading: true,
        error: null,
    },
    reducers: {
        resetMenteeProfile(state) {
            state.user = null;
            state.profile = null;
            state.loading = true;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMenteeDashboard.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMenteeDashboard.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.profile = action.payload.profile;
                state.loading = false;
            })
            .addCase(fetchMenteeDashboard.rejected, (state, action) => {
                const payload = action.payload || {};
                if (payload.reason === "no-profile") {
                    state.user = payload.user;
                }
                if (payload.reason === "error") {
                    state.error = payload.message;
                }
                state.loading = false;
            });
    },
});

export const { resetMenteeProfile } = menteeProfileSlice.actions;
export default menteeProfileSlice.reducer;