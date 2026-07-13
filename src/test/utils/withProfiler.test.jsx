import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { withProfiler } from "../../utils/withProfiler";

const Greeting = ({ name }) => <div>Hello, {name}</div>;

describe("withProfiler", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the wrapped component with its props passed through", () => {
        const ProfiledGreeting = withProfiler(Greeting, "Greeting");
        render(<ProfiledGreeting name="Shama" />);
        expect(screen.getByText("Hello, Shama")).toBeInTheDocument();
    });

    it("does not throw when the component re-renders (triggers onRender callback)", () => {
        const ProfiledGreeting = withProfiler(Greeting, "Greeting");
        const { rerender } = render(<ProfiledGreeting name="Shama" />);
        expect(() => rerender(<ProfiledGreeting name="Ravi" />)).not.toThrow();
        expect(screen.getByText("Hello, Ravi")).toBeInTheDocument();
    });
    it("does not call console.log when not in DEV mode", () => {
        vi.stubEnv("DEV", false);
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => { });
        const ProfiledGreeting = withProfiler(Greeting, "Greeting");
        render(<ProfiledGreeting name="Shama" />);
        expect(logSpy).not.toHaveBeenCalled();
        vi.unstubAllEnvs();
    });
});