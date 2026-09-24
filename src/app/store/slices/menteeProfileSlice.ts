// src/store/slices/menteeProfileSlice.ts

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/shared/utils/axiosInstance";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import { HTTP_STATUS } from "@/shared/constants/httpStatus";

export interface MenteeUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  roles?: string[];
  isEmailVerified?: boolean;
  [key: string]: unknown;
}

// Raw shape returned by GET /mentee-profile/me — stored as-is in state
// (mapMenteeProfile is only applied where the edit/settings forms read it,
// not here), so this stays loose rather than pretending it's normalized.
export type RawMenteeProfile = Record<string, unknown>;

interface MenteeProfileState {
  user: MenteeUser | null;
  profile: RawMenteeProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: MenteeProfileState = {
  user: null,
  profile: null,
  loading: true,
  error: null,
};

type FetchMenteeDashboardResult = { user: MenteeUser; profile: RawMenteeProfile };

type FetchMenteeDashboardRejection =
  | { reason: "wrong-role" }
  | { reason: "no-profile"; user: MenteeUser }
  | { reason: "unauthorized" }
  | { reason: "error"; message: string };

export const fetchMenteeDashboard = createAsyncThunk<
  FetchMenteeDashboardResult,
  void,
  { rejectValue: FetchMenteeDashboardRejection }
>(
  "menteeProfile/fetchMenteeDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const activeUserResponse = await axiosInstance.get("/users/me");
      const clientUserData: MenteeUser = activeUserResponse.data;

      if (!clientUserData?.roles?.includes("mentee")) {
        return rejectWithValue({ reason: "wrong-role" });
      }

      try {
        const clientProfileResponse = await axiosInstance.get("/mentee-profile/me");
        return { user: clientUserData, profile: clientProfileResponse.data };
      } catch (nestedProfileException: any) {
        const nestedStatusCode = nestedProfileException?.response?.status;

        if (nestedStatusCode === HTTP_STATUS.NOT_FOUND) {
          return rejectWithValue({ reason: "no-profile", user: clientUserData });
        }
        if (nestedStatusCode === HTTP_STATUS.UNAUTHORIZED) {
          return rejectWithValue({ reason: "unauthorized" });
        }
        throw nestedProfileException;
      }
    } catch (globalRootException: any) {
      if (globalRootException?.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        return rejectWithValue({ reason: "unauthorized" });
      }

      return rejectWithValue({
        reason: "error",
        message: getErrorMessage(globalRootException, "Something went wrong. Please try again."),
      });
    }
  }
);

const menteeProfileSlice = createSlice({
  name: "menteeProfile",
  initialState,
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
        state.error = null;
        state.loading = true;
      })
      .addCase(
        fetchMenteeDashboard.fulfilled,
        (state, { payload }: PayloadAction<FetchMenteeDashboardResult>) => {
          state.user = payload.user;
          state.profile = payload.profile;
          state.loading = false;
        }
      )
      .addCase(
        fetchMenteeDashboard.rejected,
        (state, { payload }: PayloadAction<FetchMenteeDashboardRejection | undefined>) => {
          const fallbackActionPayload = payload;

          if (fallbackActionPayload?.reason === "no-profile") {
            state.user = fallbackActionPayload.user;
          } else if (fallbackActionPayload?.reason === "error") {
            state.error = fallbackActionPayload.message;
          }
          state.loading = false;
        }
      );
  },
});

export const { resetMenteeProfile } = menteeProfileSlice.actions;
export default menteeProfileSlice.reducer;