// src/test/components/mentor/dashboard/availability/IntegrationsSection.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IntegrationsSection from "../../../../../features/mentor/view/components/dashboard/availability/IntegrationsSection";

const { mockGetGoogleCalendarAuthUrl, mockGetGoogleCalendarStatus, mockDisconnectGoogleCalendar, mockLoggerError } =
    vi.hoisted(() => ({
        mockGetGoogleCalendarAuthUrl: vi.fn(),
        mockGetGoogleCalendarStatus: vi.fn(),
        mockDisconnectGoogleCalendar: vi.fn(),
        mockLoggerError: vi.fn(),
    }));

vi.mock("../../../../../features/mentor/model/availability.api", () => ({
    getGoogleCalendarAuthUrl: mockGetGoogleCalendarAuthUrl,
    getGoogleCalendarStatus: mockGetGoogleCalendarStatus,
    disconnectGoogleCalendar: mockDisconnectGoogleCalendar,
}));

vi.mock("../../../../../shared/utils/logger", () => ({
    default: { error: mockLoggerError },
}));

describe("IntegrationsSection Component Suite", () => {
    let onConnectionChange;
    let windowOpenSpy;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        onConnectionChange = vi.fn();
        windowOpenSpy = vi.spyOn(window, "open").mockReturnValue({ closed: false });
    });

    afterEach(() => {
        vi.useRealTimers();
        windowOpenSpy.mockRestore();
    });

    const setup = (connected = false) =>
        render(
            <IntegrationsSection
                googleCalendarConnected={connected}
                onConnectionChange={onConnectionChange}
            />,
        );

    it("should render the Integrations heading", () => {
        setup();
        expect(screen.getByText("Integrations")).toBeInTheDocument();
    });

    it("should show a 'Connected' status and Disconnect button when connected", () => {
        setup(true);
        expect(screen.getByText("Connected")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument();
    });

    it("should show a 'Not Connected' status and Connect button when not connected", () => {
        setup(false);
        expect(screen.getByText("Not Connected")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
    });

    it("should open a popup and call onConnectionChange(true) once the popup closes and status confirms connection", async () => {
        mockGetGoogleCalendarAuthUrl.mockResolvedValue({ url: "https://google.com/auth" });
        mockGetGoogleCalendarStatus.mockResolvedValue({ connected: true });
        const popup = { closed: false };
        windowOpenSpy.mockReturnValue(popup);

        setup(false);
        fireEvent.click(screen.getByRole("button", { name: "Connect" }));

        await vi.waitFor(() => expect(mockGetGoogleCalendarAuthUrl).toHaveBeenCalled());
        expect(windowOpenSpy).toHaveBeenCalledWith(
            "https://google.com/auth",
            "gcal_auth",
            "width=500,height=600",
        );

        // simulate the popup closing, then advance the poll interval
        popup.closed = true;
        await vi.advanceTimersByTimeAsync(800);

        await vi.waitFor(() => expect(onConnectionChange).toHaveBeenCalledWith(true));
    });

    it("should log an error and not call onConnectionChange when status reports not connected after popup closes", async () => {
        mockGetGoogleCalendarAuthUrl.mockResolvedValue({ url: "https://google.com/auth" });
        mockGetGoogleCalendarStatus.mockResolvedValue({ connected: false });
        const popup = { closed: false };
        windowOpenSpy.mockReturnValue(popup);

        setup(false);
        fireEvent.click(screen.getByRole("button", { name: "Connect" }));
        await vi.waitFor(() => expect(mockGetGoogleCalendarAuthUrl).toHaveBeenCalled());

        popup.closed = true;
        await vi.advanceTimersByTimeAsync(800);

        await vi.waitFor(() =>
            expect(mockLoggerError).toHaveBeenCalledWith(
                "Google Calendar not connected after popup closed",
            ),
        );
        expect(onConnectionChange).not.toHaveBeenCalledWith(true);
    });

    it("should log an error when the auth URL request fails", async () => {
        mockGetGoogleCalendarAuthUrl.mockRejectedValue(new Error("network fail"));
        setup(false);
        fireEvent.click(screen.getByRole("button", { name: "Connect" }));

        await vi.waitFor(() =>
            expect(mockLoggerError).toHaveBeenCalledWith(
                "Google Calendar connect failed",
                expect.objectContaining({ err: expect.any(Error) }),
            ),
        );
    });

    it("should call disconnectGoogleCalendar and onConnectionChange(false) on disconnect", async () => {
        mockDisconnectGoogleCalendar.mockResolvedValue({});
        setup(true);
        fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));

        await vi.waitFor(() => expect(mockDisconnectGoogleCalendar).toHaveBeenCalled());
        await vi.waitFor(() => expect(onConnectionChange).toHaveBeenCalledWith(false));
    });

    it("should log an error when disconnect fails", async () => {
        mockDisconnectGoogleCalendar.mockRejectedValue(new Error("disconnect fail"));
        setup(true);
        fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));

        await vi.waitFor(() =>
            expect(mockLoggerError).toHaveBeenCalledWith(
                "Google Calendar disconnect failed",
                expect.objectContaining({ err: expect.any(Error) }),
            ),
        );
        expect(onConnectionChange).not.toHaveBeenCalled();
    });
    it("should disable the connect button and show 'Connecting...' while loading", async () => {
        let resolveAuth;
        mockGetGoogleCalendarAuthUrl.mockReturnValue(
            new Promise((res) => { resolveAuth = res; }),
        );
        setup(false);
        fireEvent.click(screen.getByRole("button", { name: "Connect" }));

        resolveAuth({ url: "https://google.com/auth" });
        await vi.advanceTimersByTimeAsync(0);

        expect(screen.getByRole("button", { name: "Connecting..." })).toBeDisabled();
    });
});