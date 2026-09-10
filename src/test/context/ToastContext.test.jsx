// src/test/context/ToastContext.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "../../shared/context/ToastContext";

const ThrowingConsumer = () => {
    useToast();
    return null;
};

const ToastTrigger = ({ toast }) => {
    const { showToast } = useToast();
    return <button onClick={() => showToast(toast)}>fire</button>;
};

describe("ToastContext", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("useToast throws when used outside a ToastProvider", () => {
        expect(() => render(<ThrowingConsumer />)).toThrow(
            "useToast must be used within ToastProvider",
        );
    });

    it("renders children and an initially-empty toast container", () => {
        render(
            <ToastProvider>
                <div>child content</div>
            </ToastProvider>,
        );
        expect(screen.getByText("child content")).toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("showToast defaults to type=success and renders title + message", () => {
        render(
            <ToastProvider>
                <ToastTrigger toast={{ title: "Saved", message: "Your changes were saved." }} />
            </ToastProvider>,
        );

        act(() => {
            fireEvent.click(screen.getByText("fire"));
        });

        expect(screen.getByText("Saved")).toBeInTheDocument();
        expect(screen.getByText("Your changes were saved.")).toBeInTheDocument();
    });

    it("renders only the message when title is omitted, and only the title when message is omitted", () => {
        render(
            <ToastProvider>
                <ToastTrigger toast={{ message: "message-only" }} />
                <ToastTrigger toast={{ title: "title-only" }} />
            </ToastProvider>,
        );
        const [fireMessageOnly, fireTitleOnly] = screen.getAllByText("fire");

        act(() => fireEvent.click(fireMessageOnly));
        expect(screen.getByText("message-only")).toBeInTheDocument();
        expect(screen.queryByText("title-only")).not.toBeInTheDocument();

        act(() => fireEvent.click(fireTitleOnly));
        expect(screen.getByText("title-only")).toBeInTheDocument();
    });

    it.each(["success", "error", "info", "warning"])(
        "renders the %s toast style without throwing",
        (type) => {
            render(
                <ToastProvider>
                    <ToastTrigger toast={{ type, title: type, message: `${type}-msg` }} />
                </ToastProvider>,
            );
            act(() => {
                fireEvent.click(screen.getByText("fire"));
            });
            expect(screen.getByText(type)).toBeInTheDocument();
        },
    );

    it("falls back to the info style for an unrecognized toast type", () => {
        render(
            <ToastProvider>
                <ToastTrigger toast={{ type: "not-a-real-type", title: "Mystery" }} />
            </ToastProvider>,
        );
        act(() => {
            fireEvent.click(screen.getByText("fire"));
        });
        expect(screen.getByText("Mystery")).toBeInTheDocument();
    });

    it("auto-removes a toast after 3000ms", () => {
        render(
            <ToastProvider>
                <ToastTrigger toast={{ title: "Bye soon" }} />
            </ToastProvider>,
        );
        act(() => {
            fireEvent.click(screen.getByText("fire"));
        });
        expect(screen.getByText("Bye soon")).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(screen.queryByText("Bye soon")).not.toBeInTheDocument();
    });

    it("removes a toast immediately when its close button is clicked", () => {
        render(
            <ToastProvider>
                <ToastTrigger toast={{ title: "Close me" }} />
            </ToastProvider>,
        );
        act(() => {
            fireEvent.click(screen.getByText("fire"));
        });
        expect(screen.getByText("Close me")).toBeInTheDocument();

        // Two buttons now exist: "fire" and the toast's close button.
        const closeButton = screen.getAllByRole("button").find((b) => b.textContent !== "fire");
        act(() => {
            fireEvent.click(closeButton);
        });

        expect(screen.queryByText("Close me")).not.toBeInTheDocument();
    });

    it("supports multiple simultaneous toasts, each removable independently", () => {
        render(
            <ToastProvider>
                <ToastTrigger toast={{ title: "First" }} />
                <ToastTrigger toast={{ title: "Second" }} />
            </ToastProvider>,
        );
        const [fireFirst, fireSecond] = screen.getAllByText("fire");

        act(() => fireEvent.click(fireFirst));
        act(() => fireEvent.click(fireSecond));

        expect(screen.getByText("First")).toBeInTheDocument();
        expect(screen.getByText("Second")).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.queryByText("First")).not.toBeInTheDocument();
        expect(screen.queryByText("Second")).not.toBeInTheDocument();
    });
});