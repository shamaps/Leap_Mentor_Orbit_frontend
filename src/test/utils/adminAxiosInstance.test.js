import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import adminAxiosInstance from "../../utils/adminAxiosInstance";
import logger from "../../utils/logger";
import { delay as mswDelay } from "msw";


const BASE = "http://localhost:5000/api/v1";

describe("adminAxiosInstance", () => {
    beforeEach(() => {
        vi.spyOn(logger, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("unwraps the envelope when success:true and data is present", async () => {
        server.use(
            http.get(`${BASE}/admin/ping`, () =>
                HttpResponse.json({ success: true, data: { ok: true } }),
            ),
        );
        const res = await adminAxiosInstance.get("/admin/ping");
        expect(res.data).toEqual({ ok: true });
    });

    it("rejects with an error when the response body is non-JSON", async () => {
        server.use(
            http.get(`${BASE}/admin/ping`, () => new HttpResponse("plain text", {
                headers: { "Content-Type": "text/plain" },
            })),
        );
        await expect(adminAxiosInstance.get("/admin/ping")).rejects.toThrow(
            "Unexpected response format from server.",
        );
    });

    it("logs a timeout message when the request times out", async () => {
        const responseErrorHandler = adminAxiosInstance.interceptors.response.handlers[0].rejected;
        const timeoutError = {
            code: "ECONNABORTED",
            message: "timeout of 15000ms exceeded",
            config: { url: "/admin/slow", method: "get" },
        };

        await expect(responseErrorHandler(timeoutError)).rejects.toBe(timeoutError);
        expect(logger.error).toHaveBeenCalledWith(
            "Admin API request timed out",
            expect.objectContaining({ url: "/admin/slow" }),
        );
    });
    it("redirects to /admin/login on 401", async () => {
        const originalLocation = globalThis.location;
        const fakeLocation = { href: "http://localhost:3000/" };
        vi.stubGlobal("location", fakeLocation);

        server.use(
            http.get(`${BASE}/admin/secure`, () =>
                HttpResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
            ),
        );
        await expect(adminAxiosInstance.get("/admin/secure")).rejects.toBeTruthy();
        expect(fakeLocation.href).toBe("/admin/login");

        vi.stubGlobal("location", originalLocation);
    }); it("leaves the response untouched when success is not true", async () => {
        server.use(
            http.get(`${BASE}/admin/legacy`, () =>
                HttpResponse.json({ success: false, message: "nope" }),
            ),
        );
        const res = await adminAxiosInstance.get("/admin/legacy");
        expect(res.data).toEqual({ success: false, message: "nope" });
    });

    it("falls back to error.message when the server gives no message field (network error)", async () => {
        server.use(http.get(`${BASE}/admin/broken`, () => HttpResponse.error()));
        await expect(adminAxiosInstance.get("/admin/broken")).rejects.toBeTruthy();
        expect(logger.error).toHaveBeenCalledWith(
            "Admin API request failed",
            expect.objectContaining({ message: expect.any(String) }),
        );
    });
    it("does NOT unwrap when success:true but data is undefined", async () => {
        server.use(
            http.get(`${BASE}/admin/ping`, () => HttpResponse.json({ success: true })),
        );
        const res = await adminAxiosInstance.get("/admin/ping");
        expect(res.data).toEqual({ success: true });
    });
    it("passes through a literal null response body without treating it as malformed", async () => {
        server.use(http.get(`${BASE}/admin/ping`, () => HttpResponse.json(null)));
        const res = await adminAxiosInstance.get("/admin/ping");
        expect(res.data).toBeNull();
    });
    it("logs the server-provided error message when present (not just error.message)", async () => {
        server.use(
            http.get(`${BASE}/admin/broken`, () =>
                HttpResponse.json({ message: "Forbidden action" }, { status: 403 }),
            ),
        );
        await expect(adminAxiosInstance.get("/admin/broken")).rejects.toBeTruthy();
        expect(logger.error).toHaveBeenCalledWith(
            "Admin API request failed",
            expect.objectContaining({ message: "Forbidden action" }),
        );
    });

});