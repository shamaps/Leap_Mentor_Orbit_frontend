// src/test/hooks/useMountLogger.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMountLogger } from "../../hooks/useMountLogger";

describe("useMountLogger", () => {
    let logSpy;

    beforeEach(() => {
        logSpy = vi.spyOn(console, "log").mockImplementation(() => { });
    });

    afterEach(() => {
        logSpy.mockRestore();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it("logs mount and unmount with elapsed time when DEV is true", () => {
        vi.stubEnv("DEV", true);

        const { unmount } = renderHook(() => useMountLogger("MyComponent"));

        expect(logSpy).toHaveBeenCalledWith("[Mount] MyComponent mounted");

        unmount();

        expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[Unmount\] MyComponent unmounted after \d+\.\d{2}ms$/),
        );
    });

    it("does not log anything when DEV is false", () => {
        vi.stubEnv("DEV", false);

        const { unmount } = renderHook(() => useMountLogger("MyComponent"));
        unmount();

        expect(logSpy).not.toHaveBeenCalled();
    });

    it("re-runs the effect and logs again when componentName changes", () => {
        vi.stubEnv("DEV", true);

        const { rerender } = renderHook(
            ({ name }) => useMountLogger(name),
            { initialProps: { name: "First" } },
        );

        expect(logSpy).toHaveBeenCalledWith("[Mount] First mounted");

        rerender({ name: "Second" });

        expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[Unmount\] First unmounted after \d+\.\d{2}ms$/),
        );
        expect(logSpy).toHaveBeenCalledWith("[Mount] Second mounted");
    });
});