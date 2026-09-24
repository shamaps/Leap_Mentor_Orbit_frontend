import logger from "./logger"; 
export const formatSuccessResponse = (response) => {
    const isEmptyBody =
        response.status === 204 ||
        response.data === "" ||
        response.data === undefined;

    if (!isEmptyBody && response.data !== null && typeof response.data !== "object") {
        logger.error("Non-JSON response received", {
            url: response.config?.url,
            contentType: response.headers?.["content-type"],
        });
        return Promise.reject(new Error("Unexpected response format from server."));
    }

    if (response.data?.success === true && response.data.data !== undefined) {
        response.data = response.data.data;
    }
    return response;
};