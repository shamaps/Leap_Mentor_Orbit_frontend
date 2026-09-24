import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import axiosInstance from "@/shared/utils/axiosInstance";
import getErrorMessage from "@/shared/utils/getErrorMessage";

export interface ConnectRequest {
  _id: string;
  status: string;
  respondedAt?: string;
  [key: string]: unknown;
}

export const fetchIncomingRequests = createAsyncThunk(
  "connectRequests/fetchIncoming",
  async (_: void, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/connect-requests/incoming");
      return (res.data.requests || []) as ConnectRequest[];
    } catch (err) {
      return rejectWithValue(getErrorMessage(err as never, "Failed to load requests."));
    }
  },
);

const requestsAdapter = createEntityAdapter<ConnectRequest, string>({
  selectId: (request) => request._id,
});

interface ExtraState {
  loading: boolean;
  initialLoad: boolean;
  error: string | null;
}

const connectRequestsSlice = createSlice({
  name: "connectRequests",
  initialState: requestsAdapter.getInitialState<ExtraState>({
    loading: true,
    initialLoad: true,
    error: null,
  }),
  reducers: {
    updateRequestStatus(state, action: PayloadAction<{ id: string; newStatus: string }>) {
      const { id, newStatus } = action.payload;
      requestsAdapter.updateOne(state, {
        id,
        changes: { status: newStatus, respondedAt: new Date().toISOString() },
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncomingRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        requestsAdapter.setAll(state, action.payload);
        state.loading = false;
        state.initialLoad = false;
      })
      .addCase(fetchIncomingRequests.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to load requests.";
        state.loading = false;
        state.initialLoad = false;
      });
  },
});

export const { updateRequestStatus } = connectRequestsSlice.actions;
export const { selectAll: selectIncomingRequests } =
  requestsAdapter.getSelectors((state: RootState) => state.connectRequests);
export default connectRequestsSlice.reducer;