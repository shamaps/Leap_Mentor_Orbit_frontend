import "@testing-library/jest-dom";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mswServer";

beforeAll(async () => {
    const mod = await import("@/shared/utils/axiosInstance");
    if ("injectStore" in mod) {
        mod.injectStore({
            getState: () => ({ auth: { token: null } }),
            dispatch: () => { },
        });
    }
    server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());