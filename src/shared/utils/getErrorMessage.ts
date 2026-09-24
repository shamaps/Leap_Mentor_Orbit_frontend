import { HTTP_STATUS } from "@/shared/constants/httpStatus";

interface ErrorLike {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Array<{ message: string }>;
    };
  };
  message?: string;
}

const getErrorMessage = (err: unknown, fallback = "Something went wrong."): string => {
  const e = err as ErrorLike | undefined;
  const status = e?.response?.status;
  const data = e?.response?.data;

  // 422 — surface the backend's field-level validation message if present
  if (status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
    return data?.message || "Please check the highlighted fields and try again.";
  }
  // 400 — field-level validation errors from Joi/Mongoose come back as
  // { success: false, errors: [{ field, message }] }, not { message }
  if (status === HTTP_STATUS.BAD_REQUEST && Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message).join(" ");
  }
  // 429 — rate limited, tell the user to slow down instead of "something went wrong"
  if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return "You're doing that a bit too fast. Please wait a moment and try again.";
  }

  // 5xx — this is a backend problem, not the user's — say so explicitly
  if (status !== undefined && status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    return "Something went wrong on our end. We've been notified — please try again shortly.";
  }

  return data?.message || e?.message || fallback;
};

export default getErrorMessage;