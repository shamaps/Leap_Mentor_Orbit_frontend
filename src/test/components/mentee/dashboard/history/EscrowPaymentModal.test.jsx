// src/test/components/mentee/dashboard/history/EscrowPaymentModal.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import EscrowPaymentModal from "../../../../../components/mentee/dashboard/history/EscrowPaymentModal";
import { payEscrow, getEscrowStatus } from "../../../../../api/escrow.api";

vi.mock("../../../../../api/escrow.api", () => ({
    payEscrow: vi.fn(),
    getEscrowStatus: vi.fn(),
}));

vi.mock("../../../../../utils/logger", () => ({
    default: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("../../../../../components/mentee/dashboard/history/EscrowSuccessModal", () => ({
    default: ({ totalAmount, mentorName, onDone }) => (
        <div data-testid="mock-escrow-success">
            <span>{totalAmount}</span>
            <span>{mentorName}</span>
            <button onClick={onDone}>Done</button>
        </div>
    ),
}));

describe("EscrowPaymentModal Component Suite", () => {
    const mockClose = vi.fn();
    const mockSuccess = vi.fn();

    const baseRequest = {
        _id: "req-1",
        selectedSlots: [{ startTime: "10:00", endTime: "11:00" }],
        mentorProfile: { hourlyRate: 50 },
        mentor: { name: "Dana Scott" },
        confirmedSlot: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        getEscrowStatus.mockResolvedValue({ wallet: { balance: 500 }, commissionRate: 20 });
    });

    it("should show a loading indicator for wallet balance while fetching status", () => {
        getEscrowStatus.mockReturnValue(new Promise(() => { })); // never resolves
        render(<EscrowPaymentModal request={baseRequest} onClose={mockClose} onSuccess={mockSuccess} />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should display fetched wallet balance and commission rate once loaded", async () => {
        render(<EscrowPaymentModal request={baseRequest} onClose={mockClose} onSuccess={mockSuccess} />);

        await waitFor(() => {
            expect(screen.getByText("500 tokens")).toBeInTheDocument();
        });
        expect(screen.getByText("(20%)")).toBeInTheDocument();
    });

    it("should compute mentor amount, platform fee, and total correctly", async () => {
        render(<EscrowPaymentModal request={baseRequest} onClose={mockClose} onSuccess={mockSuccess} />);
        await waitFor(() => screen.getByText("500 tokens"));

        expect(screen.getAllByText("50 tokens")).toHaveLength(2); // mentor amount + mentor receives
        expect(screen.getByText("+ 10 tokens")).toBeInTheDocument();
        expect(screen.getByText(/60 tokens/)).toBeInTheDocument();
    });
    
    it("should show an insufficient balance warning and disable pay when balance is too low", async () => {
        getEscrowStatus.mockResolvedValue({ wallet: { balance: 10 }, commissionRate: 20 });
        render(<EscrowPaymentModal request={baseRequest} onClose={mockClose} onSuccess={mockSuccess} />);

        await waitFor(() => {
            expect(screen.getByText(/You need \d+ more tokens\./)).toBeInTheDocument();
        });
        expect(screen.getByRole("button", { name: /Confirm & Pay/i })).toBeDisabled();
    });

    it("should show an error and not call payEscrow if mentor has no session rate", async () => {
        const noRateRequest = { ...baseRequest, mentorProfile: { hourlyRate: 0 } };
        render(<EscrowPaymentModal request={noRateRequest} onClose={mockClose} onSuccess={mockSuccess} />);

        await waitFor(() => screen.getByText("500 tokens"));
        expect(screen.getByRole("button", { name: /Confirm & Pay/i })).toBeDisabled();
    });

    it("should call payEscrow and show the success modal on successful payment", async () => {
        payEscrow.mockResolvedValueOnce({ success: true });
        render(<EscrowPaymentModal request={baseRequest} onClose={mockClose} onSuccess={mockSuccess} />);

        await waitFor(() => screen.getByText("500 tokens"));

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /Confirm & Pay/i }));
        });

        expect(payEscrow).toHaveBeenCalledWith({
            connectRequestId: "req-1",
            sessionRate: 50,
            sessionCount: 1,
        });
        expect(screen.getByTestId("mock-escrow-success")).toBeInTheDocument();
    });

    it("should surface a payment error message when payEscrow rejects", async () => {
        payEscrow.mockRejectedValueOnce({ response: { data: { message: "Insufficient funds" } } });
        render(<EscrowPaymentModal request={baseRequest} onClose={mockClose} onSuccess={mockSuccess} />);

        await waitFor(() => screen.getByText("500 tokens"));

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /Confirm & Pay/i }));
        });

        expect(screen.getByText("Insufficient funds")).toBeInTheDocument();
    });

    it("should call onSuccess with the patch and onClose when the success modal is dismissed", async () => {
        payEscrow.mockResolvedValueOnce({ success: true });
        render(<EscrowPaymentModal request={baseRequest} onClose={mockClose} onSuccess={mockSuccess} />);

        await waitFor(() => screen.getByText("500 tokens"));
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /Confirm & Pay/i }));
        });

        fireEvent.click(screen.getByRole("button", { name: "Done" }));

        expect(mockSuccess).toHaveBeenCalledWith(
            expect.objectContaining({ status: "ongoing", paymentStatus: "paid" })
        );
        expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose directly when the Cancel button is clicked", async () => {
        render(<EscrowPaymentModal request={baseRequest} onClose={mockClose} onSuccess={mockSuccess} />);
        await waitFor(() => screen.getByText("500 tokens"));

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it("should render confirmed slot date/time rows when confirmedSlot is present", async () => {
        const requestWithSlot = {
            ...baseRequest,
            confirmedSlot: { day: "Monday", date: "2026-08-17", startTime: "10:00", endTime: "11:00" },
        };
        render(<EscrowPaymentModal request={requestWithSlot} onClose={mockClose} onSuccess={mockSuccess} />);
        await waitFor(() => screen.getByText("500 tokens"));

        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByText("Time")).toBeInTheDocument();
    });
});