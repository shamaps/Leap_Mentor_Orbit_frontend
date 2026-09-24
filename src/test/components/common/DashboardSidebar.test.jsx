import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import DashboardSidebar from "../../../components/common/DashboardSidebar";

describe("DashboardSidebar Component Suite", () => {
    const mockSetActiveTab = vi.fn();
    const mockOnClose = vi.fn();

    const mockNavItems = [
        { key: "home", label: "Overview Panel", icon: <span data-testid="icon-home" /> },
        { key: "notifications", label: "Alerts Section", icon: <span data-testid="icon-notif" /> },
    ];

    const baseProps = {
        navItems: mockNavItems,
        activeTab: "home",
        setActiveTab: mockSetActiveTab,
        isOpen: false,
        onClose: mockOnClose,
        unreadCount: 0,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.style.overflow = "";
    });

    describe("Desktop Render Layouts", () => {
        it("should render nav items and establish active typography emphasis markers correctly", () => {
            render(<DashboardSidebar {...baseProps} />);

            const overviewButtons = screen.getAllByRole("button", { name: /Overview Panel/i });
            expect(overviewButtons.length).toBeGreaterThan(0);

            // Click the desktop sidebar button option
            fireEvent.click(overviewButtons[0]);
            expect(mockSetActiveTab).toHaveBeenCalledWith("home");
        });
    });

    describe("Notification Badge Overflows Matrix", () => {
        it("should parse normal unread notification values cleanly into counts", () => {
            render(<DashboardSidebar {...baseProps} unreadCount={15} activeTab="notifications" />);

            const badges = screen.getAllByText("15");
            expect(badges.length).toBeGreaterThan(0);
        });

        it("should truncate count indices to a string pattern when unread levels exceed 99 units", () => {
            render(<DashboardSidebar {...baseProps} unreadCount={150} />);

            const capsLabels = screen.getAllByText("99+");
            expect(capsLabels.length).toBeGreaterThan(0);
        });
    });

    describe("Mobile Drawer and Backdrops Interceptions", () => {
        it("should inject layout block masks into document layout when isOpen evaluates to true", () => {
            const { unmount } = render(<DashboardSidebar {...baseProps} isOpen={true} />);
            expect(document.body.style.overflow).toBe("hidden");

            unmount();
            expect(document.body.style.overflow).toBe("");
        });

        it("should execute onClose routines when clicking mobile view backdrops or cross close buttons", () => {
            render(<DashboardSidebar {...baseProps} isOpen={true} />);

            const backdropButton = screen.getByLabelText(/Close sidebar/i);
            fireEvent.click(backdropButton);
            expect(mockOnClose).toHaveBeenCalled();

            const closeCrossBtn = screen.getAllByRole("button").find(b => b.querySelector("svg"));
            fireEvent.click(closeCrossBtn);
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    describe("Help Center Section Triggers", () => {
        it("should call setActiveTab without onClose when clicking desktop help center", () => {
            render(<DashboardSidebar {...baseProps} />);

            const helpCenterBtns = screen.getAllByRole("button", { name: /Help Center/i });
            // Click Desktop instance (no onClose proxy prop mapped)
            fireEvent.click(helpCenterBtns[0]);

            expect(mockSetActiveTab).toHaveBeenCalledWith("help");
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it("should call both setActiveTab and onClose when clicking mobile drawer help center", () => {
            render(<DashboardSidebar {...baseProps} />);

            const helpCenterBtns = screen.getAllByRole("button", { name: /Help Center/i });
            // Click Mobile Drawer instance (where onClose proxy prop maps)
            fireEvent.click(helpCenterBtns[1]);

            expect(mockSetActiveTab).toHaveBeenCalledWith("help");
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});