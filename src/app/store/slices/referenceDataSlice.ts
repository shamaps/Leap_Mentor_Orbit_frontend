// store/slices/referenceDataSlice.js
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../../shared/utils/axiosInstance";

const STALE_AFTER_MS = 10 * 60 * 1000;

export interface Mentor {
  _id: string;
  [key: string]: unknown;
}

interface ReferenceDataState {
  industries: string[];
  mentorList: Mentor[];
  mentorListPagination: Record<string, unknown> | null;
  lastFetchedAt: number | null;
  mentorListFetchedAt: number | null;
  loading: boolean;
  error: string | null;
}

// NOTE: this slice's reducer is not currently registered in app/store/index.ts
// (see selectors.js / test/store/index.test.js, which explicitly documents
// this mismatch). Typed locally against its own expected shape rather than
// the real RootState, so this conversion doesn't silently change behavior —
// it would otherwise fail to compile since RootState has no `referenceData` key.
interface ReferenceDataRootState {
  referenceData: ReferenceDataState;
}

export const fetchMentorIndustries = createAsyncThunk(
  "referenceData/fetchMentorIndustries",
  async (_: void, { getState, rejectWithValue }) => {
    const { lastFetchedAt, industries } = (getState() as ReferenceDataRootState).referenceData;
    if (industries.length > 0 && lastFetchedAt !== null && Date.now() - lastFetchedAt < STALE_AFTER_MS) {
      return null;
    }
    try {
      const res = await axiosInstance.get("/admin/stats/mentor-industries");
      return res.data.data;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        e.response?.data?.message || "Failed to fetch industries",
      );
    }
  },
);

interface FetchMentorListParams {
  page?: number;
  limit?: number;
}

export const fetchMentorList = createAsyncThunk(
  "referenceData/fetchMentorList",
  async ({ page = 1, limit = 6 }: FetchMentorListParams = {}, { getState, rejectWithValue }) => {
    const { mentorListFetchedAt, mentorList } = (getState() as ReferenceDataRootState).referenceData;
    if (
      mentorList.length > 0 &&
      mentorListFetchedAt !== null &&
      Date.now() - mentorListFetchedAt < STALE_AFTER_MS
    ) {
      return null; // still fresh
    }
    try {
      const res = await axiosInstance.get(
        `/mentors?page=${page}&limit=${limit}`,
      );
      return res.data.data;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        e.response?.data?.message || "Failed to fetch mentors",
      );
    }
  },
);

const initialState: ReferenceDataState = {
  industries: [],
  mentorList: [],
  mentorListPagination: null,
  lastFetchedAt: null,
  mentorListFetchedAt: null,
  loading: false,
  error: null,
};

const referenceDataSlice = createSlice({
  name: "referenceData",
  initialState,
  reducers: {
    // Call this when a mentor profile is updated/published — invalidates mentor list cache
    invalidateMentorList(state) {
      state.mentorList = [];
      state.mentorListFetchedAt = null;
    },
    // Call this when admin updates industries
    invalidateIndustries(state) {
      state.industries = [];
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMentorIndustries.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.industries = action.payload;
          state.lastFetchedAt = Date.now();
        }
        state.loading = false;
      })
      .addCase(fetchMentorList.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.mentorList = action.payload.mentors;
          state.mentorListPagination = action.payload.pagination;
          state.mentorListFetchedAt = Date.now();
        }
        state.loading = false;
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("referenceData/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action): action is PayloadAction<string> =>
          action.type.startsWith("referenceData/") &&
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        },
      );
  },
});

export const { invalidateMentorList, invalidateIndustries } =
  referenceDataSlice.actions;
export default referenceDataSlice.reducer;