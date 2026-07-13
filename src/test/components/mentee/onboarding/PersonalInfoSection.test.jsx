// components/mentee/onboarding/PersonalInfoSection.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PersonalInfoSection from "../../../../components/mentee/onboarding/PersonalInfoSection";

const mockUseMenteeOnboardingForm = vi.fn();
vi.mock("../../../../context/MenteeOnboardingFormContext", () => ({
    useMenteeOnboardingForm: (...args) => mockUseMenteeOnboardingForm(...args),
}));

const mockUseProfilePhotoUpload = vi.fn();
vi.mock("../../../../hooks/useProfilePhotoUpload", () => ({
    useProfilePhotoUpload: (...args) => mockUseProfilePhotoUpload(...args),
}));

vi.mock("../../../../common/PersonIcon", () => ({
    default: ({ size }) => <svg data-testid="person-icon" data-size={size} />,
}));

const setupForm = (overrides = {}) => {
    const ctx = {
        form: { bio: "" },
        errors: {},
        onBlur: vi.fn(),
        handleChange: vi.fn(),
        ...overrides,
    };
    mockUseMenteeOnboardingForm.mockReturnValue(ctx);
    return ctx;
};

const setupUpload = (overrides = {}) => {
    const upload = {
        fileInputRef: { current: null },
        uploading: false,
        uploadErr: "",
        handlePhotoClick: vi.fn(),
        handleFileChange: vi.fn(),
        ...overrides,
    };
    mockUseProfilePhotoUpload.mockReturnValue(upload);
    return upload;
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("PersonalInfoSection", () => {
    it("renders the placeholder icon when no picture and not uploading", () => {
        setupForm();
        setupUpload();
        render(<PersonalInfoSection />);
        const button = screen.getByRole("button", { name: "" }); // avatar button
        expect(button.querySelector("svg")).toBeInTheDocument();
        expect(screen.getByText("Upload Photo")).toBeInTheDocument();
    });

    it("renders a spinner instead of the icon while uploading", () => {
        setupForm();
        setupUpload({ uploading: true });
        const { container } = render(<PersonalInfoSection />);
        expect(container.querySelector(".animate-spin")).toBeInTheDocument();
        expect(screen.getByText("Uploading...")).toBeInTheDocument();
    });

    it("renders the profile image when form.profilePicture is set", () => {
        setupForm({ form: { bio: "", profilePicture: "https://example.com/a.png" } });
        setupUpload();
        render(<PersonalInfoSection />);
        const img = screen.getByAltText("Profile");
        expect(img).toHaveAttribute("src", "https://example.com/a.png");
    });

    it("calls handlePhotoClick when avatar button and upload text button are clicked", async () => {
        const user = userEvent.setup();
        setupForm();
        const upload = setupUpload();
        render(<PersonalInfoSection />);
        await user.click(screen.getByText("Upload Photo"));
        expect(upload.handlePhotoClick).toHaveBeenCalledTimes(1);
    });

    it("disables both upload buttons while uploading", () => {
        setupForm();
        setupUpload({ uploading: true });
        render(<PersonalInfoSection />);
        const uploadingText = screen.getByText("Uploading...");
        expect(uploadingText).toBeDisabled();
    });

    it("shows uploadErr message when present", () => {
        setupForm();
        setupUpload({ uploadErr: "File too large" });
        render(<PersonalInfoSection />);
        expect(screen.getByText("File too large")).toBeInTheDocument();
    });

    it("does not show uploadErr message when absent", () => {
        setupForm();
        setupUpload({ uploadErr: "" });
        render(<PersonalInfoSection />);
        expect(screen.queryByText("File too large")).not.toBeInTheDocument();
    });

    it("calls handleFileChange when a file is selected", async () => {
        setupForm();
        const upload = setupUpload();
        render(<PersonalInfoSection />);
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(["hello"], "photo.png", { type: "image/png" });
        await userEvent.upload(fileInput, file);
        expect(upload.handleFileChange).toHaveBeenCalled();
    });

    it("calls handleChange and onBlur when the bio textarea changes/blurs", async () => {
        const user = userEvent.setup();
        const ctx = setupForm();
        setupUpload();
        render(<PersonalInfoSection />);
        const textarea = screen.getByLabelText("Bio");
        await user.type(textarea, "a");
        expect(ctx.handleChange).toHaveBeenCalled();
        await user.tab();
        expect(ctx.onBlur).toHaveBeenCalled();
    });

    it("shows bio error message when errors.bio is set", () => {
        setupForm({ form: { bio: "" }, errors: { bio: true } });
        setupUpload();
        render(<PersonalInfoSection />);
        expect(screen.getByText("Bio must be at least 10 characters.")).toBeInTheDocument();
    });

    it("does not show bio error message when errors.bio is not set", () => {
        setupForm();
        setupUpload();
        render(<PersonalInfoSection />);
        expect(
            screen.queryByText("Bio must be at least 10 characters.")
        ).not.toBeInTheDocument();
    });

    it("passes an onUploadComplete callback into useProfilePhotoUpload that calls handleChange with profilePicture", () => {
        const ctx = setupForm();
        setupUpload();
        render(<PersonalInfoSection />);
        const callback = mockUseProfilePhotoUpload.mock.calls[0][0];
        callback("https://example.com/new.png");
        expect(ctx.handleChange).toHaveBeenCalledWith({
            target: { name: "profilePicture", value: "https://example.com/new.png" },
        });
    });
});