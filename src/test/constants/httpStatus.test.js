import { describe, it, expect } from "vitest";
import { HTTP_STATUS, isClientError, isServerError } from "../../shared/constants/httpStatus";

describe("HTTP Status Constants and Helpers Suite", () => {

    describe("HTTP_STATUS Objects Schema", () => {
        it("should expose correct success status codes", () => {
            expect(HTTP_STATUS.OK).toBe(200);
            expect(HTTP_STATUS.CREATED).toBe(201);
            expect(HTTP_STATUS.NO_CONTENT).toBe(204);
        });

        it("should expose correct client error status codes", () => {
            expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
            expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
            expect(HTTP_STATUS.FORBIDDEN).toBe(403);
            expect(HTTP_STATUS.NOT_FOUND).toBe(404);
            expect(HTTP_STATUS.CONFLICT).toBe(409);
            expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422);
            expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
        });

        it("should expose correct server error status codes", () => {
            expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
            expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
            expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
        });
    });

    describe("isClientError() Functional Logic Matrix", () => {
        it("should evaluate to true when status boundaries reside inside 4xx client range horizons", () => {
            expect(isClientError(400)).toBe(true);
            expect(isClientError(404)).toBe(true);
            expect(isClientError(499)).toBe(true);
        });

        it("should evaluate to false when status numbers escape the 4xx client framework limitations", () => {
            expect(isClientError(200)).toBe(false);
            expect(isClientError(399)).toBe(false);
            expect(isClientError(500)).toBe(false);
        });
    });

    describe("isServerError() Functional Logic Matrix", () => {
        it("should evaluate to true when status numbers reside inside 5xx server range bounds", () => {
            expect(isServerError(500)).toBe(true);
            expect(isServerError(503)).toBe(true);
            expect(isServerError(599)).toBe(true);
        });

        it("should evaluate to false when status codes land outside the 5xx server scope definition", () => {
            expect(isServerError(200)).toBe(false);
            expect(isServerError(499)).toBe(false);
            expect(isServerError(600)).toBe(false);
        });
    });
});