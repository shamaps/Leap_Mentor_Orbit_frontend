export interface AdminPerson {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

export interface AdminSlot {
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
}

export interface AdminEngagement {
  _id: string;
  id?: string;
  mentee?: AdminPerson;
  mentor?: AdminPerson;
  status: string;
  selectedSlots?: AdminSlot[];
  sessionRate?: number;
  sessionCount?: number;
  paymentStatus?: string;
  requestedAt?: string;
  respondedAt?: string;
  completedAt?: string;
}

export interface AdminReport {
  id: string;
  status: string;
  category: string;
  adminNote?: string;
  refundProcessed?: boolean;
  connectRequestId?: string | null;
  date?: string;
  mentee?: string;
  menteeEmail?: string;
  mentor?: string;
  mentorEmail?: string;
  reportedBy?: string;
  paymentStatus?: string;
  description?: string;
  screenshotUrl?: string;
  totalAmount?: number;
  [key: string]: unknown;
}

export interface AdminWalletRequest {
  _id: string;
  status: string;
  mentee: AdminPerson;
  requestedAt?: string;
  createdAt?: string;
  amount?: number;
  currentBalance?: number;
  sessionCount?: number;
  liveStats?: { totalSessions?: number; completedSessions?: number; ongoingSessions?: number };
}

export interface AdminUser extends AdminPerson {
  role?: string;
  roles?: string[];
  isBlocked?: boolean;
  isDeleted?: boolean;
  isEmailVerified?: boolean;
  profile?: { profilePicture?: string };
  createdAt?: string;
  profilePicture?: string;
  currentBalance?: number;
  sessionCount?: number;
  liveStats?: { totalSessions?: number; completedSessions?: number; ongoingSessions?: number };
}

export interface AdminPaymentTransaction {
  _id: string;
  id?: string;
  amount: number;
  txId: string;
  type: string;
  status: string;
  date: string;
  createdAt?: string;
  user?: AdminPerson;
  mentee?: AdminPerson;
  mentor?: AdminPerson;
}

export interface AdminPaymentChartPoint {
  amount: number;
  date?: string;
  label?: string;
  [key: string]: string | number | undefined;
}

export type AdminStats = Record<string, number | string | undefined>;

export interface AdminGrowthDatum { count: number; label: string; [key: string]: unknown }
export interface AdminIndustryDatum { industry: string; count: number; [key: string]: unknown }
