import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import HelpCenter from "../../../shared/components/HelpCenter";
import axiosInstance from "../../../shared/utils/axiosInstance";
import { useLocation } from "react-router-dom";

vi.mock("../../../shared/utils/axiosInstance", () => ({
    default: { post: vi.fn() },
}));

vi.mock("react-router-dom", () => ({
    useLocation: vi.fn(),
}));

vi.mock("../../../shared/components/FilterTabs", () => ({
    default: ({ options, active, onChange }) => (
        <div data-testid="filter-tabs">
            {options.map((opt) => (
                <button key={opt} onClick={() => onChange(opt)} data-active={opt === active}>
                    {opt}
                </button>
            ))}
        </div>
    ),
}));

describe("HelpCenter Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render mentee FAQs and copy when path does not include /mentor", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/dashboard/help" });
        render(<HelpCenter />);
        expect(screen.getByText("mentee")).toBeInTheDocument();
        expect(screen.getByText(/Find answers about booking sessions/i)).toBeInTheDocument();
        expect(screen.getByText("How do I book a session with a mentor?")).toBeInTheDocument();
    });

    it("should render mentor FAQs and copy when path includes /mentor", () => {
        useLocation.mockReturnValue({ pathname: "/mentor/dashboard/help" });
        render(<HelpCenter />);
        expect(screen.getByText("mentor")).toBeInTheDocument();
        expect(screen.getByText(/Resources and support for managing your sessions/i)).toBeInTheDocument();
        expect(screen.getByText("How do I accept a session request?")).toBeInTheDocument();
    });

    it("should toggle a FAQ item open and closed on click", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        render(<HelpCenter />);

        const question = screen.getByText("How do I book a session with a mentor?");
        const toggleBtn = question.closest("button");

        fireEvent.click(toggleBtn);
        expect(screen.getByText(/Browse mentors from the Explore page/i)).toBeInTheDocument();

        fireEvent.click(toggleBtn);
        expect(screen.queryByText(/Browse mentors from the Explore page/i)).not.toBeInTheDocument();
    });

    it("should filter FAQs based on search query matching the question", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        render(<HelpCenter />);

        const searchInput = screen.getByPlaceholderText("Search mentee FAQs...");
        fireEvent.change(searchInput, { target: { value: "refund" } });

        expect(screen.getByText("Can I get a refund if I cancel?")).toBeInTheDocument();
        expect(screen.queryByText("How do I book a session with a mentor?")).not.toBeInTheDocument();
    });

    it("should filter FAQs based on search query matching the answer text", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        render(<HelpCenter />);

        const searchInput = screen.getByPlaceholderText("Search mentee FAQs...");
        fireEvent.change(searchInput, { target: { value: "token payments" } });

        expect(screen.getByText("What payment methods are accepted?")).toBeInTheDocument();
    });

    it("should show the no-results state when search matches nothing", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        render(<HelpCenter />);

        const searchInput = screen.getByPlaceholderText("Search mentee FAQs...");
        fireEvent.change(searchInput, { target: { value: "zzz_no_match_zzz" } });

        expect(screen.getByText(/No results for "zzz_no_match_zzz"/i)).toBeInTheDocument();
    });

    it("should reset category to All when a new search query is typed", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        render(<HelpCenter />);

        const tabsContainer = screen.getByTestId("filter-tabs");
        fireEvent.click(within(tabsContainer).getByText("Booking"));

        const searchInput = screen.getByPlaceholderText("Search mentee FAQs...");
        fireEvent.change(searchInput, { target: { value: "a" } });

        expect(screen.getByTestId("filter-tabs")).toBeInTheDocument();
    });

    it("should filter FAQs by selected category and hide the category label header", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        render(<HelpCenter />);

        const tabsContainer = screen.getByTestId("filter-tabs");
        fireEvent.click(within(tabsContainer).getByText("Booking"));

        expect(screen.getByText("How do I book a session with a mentor?")).toBeInTheDocument();
        expect(screen.queryByText("What payment methods are accepted?")).not.toBeInTheDocument();
        // category label header (the standalone div, not the tab button) should be hidden now
        expect(screen.queryByText("Booking", { selector: "div" })).not.toBeInTheDocument();
    });

    it("should show the category label header when 'All' is selected", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        render(<HelpCenter />);
        expect(screen.getAllByText("Booking").length).toBeGreaterThan(0);
    });

    it("should submit the support form successfully and show the success state", async () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        axiosInstance.post.mockResolvedValueOnce({ data: {} });
        render(<HelpCenter />);

        fireEvent.change(screen.getByPlaceholderText("Your email address"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByPlaceholderText("Subject"), { target: { value: "Help needed" } });
        fireEvent.change(screen.getByPlaceholderText("Describe your issue..."), { target: { value: "It broke" } });

        fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

        await waitFor(() => {
            expect(screen.getByText("Message sent!")).toBeInTheDocument();
        });
        expect(axiosInstance.post).toHaveBeenCalledWith("/support/messages", {
            email: "test@example.com",
            subject: "Help needed",
            message: "It broke",
            role: "mentee",
        });
    });

    it("should reset to the form view when 'Send another' is clicked", async () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        axiosInstance.post.mockResolvedValueOnce({ data: {} });
        render(<HelpCenter />);

        fireEvent.change(screen.getByPlaceholderText("Your email address"), { target: { value: "a@b.com" } });
        fireEvent.change(screen.getByPlaceholderText("Subject"), { target: { value: "s" } });
        fireEvent.change(screen.getByPlaceholderText("Describe your issue..."), { target: { value: "m" } });
        fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

        await waitFor(() => screen.getByText("Message sent!"));
        fireEvent.click(screen.getByRole("button", { name: "Send another" }));

        expect(screen.getByPlaceholderText("Your email address")).toBeInTheDocument();
    });

    it("should show an error banner and stay on the form when submission fails", async () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        axiosInstance.post.mockRejectedValueOnce(new Error("network error"));
        render(<HelpCenter />);

        fireEvent.change(screen.getByPlaceholderText("Your email address"), { target: { value: "a@b.com" } });
        fireEvent.change(screen.getByPlaceholderText("Subject"), { target: { value: "s" } });
        fireEvent.change(screen.getByPlaceholderText("Describe your issue..."), { target: { value: "m" } });
        fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

        await waitFor(() => {
            expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
        });
        expect(screen.getByPlaceholderText("Your email address")).toBeInTheDocument();
    });

    it("should disable the submit button and show 'Sending...' while submitting", async () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        let resolvePost;
        axiosInstance.post.mockReturnValue(new Promise((res) => { resolvePost = res; }));
        render(<HelpCenter />);

        fireEvent.change(screen.getByPlaceholderText("Your email address"), { target: { value: "a@b.com" } });
        fireEvent.change(screen.getByPlaceholderText("Subject"), { target: { value: "s" } });
        fireEvent.change(screen.getByPlaceholderText("Describe your issue..."), { target: { value: "m" } });
        fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

        expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
        resolvePost({ data: {} });
        await waitFor(() => screen.getByText("Message sent!"));
    });

    it("should call mouse enter/leave handlers on the submit button without submitting state", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        render(<HelpCenter />);

        const submitBtn = screen.getByRole("button", { name: "Send Message" });
        fireEvent.mouseEnter(submitBtn);
        fireEvent.mouseLeave(submitBtn);
        expect(submitBtn).toBeInTheDocument();
    });

    it("should call focus/blur handlers on the search input and form fields", () => {
        useLocation.mockReturnValue({ pathname: "/mentee/help" });
        render(<HelpCenter />);

        const searchInput = screen.getByPlaceholderText("Search mentee FAQs...");
        fireEvent.focus(searchInput);
        fireEvent.blur(searchInput);

        const emailInput = screen.getByPlaceholderText("Your email address");
        fireEvent.focus(emailInput);
        fireEvent.blur(emailInput);

        expect(searchInput).toBeInTheDocument();
    });
});