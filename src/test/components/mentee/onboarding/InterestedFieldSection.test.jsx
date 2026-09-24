// components/mentee/onboarding/InterestedFieldsSection.test.jsx
import { createRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InterestedFieldsSection from "../../../../features/mentee/view/components/onboarding/InterestedFieldsSection";

const mockUseMenteeOnboardingForm = vi.fn();
vi.mock("../../../../features/mentee/context/MenteeOnboardingFormContext", () => ({
    useMenteeOnboardingForm: (...args) => mockUseMenteeOnboardingForm(...args),
}));

const setup = (overrides = {}) => {
    const ctx = {
        form: { interestedFields: [], skills: [] },
        handleChange: vi.fn(),
        errors: {},
        ...overrides,
    };
    mockUseMenteeOnboardingForm.mockReturnValue(ctx);
    return ctx;
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("InterestedFieldsSection", () => {
    it("renders both tag input labels", () => {
        setup();
        render(<InterestedFieldsSection />);
        expect(screen.getByText("Fields of Interest")).toBeInTheDocument();
        expect(screen.getByText("Skills of Interest")).toBeInTheDocument();
    });

    it("adds a field tag on Enter and clears the input", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        render(<InterestedFieldsSection />);
        const input = screen.getByPlaceholderText("Add fields e.g. AI, Growth, Design...");
        await user.type(input, "AI{Enter}");
        expect(ctx.handleChange).toHaveBeenCalledWith({
            target: { name: "interestedFields", value: ["AI"] },
        });
        expect(input).toHaveValue("");
    });

    it("does not add an empty/whitespace tag", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        render(<InterestedFieldsSection />);
        const input = screen.getByPlaceholderText("Add fields e.g. AI, Growth, Design...");
        await user.type(input, "   {Enter}");
        expect(ctx.handleChange).not.toHaveBeenCalled();
    });

    it("does not add a duplicate tag", async () => {
        const user = userEvent.setup();
        const ctx = setup({ form: { interestedFields: ["AI"], skills: [] } });
        render(<InterestedFieldsSection />);
        const input = screen.getByPlaceholderText("Add fields e.g. AI, Growth, Design...");
        await user.type(input, "AI{Enter}");
        expect(ctx.handleChange).not.toHaveBeenCalled();
    });

    it("adds a tag on blur", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        render(<InterestedFieldsSection />);
        const input = screen.getByPlaceholderText("Add skills e.g. Figma, Python, Leadership...");
        await user.type(input, "Python");
        await user.tab();
        expect(ctx.handleChange).toHaveBeenCalledWith({
            target: { name: "skills", value: ["Python"] },
        });
    });

    it("removes a tag when its remove button is clicked", async () => {
        const user = userEvent.setup();
        const ctx = setup({ form: { interestedFields: ["AI", "Design"], skills: [] } });
        render(<InterestedFieldsSection />);
        const removeButtons = screen.getAllByText("×");
        await user.click(removeButtons[0]);
        expect(ctx.handleChange).toHaveBeenCalledWith({
            target: { name: "interestedFields", value: ["Design"] },
        });
    });

    it("shows field error message when errors.interestedFields is true", () => {
        setup({ errors: { interestedFields: true } });
        render(<InterestedFieldsSection />);
        expect(screen.getByText("Add at least one field of interest.")).toBeInTheDocument();
    });

    it("shows skills error message when errors.skills is true", () => {
        setup({ errors: { skills: true } });
        render(<InterestedFieldsSection />);
        expect(screen.getByText("Add at least one skill of interest.")).toBeInTheDocument();
    });

    it("does not show error messages when there are no errors", () => {
        setup();
        render(<InterestedFieldsSection />);
        expect(screen.queryByText("Add at least one field of interest.")).not.toBeInTheDocument();
        expect(screen.queryByText("Add at least one skill of interest.")).not.toBeInTheDocument();
    });

    it("forwards ref to the outer wrapper with data-field='interestedFields'", () => {
        setup();
        const ref = createRef();
        render(<InterestedFieldsSection ref={ref} />);
        expect(ref.current).not.toBeNull();
        expect(ref.current.getAttribute("data-field")).toBe("interestedFields");
    });

    it("falls back to default empty arrays when form fields are undefined", () => {
        setup({ form: {} });
        render(<InterestedFieldsSection />);
        expect(screen.queryByText("×")).not.toBeInTheDocument();
    });
});