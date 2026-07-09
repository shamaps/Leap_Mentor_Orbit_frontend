import "@testing-library/jest-dom";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mswServer"; // MSW mock server

beforeAll(() => server.listen());       // setup
afterEach(() => { cleanup(); server.resetHandlers(); }) // teardown per test
afterAll(() => server.close());