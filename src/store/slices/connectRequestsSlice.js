import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import getErrorMessage from "../../utils/getErrorMessage";

export const fetchIncomingRequests = createAsyncThunk(
    "connectRequests/fetchIncoming",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get("/connect-requests/incoming");
            return res.data.requests || [];
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Failed to load requests."));
        }
    }
);

const requestsAdapter = createEntityAdapter({
    selectId: (request) => request._id,
});

const connectRequestsSlice = createSlice({
    name: "connectRequests",
    initialState: requestsAdapter.getInitialState({
        loading: true,
        initialLoad: true,
        error: null,
    }),
    reducers: {
        updateRequestStatus(state, action) {
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
                state.error = action.payload || "Failed to load requests.";
                state.loading = false;
                state.initialLoad = false;
            });
    },
});

export const { updateRequestStatus } = connectRequestsSlice.actions;
export const { selectAll: selectIncomingRequests } =
    requestsAdapter.getSelectors((state) => state.connectRequests);
export default connectRequestsSlice.reducer;