import "@testing-library/jest-dom";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mswServer";
import { injectStore } from "../utils/axiosInstance";

injectStore({
    getState: () => ({ auth: { token: null } }),
    dispatch: () => { },
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());