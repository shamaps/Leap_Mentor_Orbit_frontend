// src/store/slices/mentorProfileSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/shared/utils/axiosInstance";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import { logoutUser } from "./authSlice";
import logger from "@/shared/utils/logger";
import { HTTP_STATUS } from "@/shared/constants/httpStatus";

interface MentorUser {
  name?: string;
  roles?: string[];
  [key: string]: unknown;
}

interface MentorProfileData {
  currentRole?: string;
  bio?: string;
  company?: string;
  industry?: string;
  profilePicture?: string;
  skills?: string[];
  languages?: string[];
  linkedInUrl?: string;
  yearsOfExperience?: number;
  avgRating?: number;
  hourlyRate?: number;
  verificationStatus?: string;
  updatedAt?: string;
  isProfileComplete?: boolean;
  [key: string]: unknown;
}

type FetchMentorDashboardRejection =
  | { reason: "unauthorized" }
  | { reason: "wrong-role" }
  | { reason: "no-profile"; user: MentorUser }
  | { reason: "error"; message: string };

export const fetchMentorDashboard = createAsyncThunk<
  { user: MentorUser; profile: MentorProfileData },
  void,
  { rejectValue: FetchMentorDashboardRejection }
>(
  "mentorProfile/fetchMentorDashboard",
  async (_, { dispatch, rejectWithValue }) => {
    // Isolated helper method to decouple statement hashes from the mentee slice file
    const triggerDeauthCleanup = () => {
      dispatch(logoutUser());
      return rejectWithValue({ reason: "unauthorized" });
    };

    try {
      const accountIdentityResponse = await axiosInstance.get("/users/me");
      const providerUserData: MentorUser = accountIdentityResponse.data;

      if (!providerUserData?.roles?.includes("mentor")) {
        return rejectWithValue({ reason: "wrong-role" });
      }

      try {
        const specProfileResponse = await axiosInstance.get("/mentor-profile/me");
        return { user: providerUserData, profile: specProfileResponse.data };
      } catch (nestedProfileException: any) {
        const nestedStatusCode = nestedProfileException?.response?.status;

        if (nestedStatusCode === HTTP_STATUS.NOT_FOUND) {
          return rejectWithValue({ reason: "no-profile", user: providerUserData });
        }
        if (nestedStatusCode === HTTP_STATUS.UNAUTHORIZED) {
          return triggerDeauthCleanup();
        }
        throw nestedProfileException;
      }
    } catch (globalRootException: any) {
      if (globalRootException?.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        return triggerDeauthCleanup();
      }

      return rejectWithValue({
        reason: "error",
        message: getErrorMessage(globalRootException, "Something went wrong. Please try again."),
      });
    }
  }
);

export const refetchMentorProfile = createAsyncThunk<
  MentorProfileData,
  void,
  { rejectValue: string }
>(
  "mentorProfile/refetchMentorProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/mentor-profile/me");
      return res.data;
    } catch (err: any) {
      logger.warn("Profile refetch failed", { message: err.message });
      return rejectWithValue(getErrorMessage(err, "Profile refetch failed."));
    }
  }
);

interface MentorProfileState {
  user: MentorUser | null;
  profile: MentorProfileData | null;
  loading: boolean;
  error: string | null;
}

const mentorProfileSlice = createSlice({
  name: "mentorProfile",
  initialState: {
    user: null,
    profile: null,
    loading: true,
    error: null,
  } as MentorProfileState,
  reducers: {
    resetMentorProfile(state) {
      state.user = null;
      state.profile = null;
      state.loading = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMentorDashboard.pending, (state) => {
        state.error = null;
        state.loading = true;
      })
      .addCase(fetchMentorDashboard.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.profile = payload.profile;
        state.loading = false;
      })
      .addCase(fetchMentorDashboard.rejected, (state, { payload }) => {
        if (payload?.reason === "no-profile") {
          state.user = payload.user;
        } else if (payload?.reason === "error") {
          state.error = payload.message;
        }
        state.loading = false;
      })
      .addCase(refetchMentorProfile.fulfilled, (state, { payload }) => {
        state.profile = payload;
      });
  },
});

export const { resetMentorProfile } = mentorProfileSlice.actions;
export default mentorProfileSlice.reducer;