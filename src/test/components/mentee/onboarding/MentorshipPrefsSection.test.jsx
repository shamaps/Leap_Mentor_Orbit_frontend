// components/mentee/onboarding/MentorshipPrefsSection.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MentorshipPrefsSection from "../../../../components/mentee/onboarding/MentorshipPrefsSection";

const mockUseMenteeOnboardingForm = vi.fn();
vi.mock("../../../../context/MenteeOnboardingFormContext", () => ({
    useMenteeOnboardingForm: (...args) => mockUseMenteeOnboardingForm(...args),
}));

vi.mock("../../../../constants/mentorshipPrefs", () => ({
    COMM_OPTIONS: [
        { value: "email", label: "Email", icon: "📧" },
        { value: "call", label: "Call", icon: "📞" },
    ],
    LANGUAGE_OPTIONS: ["English", "Hindi", "Tamil"],
}));

vi.mock("../../../../common/PrefsCardHeader", () => ({
    default: ({ variant }) => <div data-testid="prefs-header">{variant}</div>,
}));

const setup = (overrides = {}) => {
    const ctx = {
        form: { communicationPreferences: [], languages: [] },
        handleChange: vi.fn(),
        ...overrides,
    };
    mockUseMenteeOnboardingForm.mockReturnValue(ctx);
    return ctx;
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("MentorshipPrefsSection", () => {
    it("renders the header and all communication options", () => {
        setup();
        render(<MentorshipPrefsSection />);
        expect(screen.getByText("Mentorship Preferences")).toBeInTheDocument();
        expect(screen.getByText(/Email/)).toBeInTheDocument();
        expect(screen.getByText(/Call/)).toBeInTheDocument();
    });

    it("adds a channel to communicationPreferences when unchecked option is toggled", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        render(<MentorshipPrefsSection />);
        await user.click(screen.getByText(/Email/));
        expect(ctx.handleChange).toHaveBeenCalledWith({
            target: { name: "communicationPreferences", value: ["email"] },
        });
    });

    it("removes a channel when an already-checked option is toggled", async () => {
        const user = userEvent.setup();
        const ctx = setup({ form: { communicationPreferences: ["email"], languages: [] } });
        render(<MentorshipPrefsSection />);
        await user.click(screen.getByText(/Email/));
        expect(ctx.handleChange).toHaveBeenCalledWith({
            target: { name: "communicationPreferences", value: [] },
        });
    });

    it("shows placeholder text when no languages selected, and opens dropdown on click", async () => {
        const user = userEvent.setup();
        setup();
        render(<MentorshipPrefsSection />);
        expect(screen.getByText("Select languages...")).toBeInTheDocument();
        await user.click(screen.getByLabelText("Select known languages"));
        expect(screen.getByText("English")).toBeInTheDocument();
        expect(screen.getByText("Tamil")).toBeInTheDocument();
    });

    it("shows selected count instead of placeholder when languages are selected", () => {
        setup({ form: { communicationPreferences: [], languages: ["English"] } });
        render(<MentorshipPrefsSection />);
        expect(screen.getByText("1 selected")).toBeInTheDocument();
    });

    it("adds a language when selected from the dropdown", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        render(<MentorshipPrefsSection />);
        await user.click(screen.getByLabelText("Select known languages"));
        await user.click(screen.getByText("Hindi"));
        expect(ctx.handleChange).toHaveBeenCalledWith({
            target: { name: "languages", value: ["Hindi"] },
        });
    });

    it("removes a language when an already-selected dropdown option is clicked again", async () => {
        const user = userEvent.setup();
        const ctx = setup({ form: { communicationPreferences: [], languages: ["Hindi"] } });
        render(<MentorshipPrefsSection />);
        await user.click(screen.getByLabelText("Select known languages"));
        // there are now two "Hindi" occurrences: the tag chip and the dropdown option
        const hindiOptions = screen.getAllByText("Hindi");
        await user.click(hindiOptions[hindiOptions.length - 1]);
        expect(ctx.handleChange).toHaveBeenCalledWith({
            target: { name: "languages", value: [] },
        });
    });

    it("removes a language tag via its × button", async () => {
        const user = userEvent.setup();
        const ctx = setup({ form: { communicationPreferences: [], languages: ["English", "Tamil"] } });
        render(<MentorshipPrefsSection />);
        const removeButtons = screen.getAllByText("×");
        await user.click(removeButtons[0]);
        expect(ctx.handleChange).toHaveBeenCalledWith({
            target: { name: "languages", value: ["Tamil"] },
        });
    });

    it("closes the dropdown when clicking outside the container", async () => {
        const user = userEvent.setup();
        setup();
        render(
            <div>
                <div data-testid="outside">outside</div>
                <MentorshipPrefsSection />
            </div>
        );
        await user.click(screen.getByLabelText("Select known languages"));
        expect(screen.getByText("English")).toBeInTheDocument();
        await user.click(screen.getByTestId("outside"));
        expect(screen.queryByText("English")).not.toBeInTheDocument();
    });

    it("toggles dropdown closed when the trigger button is clicked again", async () => {
        const user = userEvent.setup();
        setup();
        render(<MentorshipPrefsSection />);
        const trigger = screen.getByLabelText("Select known languages");
        await user.click(trigger);
        expect(screen.getByText("English")).toBeInTheDocument();
        await user.click(trigger);
        expect(screen.queryByText("English")).not.toBeInTheDocument();
    });
});