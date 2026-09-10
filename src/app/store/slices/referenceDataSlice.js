// store/slices/referenceDataSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../shared/utils/axiosInstance";

const STALE_AFTER_MS = 10 * 60 * 1000;

export const fetchMentorIndustries = createAsyncThunk(
  "referenceData/fetchMentorIndustries",
  async (_, { getState, rejectWithValue }) => {
    const { lastFetchedAt, industries } = getState().referenceData;
    if (industries.length > 0 && Date.now() - lastFetchedAt < STALE_AFTER_MS) {
      return null;
    }
    try {
      const res = await axiosInstance.get("/admin/stats/mentor-industries");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch industries",
      );
    }
  },
);

export const fetchMentorList = createAsyncThunk(
  "referenceData/fetchMentorList",
  async ({ page = 1, limit = 6 } = {}, { getState, rejectWithValue }) => {
    const { mentorListFetchedAt, mentorList } = getState().referenceData;
    if (
      mentorList.length > 0 &&
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
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch mentors",
      );
    }
  },
);

const referenceDataSlice = createSlice({
  name: "referenceData",
  initialState: {
    industries: [],
    mentorList: [],
    mentorListPagination: null,
    lastFetchedAt: null,
    mentorListFetchedAt: null,
    loading: false,
    error: null,
  },
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
        (action) =>
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
