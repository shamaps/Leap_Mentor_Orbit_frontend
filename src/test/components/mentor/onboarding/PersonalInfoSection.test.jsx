import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import PersonalInfoSection from "../../../../components/mentor/onboarding/PersonalInfoSection";

const mockOnChange = vi.fn();
const mockOnBlur = vi.fn();
let mockForm = { bio: "" };
let mockErrors = {};

vi.mock("../../../../context/MentorOnboardingFormContext", () => ({
    useMentorOnboardingForm: () => ({
        form: mockForm,
        errors: mockErrors,
        onChange: mockOnChange,
        onBlur: mockOnBlur,
    }),
}));

// ── photo upload hook mock, with a capturable onUploaded callback ──
let capturedOnUploaded;
const mockHandlePhotoClick = vi.fn();
const mockHandleFileChange = vi.fn();
let mockUploading = false;
let mockUploadErr = "";

vi.mock("../../../../hooks/useProfilePhotoUpload", () => ({
    useProfilePhotoUpload: (onUploaded) => {
        capturedOnUploaded = onUploaded;
        return {
            fileInputRef: { current: null },
            uploading: mockUploading,
            uploadErr: mockUploadErr,
            handlePhotoClick: mockHandlePhotoClick,
            handleFileChange: mockHandleFileChange,
        };
    },
}));

vi.mock("../../../../common/FormField", () => ({
    default: ({ label, name, value, onChange, onBlur, error }) => (
        <div>
            <label htmlFor={name}>{label}</label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
            />
            {error && <span>{error}</span>}
        </div>
    ),
}));

vi.mock("../../../../common/PersonIcon", () => ({
    default: ({ size }) => <svg data-testid="person-icon" data-size={size} />,
}));

describe("PersonalInfoSection Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockForm = { bio: "", profilePicture: "" };
        mockErrors = {};
        mockUploading = false;
        mockUploadErr = "";
    });

    it("should render the person icon placeholder when there is no profile picture", () => {
        render(<PersonalInfoSection />);
        expect(screen.getAllByTestId("person-icon").length).toBeGreaterThan(0);
    });

    it("should render the uploaded photo when profilePicture is set", () => {
        mockForm = { bio: "", profilePicture: "https://example.com/photo.jpg" };
        render(<PersonalInfoSection />);

        const img = screen.getByAltText("Profile");
        expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    });

    it("should render a spinner and disable buttons while uploading", () => {
        mockUploading = true;
        render(<PersonalInfoSection />);

        expect(screen.getByText("Uploading...")).toBeInTheDocument();
        const buttons = screen.getAllByRole("button");
        buttons.forEach((btn) => expect(btn).toBeDisabled());
    });

    it("should call handlePhotoClick when the avatar button is clicked", () => {
        render(<PersonalInfoSection />);
        fireEvent.click(screen.getByText("Upload Photo"));
        expect(mockHandlePhotoClick).toHaveBeenCalled();
    });

    it("should call handleFileChange when a file is selected", () => {
        const { container } = render(<PersonalInfoSection />);
        const fileInput = container.querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { files: [] } });
        expect(mockHandleFileChange).toHaveBeenCalled();
    });

    it("should display the upload error message when present", () => {
        mockUploadErr = "File too large.";
        render(<PersonalInfoSection />);
        expect(screen.getByText("File too large.")).toBeInTheDocument();
    });

    it("should wire the photo upload callback to update the profilePicture field via onChange", () => {
        render(<PersonalInfoSection />);
        capturedOnUploaded("https://cdn.example.com/new.jpg");
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "profilePicture", value: "https://cdn.example.com/new.jpg" },
        });
    });

    it("should render the bio field wired to context onChange/onBlur", () => {
        render(<PersonalInfoSection />);
        const textarea = screen.getByLabelText("Professional Bio");
        fireEvent.change(textarea, { target: { value: "New bio" } });
        fireEvent.blur(textarea);
        expect(mockOnChange).toHaveBeenCalled();
        expect(mockOnBlur).toHaveBeenCalled();
    });

    it("should show the bio validation error when errors.bio is set", () => {
        mockErrors = { bio: true };
        render(<PersonalInfoSection />);
        expect(screen.getByText("Bio must be at least 10 characters.")).toBeInTheDocument();
    });

    it("should default errors to an empty object when not provided by context", () => {
        vi.doMock("../../../../context/MentorOnboardingFormContext", () => ({
            useMentorOnboardingForm: () => ({
                form: { bio: "", profilePicture: "" },
                onChange: mockOnChange,
                onBlur: mockOnBlur,
            }),
        }));
        expect(() => render(<PersonalInfoSection />)).not.toThrow();
    });
});