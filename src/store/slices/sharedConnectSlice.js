// src/store/slices/sharedConnectSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import getErrorMessage from "../../utils/getErrorMessage";
import { HTTP_STATUS } from "../../constants/httpStatus";
// Fetches a single connect-request's detail, mirrors SharedDashboardPage's
// original fetchConnect(). Navigation (401/403) stays in the page component.
export const fetchSharedConnect = createAsyncThunk(
  "sharedConnect/fetchSharedConnect",
  async (connectRequestId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/connect-requests/${connectRequestId}/detail`,
      );
      return res.data.connect ?? res.data;
    } catch (err) {
      const status = err?.response?.status;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        return rejectWithValue({ reason: "unauthorized" });
      }
      if (status === HTTP_STATUS.FORBIDDEN) {
        return rejectWithValue({ reason: "forbidden" });
      }
      return rejectWithValue({
        reason: "error",
        message: getErrorMessage(err, "Failed to load session."),
      });
    }
  },
);

const sharedConnectSlice = createSlice({
  name: "sharedConnect",
  initialState: {
    connect: null,
    loading: true,
    error: null,
  },
  reducers: {
    resetSharedConnect(state) {
      state.connect = null;
      state.loading = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSharedConnect.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSharedConnect.fulfilled, (state, action) => {
        state.connect = action.payload;
        state.loading = false;
      })
      .addCase(fetchSharedConnect.rejected, (state, action) => {
        const payload = action.payload || {};
        if (payload.reason === "error") {
          state.error = payload.message;
        }
        state.loading = false;
      });
  },
});

export const { resetSharedConnect } = sharedConnectSlice.actions;
export default sharedConnectSlice.reducer;
