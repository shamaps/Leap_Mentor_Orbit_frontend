// src/test/components/shared-dashboard/SharedSidebar.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import SharedSidebar from "../../../components/shared-dashboard/SharedSidebar";

describe("SharedSidebar", () => {
    beforeEach(() => {
        document.body.style.overflow = "";
    });

    it("renders nav items for a mentee viewer, including Add Session", () => {
        render(
            <SharedSidebar
                activeTab="overview"
                setActiveTab={vi.fn()}
                isOpen={false}
                onClose={vi.fn()}
                viewerRole="mentee"
            />,
        );
        expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Chat").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Goals").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Notes").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Add Session").length).toBeGreaterThan(0);
    });

    it("hides the Add Session nav item for a mentor viewer", () => {
        render(
            <SharedSidebar
                activeTab="overview"
                setActiveTab={vi.fn()}
                isOpen={false}
                onClose={vi.fn()}
                viewerRole="mentor"
            />,
        );
        expect(screen.queryByText("Add Session")).not.toBeInTheDocument();
        expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    });

    it("calls setActiveTab and onClose when a mobile drawer nav item is clicked (onClose wired)", () => {
        const setActiveTab = vi.fn();
        const onClose = vi.fn();
        render(
            <SharedSidebar
                activeTab="overview"
                setActiveTab={setActiveTab}
                isOpen={false}
                onClose={onClose}
                viewerRole="mentee"
            />,
        );
        // Desktop <SidebarContent> renders first (no onClose prop), mobile drawer's
        // <SidebarContent> renders second (has onClose prop). Use index [1].
        const chatButtons = screen.getAllByText("Chat");
        act(() => {
            chatButtons[1].closest("button").click();
        });
        expect(setActiveTab).toHaveBeenCalledWith("chat");
        expect(onClose).toHaveBeenCalled();
    });

    it("does not throw when the desktop-content instance's onClose is undefined (optional chaining)", () => {
        // The desktop <SidebarContent> is rendered without an onClose prop,
        // so clicking its nav item exercises the `onClose?.()` no-op path.
        const setActiveTab = vi.fn();
        render(
            <SharedSidebar
                activeTab="overview"
                setActiveTab={setActiveTab}
                isOpen={false}
                onClose={vi.fn()}
                viewerRole="mentee"
            />,
        );
        // Desktop nav renders first in the DOM; grab its "Goals" button explicitly.
        const goalsButtons = screen.getAllByText("Goals");
        expect(() => {
            act(() => {
                goalsButtons[0].closest("button").click();
            });
        }).not.toThrow();
        expect(setActiveTab).toHaveBeenCalledWith("goals");
    });

    it("marks the active nav item and renders its accent bar / active icon styling", () => {
        render(
            <SharedSidebar
                activeTab="goals"
                setActiveTab={vi.fn()}
                isOpen={false}
                onClose={vi.fn()}
                viewerRole="mentee"
            />,
        );
        const goalsButtons = screen.getAllByText("Goals");
        const activeButton = goalsButtons[0].closest("button");
        expect(activeButton).toHaveStyle({ fontWeight: "700" });
    });

    it("renders inactive nav items with inactive styling", () => {
        render(
            <SharedSidebar
                activeTab="goals"
                setActiveTab={vi.fn()}
                isOpen={false}
                onClose={vi.fn()}
                viewerRole="mentee"
            />,
        );
        const overviewButtons = screen.getAllByText("Overview");
        const inactiveButton = overviewButtons[0].closest("button");
        expect(inactiveButton).toHaveStyle({ fontWeight: "500" });
    });

    it("sets document.body.style.overflow to 'hidden' when isOpen is true", () => {
        render(
            <SharedSidebar
                activeTab="overview"
                setActiveTab={vi.fn()}
                isOpen={true}
                onClose={vi.fn()}
                viewerRole="mentee"
            />,
        );
        expect(document.body.style.overflow).toBe("hidden");
    });

    it("resets document.body.style.overflow to '' when isOpen is false", () => {
        render(
            <SharedSidebar
                activeTab="overview"
                setActiveTab={vi.fn()}
                isOpen={false}
                onClose={vi.fn()}
                viewerRole="mentee"
            />,
        );
        expect(document.body.style.overflow).toBe("");
    });

    it("resets document.body.style.overflow on unmount (cleanup)", () => {
        const { unmount } = render(
            <SharedSidebar
                activeTab="overview"
                setActiveTab={vi.fn()}
                isOpen={true}
                onClose={vi.fn()}
                viewerRole="mentee"
            />,
        );
        expect(document.body.style.overflow).toBe("hidden");
        unmount();
        expect(document.body.style.overflow).toBe("");
    });

    it("calls onClose when the mobile backdrop is clicked", () => {
        const onClose = vi.fn();
        render(
            <SharedSidebar
                activeTab="overview"
                setActiveTab={vi.fn()}
                isOpen={true}
                onClose={onClose}
                viewerRole="mentee"
            />,
        );
        act(() => {
            screen.getByLabelText("Close sidebar").click();
        });
        expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when the mobile drawer's close (X) button is clicked", () => {
        const onClose = vi.fn();
        render(
            <SharedSidebar
                activeTab="overview"
                setActiveTab={vi.fn()}
                isOpen={true}
                onClose={onClose}
                viewerRole="mentee"
            />,
        );
        // The X button has no accessible name/text, so find it via the backdrop's
        // sibling structure: query all buttons and pick the one that isn't the
        // backdrop or a nav item (it has no text content).
        const allButtons = screen.getAllByRole("button");
        const closeIconButton = allButtons.find(
            (btn) => btn.textContent === "" && btn.getAttribute("aria-label") !== "Close sidebar",
        );
        expect(closeIconButton).toBeTruthy();
        act(() => {
            closeIconButton.click();
        });
        expect(onClose).toHaveBeenCalled();
    });

    it("renders both desktop and mobile nav instances (content duplicated across breakpoints)", () => {
        render(
            <SharedSidebar
                activeTab="notes"
                setActiveTab={vi.fn()}
                isOpen={true}
                onClose={vi.fn()}
                viewerRole="mentee"
            />,
        );
        // "Notes" appears once in desktop nav and once in mobile drawer nav.
        expect(screen.getAllByText("Notes")).toHaveLength(2);
    });
});