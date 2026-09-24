// src/test/api/axiosInstance.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse, delay as mswDelay } from "msw";
import { server } from "../mswServer";
import axiosInstance, { injectStore } from "../../shared/utils/axiosInstance";
import logger from "../../shared/utils/logger";

const BASE = "http://localhost:5000/api/v1";

function makeFakeStore(initialToken = null) {
    let token = initialToken;
    const dispatch = vi.fn((action) => {
        if (typeof action === "object" && action?.type === "auth/setToken") token = action.payload;
        if (typeof action === "object" && action?.type === "auth/logout") token = null;
    });
    return { dispatch, getState: () => ({ auth: { token } }) };
}

describe("axiosInstance", () => {
    let store;

    beforeEach(() => {
        store = makeFakeStore(null);
        injectStore(store);
        vi.spyOn(logger, "debug").mockImplementation(() => { });
        vi.spyOn(logger, "info").mockImplementation(() => { });
        vi.spyOn(logger, "warn").mockImplementation(() => { });
        vi.spyOn(logger, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    // ── Request interceptor ────────────────────────────────────
    describe("request interceptor", () => {
        it("attaches Authorization header when a token is present in the store", async () => {
            store = makeFakeStore("abc123");
            injectStore(store);

            let receivedAuth;
            server.use(
                http.get(`${BASE}/ping`, ({ request }) => {
                    receivedAuth = request.headers.get("authorization");
                    return HttpResponse.json({ ok: true });
                }),
            );

            await axiosInstance.get("/ping");
            expect(receivedAuth).toBe("Bearer abc123");
        });

        it("omits Authorization header when there is no token", async () => {
            let receivedAuth;
            server.use(
                http.get(`${BASE}/ping`, ({ request }) => {
                    receivedAuth = request.headers.get("authorization");
                    return HttpResponse.json({ ok: true });
                }),
            );

            await axiosInstance.get("/ping");
            expect(receivedAuth).toBeNull();
        });

        it("attaches a unique X-Request-Id to every request", async () => {
            let id1, id2;
            server.use(
                http.get(`${BASE}/ping`, ({ request }) => {
                    const id = request.headers.get("x-request-id");
                    if (!id1) id1 = id;
                    else id2 = id;
                    return HttpResponse.json({ ok: true });
                }),
            );

            await axiosInstance.get("/ping");
            await axiosInstance.get("/ping");
            expect(id1).toBeTruthy();
            expect(id2).toBeTruthy();
            expect(id1).not.toBe(id2);
        });

        it("sets Content-Type: application/json for plain object bodies", async () => {
            let contentType;
            server.use(
                http.post(`${BASE}/ping`, ({ request }) => {
                    contentType = request.headers.get("content-type");
                    return HttpResponse.json({ ok: true });
                }),
            );

            await axiosInstance.post("/ping", { a: 1 });
            expect(contentType).toContain("application/json");
        });

        it("does NOT force Content-Type for FormData bodies (lets the browser set the multipart boundary)", async () => {
            let contentType;
            server.use(
                http.post(`${BASE}/upload`, ({ request }) => {
                    contentType = request.headers.get("content-type");
                    return HttpResponse.json({ ok: true });
                }),
            );

            const form = new FormData();
            form.append("file", new Blob(["hi"]), "hi.txt");
            await axiosInstance.post("/upload", form);

            expect(contentType).toContain("multipart/form-data");
        });
    });

    // ── Response interceptor: success path ──────────────────────
    describe("response interceptor — success", () => {
        it("unwraps { success: true, data } envelopes down to just data", async () => {
            server.use(
                http.get(`${BASE}/thing`, () => HttpResponse.json({ success: true, data: { id: 1 } })),
            );
            const res = await axiosInstance.get("/thing");
            expect(res.data).toEqual({ id: 1 });
        });

        it("leaves non-enveloped JSON bodies untouched", async () => {
            server.use(http.get(`${BASE}/thing`, () => HttpResponse.json({ id: 1, name: "x" })));
            const res = await axiosInstance.get("/thing");
            expect(res.data).toEqual({ id: 1, name: "x" });
        });

        it("treats a 204 No Content as a valid response, not a format error", async () => {
            server.use(http.get(`${BASE}/thing`, () => new HttpResponse(null, { status: 204 })));
            const res = await axiosInstance.get("/thing");
            expect(res.status).toBe(204);
        });

        it("rejects with a friendly error when the response is non-JSON and non-empty", async () => {
            server.use(
                http.get(`${BASE}/thing`, () => new HttpResponse("<html>oops</html>", {
                    status: 200,
                    headers: { "content-type": "text/html" },
                })),
            );
            await expect(axiosInstance.get("/thing")).rejects.toThrow(
                "Unexpected response format from server.",
            );
        });
    });

    // ── Error handling: timeout + status banners ────────────────
    describe("error handling", () => {
        it("dispatches a TIMEOUT global error banner on ECONNABORTED", async () => {
           
            const responseErrorHandler = axiosInstance.interceptors.response.handlers[0].rejected;
            const timeoutError = {
                code: "ECONNABORTED",
                message: "timeout of 50ms exceeded",
                config: {
                    method: "get",
                    url: "/slow",
                    headers: { "X-Request-Id": "test-id" },
                    _genericRetryCount: 2,
                },
            };

            await expect(responseErrorHandler(timeoutError)).rejects.toBe(timeoutError);

            expect(store.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "ui/setGlobalError",
                    payload: expect.objectContaining({ code: "TIMEOUT" }),
                }),
            );
        });

        it("dispatches a status banner for 403/429/500/502/503", async () => {
            server.use(http.get(`${BASE}/forbidden`, () => new HttpResponse(null, { status: 403 })));
            await expect(axiosInstance.get("/forbidden")).rejects.toBeTruthy();
            expect(store.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "ui/setGlobalError",
                    payload: expect.objectContaining({ code: 403 }),
                }),
            );
        });

        it("logs the error via the logger, redacted request info included", async () => {
            server.use(http.get(`${BASE}/broken`, () => new HttpResponse(null, { status: 500 })));
            await expect(axiosInstance.get("/broken")).rejects.toBeTruthy();
            expect(logger.error).toHaveBeenCalled();
        });

        it("does NOT log a 401 that comes from /auth/refresh itself (expected, not an error)", async () => {
            server.use(http.post(`${BASE}/auth/refresh`, () => new HttpResponse(null, { status: 401 })));
            await expect(axiosInstance.post("/auth/refresh")).rejects.toBeTruthy();
            expect(logger.error).not.toHaveBeenCalled();
        });
    });

    // ── Retry for transient GET failures ────────────────────────
    describe("retry on transient failure (GET only)", () => {
        it("retries a GET on 503 up to MAX_RETRIES, then succeeds", async () => {
            let attempt = 0;
            server.use(
                http.get(`${BASE}/flaky`, () => {
                    attempt += 1;
                    if (attempt <= 2) return new HttpResponse(null, { status: 503 });
                    return HttpResponse.json({ success: true, data: { ok: true } });
                }),
            );

            vi.useFakeTimers({ shouldAdvanceTime: true });
            const promise = axiosInstance.get("/flaky");
            // backoff: 500ms, then 1000ms
            await vi.advanceTimersByTimeAsync(500);
            await vi.advanceTimersByTimeAsync(1000);
            const res = await promise;

            expect(attempt).toBe(3); // 1 original + 2 retries
            expect(res.data).toEqual({ ok: true });
        });

        it("gives up after MAX_RETRIES and rejects", async () => {
            server.use(http.get(`${BASE}/flaky`, () => new HttpResponse(null, { status: 503 })));

            vi.useFakeTimers({ shouldAdvanceTime: true });
            const promise = axiosInstance.get("/flaky");
            const assertion = expect(promise).rejects.toBeTruthy();
            await vi.advanceTimersByTimeAsync(500);
            await vi.advanceTimersByTimeAsync(1000);
            await assertion;
        });

        it("does NOT retry POST requests, even on 503", async () => {
            let attempt = 0;
            server.use(
                http.post(`${BASE}/flaky`, () => {
                    attempt += 1;
                    return new HttpResponse(null, { status: 503 });
                }),
            );

            await expect(axiosInstance.post("/flaky")).rejects.toBeTruthy();
            expect(attempt).toBe(1);
        });
    });
    it("does NOT unwrap when success:true but data is undefined", async () => {
        server.use(
            http.get(`${BASE}/thing`, () => HttpResponse.json({ success: true })),
        );
        const res = await axiosInstance.get("/thing");
        expect(res.data).toEqual({ success: true });
    });

    it("logs the server-provided error message when present (not just error.message)", async () => {
        server.use(
            http.get(`${BASE}/broken`, () =>
                HttpResponse.json({ message: "Validation failed: email required" }, { status: 400 }),
            ),
        );
        await expect(axiosInstance.get("/broken")).rejects.toBeTruthy();
        expect(logger.error).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ message: "Validation failed: email required" }),
        );
    });

    it("includes contentType in the log when a non-JSON response has a content-type header", async () => {
        server.use(
            http.get(`${BASE}/thing`, () => new HttpResponse("<html></html>", {
                status: 200,
                headers: { "content-type": "text/html; charset=utf-8" },
            })),
        );
        await expect(axiosInstance.get("/thing")).rejects.toThrow();
        expect(logger.error).toHaveBeenCalledWith(
            "Non-JSON response received",
            expect.objectContaining({ contentType: expect.stringContaining("text/html") }),
        );
    });
    // ── 401 handling: auth routes short-circuit ─────────────────
    describe("401 on auth routes (login/register/refresh)", () => {
        it("logs the user out immediately without attempting a refresh", async () => {
            server.use(http.post(`${BASE}/auth/login`, () => new HttpResponse(null, { status: 401 })));
            await expect(axiosInstance.post("/auth/login")).rejects.toBeTruthy();

            // dispatch called once, with the logoutUser() thunk (a function)
            expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe("edge-case branches", () => {
        it("suppresses logging for an expected 404 when suppressNotFoundLog is set", async () => {
            server.use(http.get(`${BASE}/maybe-missing`, () => new HttpResponse(null, { status: 404 })));
            await expect(
                axiosInstance.get("/maybe-missing", { suppressNotFoundLog: true }),
            ).rejects.toBeTruthy();
            expect(logger.error).not.toHaveBeenCalled();
        });

        it("does not dispatch a status banner for a status with no mapped message (e.g. 404)", async () => {
            server.use(http.get(`${BASE}/missing`, () => new HttpResponse(null, { status: 404 })));
            await expect(axiosInstance.get("/missing")).rejects.toBeTruthy();
            expect(store.dispatch).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: "ui/setGlobalError" }),
            );
        });

        it("treats a network error (no response at all) as retryable for GET", async () => {
            let attempt = 0;
            server.use(
                http.get(`${BASE}/network-flaky`, () => {
                    attempt += 1;
                    if (attempt === 1) return HttpResponse.error();
                    return HttpResponse.json({ success: true, data: { ok: true } });
                }),
            );

            vi.useFakeTimers({ shouldAdvanceTime: true });
            const promise = axiosInstance.get("/network-flaky");
            await vi.advanceTimersByTimeAsync(500);
            const res = await promise;

            expect(attempt).toBe(2);
            expect(res.data).toEqual({ ok: true });
        });

        it("when already retried once (_retry true), a second 401 falls through and rejects without looping", async () => {
            const responseErrorHandler = axiosInstance.interceptors.response.handlers[0].rejected;
            const error = {
                response: { status: 401 },
                config: {
                    method: "get",
                    url: "/protected",
                    headers: { "X-Request-Id": "test-id" },
                    _retry: true,
                },
            };
            await expect(responseErrorHandler(error)).rejects.toBe(error);
        });

        it("does not treat a POST network error as retryable", async () => {
            let attempt = 0;
            server.use(
                http.post(`${BASE}/network-flaky`, () => {
                    attempt += 1;
                    return HttpResponse.error();
                }),
            );
            await expect(axiosInstance.post("/network-flaky")).rejects.toBeTruthy();
            expect(attempt).toBe(1);
        });

        it("does not log or bypass refresh for a 401 on /auth/register", async () => {
            server.use(http.post(`${BASE}/auth/register`, () => new HttpResponse(null, { status: 401 })));
            await expect(axiosInstance.post("/auth/register")).rejects.toBeTruthy();
            expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    it("falls back to Date.now()-based id when crypto.randomUUID is unavailable", async () => {
        const originalCrypto = globalThis.crypto;
        // Simulate an environment without crypto.randomUUID
        vi.stubGlobal("crypto", { ...originalCrypto, randomUUID: undefined });

        let receivedId;
        server.use(
            http.get(`${BASE}/ping`, ({ request }) => {
                receivedId = request.headers.get("x-request-id");
                return HttpResponse.json({ ok: true });
            }),
        );

        await axiosInstance.get("/ping");
        expect(receivedId).toMatch(/^\d+-[a-z0-9]+$/);

        vi.stubGlobal("crypto", originalCrypto);
    });

    it("does not overwrite an explicitly set Content-Type header", async () => {
        let contentType;
        server.use(
            http.post(`${BASE}/ping`, ({ request }) => {
                contentType = request.headers.get("content-type");
                return HttpResponse.json({ ok: true });
            }),
        );

        await axiosInstance.post("/ping", { a: 1 }, {
            headers: { "Content-Type": "application/vnd.custom+json" },
        });
        expect(contentType).toContain("application/vnd.custom+json");
    });

    it("treats a 502 Bad Gateway on GET as retryable", async () => {
        let attempt = 0;
        server.use(
            http.get(`${BASE}/flaky-502`, () => {
                attempt += 1;
                if (attempt === 1) return new HttpResponse(null, { status: 502 });
                return HttpResponse.json({ success: true, data: { ok: true } });
            }),
        );

        vi.useFakeTimers({ shouldAdvanceTime: true });
        const promise = axiosInstance.get("/flaky-502");
        await vi.advanceTimersByTimeAsync(500);
        const res = await promise;

        expect(attempt).toBe(2);
        expect(res.data).toEqual({ ok: true });
    });
    it("treats a fully absent crypto global as falling back to Date.now()-based id", async () => {
        const originalCrypto = globalThis.crypto;
        // @ts-expect-error simulating an environment with no crypto object at all
        delete globalThis.crypto;

        let receivedId;
        server.use(
            http.get(`${BASE}/ping`, ({ request }) => {
                receivedId = request.headers.get("x-request-id");
                return HttpResponse.json({ ok: true });
            }),
        );

        await axiosInstance.get("/ping");
        expect(receivedId).toMatch(/^\d+-[a-z0-9]+$/);

        globalThis.crypto = originalCrypto;
    });

    it("passes through a literal null response body without treating it as malformed", async () => {
        server.use(http.get(`${BASE}/thing`, () => HttpResponse.json(null)));
        const res = await axiosInstance.get("/thing");
        expect(res.data).toBeNull();
    });

    it("treats a non-204 response with an empty string body as valid (isEmptyBody via the string check)", async () => {
        server.use(
            http.get(`${BASE}/thing`, () => new HttpResponse("", { status: 200 })),
        );
        const res = await axiosInstance.get("/thing");
        expect(res.status).toBe(200);
    });
    it("treats a fully absent crypto global as falling back to Date.now()-based id", async () => {
        const originalCrypto = globalThis.crypto;
        // @ts-expect-error simulating an environment with no crypto object at all
        delete globalThis.crypto;

        let receivedId;
        server.use(
            http.get(`${BASE}/ping`, ({ request }) => {
                receivedId = request.headers.get("x-request-id");
                return HttpResponse.json({ ok: true });
            }),
        );

        await axiosInstance.get("/ping");
        expect(receivedId).toMatch(/^\d+-[a-z0-9]+$/);

        globalThis.crypto = originalCrypto;
    });

    it("passes through a literal null response body without treating it as malformed", async () => {
        server.use(http.get(`${BASE}/thing`, () => HttpResponse.json(null)));
        const res = await axiosInstance.get("/thing");
        expect(res.data).toBeNull();
    });

    it("treats a non-204 response with an empty string body as valid (isEmptyBody via the string check)", async () => {
        server.use(
            http.get(`${BASE}/thing`, () => new HttpResponse("", { status: 200 })),
        );
        const res = await axiosInstance.get("/thing");
        expect(res.status).toBe(200);
    });
    // ── 401 handling: refresh-and-retry flow ────────────────────
    describe("401 refresh-and-retry flow", () => {
        it("on a 401, calls /auth/refresh once, then retries the original request with the new token", async () => {
            store = makeFakeStore("expired-token");
            injectStore(store);

            let protectedCallCount = 0;
            let lastAuthHeader;
            server.use(
                http.get(`${BASE}/protected`, ({ request }) => {
                    protectedCallCount += 1;
                    lastAuthHeader = request.headers.get("authorization");
                    if (protectedCallCount === 1) return new HttpResponse(null, { status: 401 });
                    return HttpResponse.json({ success: true, data: { secret: 42 } });
                }),
                http.post(`${BASE}/auth/refresh`, () =>
                    HttpResponse.json({ success: true, data: { accessToken: "fresh-token" } }),
                ),
            );

            const res = await axiosInstance.get("/protected");

            expect(protectedCallCount).toBe(2);
            expect(lastAuthHeader).toBe("Bearer fresh-token");
            expect(res.data).toEqual({ secret: 42 });
            expect(store.dispatch).toHaveBeenCalledWith({ type: "auth/setToken", payload: "fresh-token" });
        });

        it("logs out and rejects if the refresh call itself fails", async () => {
            server.use(
                http.get(`${BASE}/protected`, () => new HttpResponse(null, { status: 401 })),
                http.post(`${BASE}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
            );

            await expect(axiosInstance.get("/protected")).rejects.toBeTruthy();
            expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function)); // logoutUser()
        });

        it("queues concurrent 401s behind a single in-flight refresh call", async () => {
            store = makeFakeStore("expired-token");
            injectStore(store);

            let refreshCallCount = 0;
            server.use(
                http.get(`${BASE}/protected`, () => {
                    if (refreshCallCount === 0) return new HttpResponse(null, { status: 401 });
                    return HttpResponse.json({ success: true, data: { ok: true } });
                }),
                http.post(`${BASE}/auth/refresh`, async () => {
                    refreshCallCount += 1;
                    return HttpResponse.json({ success: true, data: { accessToken: "fresh-token" } });
                }),
            );

            const [r1, r2, r3] = await Promise.all([
                axiosInstance.get("/protected"),
                axiosInstance.get("/protected"),
                axiosInstance.get("/protected"),
            ]);

            expect(refreshCallCount).toBe(1); 
            expect([r1.data, r2.data, r3.data]).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
        });
    });
});