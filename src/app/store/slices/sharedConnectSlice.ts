// src/store/slices/sharedConnectSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/shared/utils/axiosInstance";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import { HTTP_STATUS } from "@/shared/constants/httpStatus";

interface ConnectPerson {
  _id?: string;
  name?: string;
  [key: string]: unknown;
}

interface ConnectProfile {
  profilePicture?: string;
  [key: string]: unknown;
}

export interface SharedConnect {
  _id?: string;
  viewerRole?: string;
  status?: string;
  mentor?: ConnectPerson;
  mentee?: ConnectPerson;
  mentorProfile?: ConnectProfile;
  menteeProfile?: ConnectProfile;
  confirmedSlot?: unknown;
  totalAmount?: number;
  paidAt?: string;
  [key: string]: unknown;
}

interface SharedConnectState {
  connect: SharedConnect | null;
  loading: boolean;
  error: string | null;
}

type FetchSharedConnectRejection =
  | { reason: "unauthorized" }
  | { reason: "forbidden" }
  | { reason: "error"; message: string };

// Fetches a single connect-request's detail, mirrors SharedDashboardPage's
// original fetchConnect(). Navigation (401/403) stays in the page component.
export const fetchSharedConnect = createAsyncThunk(
  "sharedConnect/fetchSharedConnect",
  async (connectRequestId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/connect-requests/${connectRequestId}/detail`,
      );
      return res.data.connect ?? res.data;
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        return rejectWithValue({ reason: "unauthorized" } satisfies FetchSharedConnectRejection);
      }
      if (status === HTTP_STATUS.FORBIDDEN) {
        return rejectWithValue({ reason: "forbidden" } satisfies FetchSharedConnectRejection);
      }
      return rejectWithValue({
        reason: "error",
        message: getErrorMessage(err as never, "Failed to load session."),
      } satisfies FetchSharedConnectRejection);
    }
  },
);

const initialState: SharedConnectState = {
  connect: null,
  loading: true,
  error: null,
};

const sharedConnectSlice = createSlice({
  name: "sharedConnect",
  initialState,
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
        const payload = (action.payload as FetchSharedConnectRejection) || undefined;
        if (payload?.reason === "error") {
          state.error = payload.message;
        }
        state.loading = false;
      });
  },
});

export const { resetSharedConnect } = sharedConnectSlice.actions;
export default sharedConnectSlice.reducer;