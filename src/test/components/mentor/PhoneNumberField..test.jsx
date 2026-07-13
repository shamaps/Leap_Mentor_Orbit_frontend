import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import PhoneNumberField from "../../../components/mentor/PhoneNumberField";

// Mock the internal modules of react-phone-number-input to bypass upstream network lookup checks
vi.mock("react-phone-number-input", () => {
    return {
        default: ({ value, onChange, onBlur, id }) => (
            <input
                data-testid="mock-phone-input"
                id={id}
                value={value}
                onBlur={onBlur}
                onChange={(e) => onChange(e.target.value)}
            />
        ),
        isValidPhoneNumber: vi.fn((val) => val === "+919876543210"),
    };
});

describe("PhoneNumberField Component Suite", () => {
    it("should mount and show standard placeholder hints prior to field modification", () => {
        render(<PhoneNumberField value="" onChange={vi.fn()} error="" />);
        expect(screen.getByText(/Select your country code and enter your number/i)).toBeInTheDocument();
    });

    it("should toggle success state styles when entering matching valid phone numbers", () => {
        const mockChange = vi.fn();
        const { container } = render(<PhoneNumberField value="+919876543210" onChange={mockChange} error="" />);

        const input = screen.getByTestId("mock-phone-input");
        fireEvent.blur(input);

        expect(screen.getByText(/Valid phone number/i)).toBeInTheDocument();
        expect(container.querySelector(".border-green-400")).toBeInTheDocument();

        fireEvent.change(input, { target: { value: "+9198765" } });
        expect(mockChange).toHaveBeenCalledWith({ target: { name: "phoneNumber", value: "+9198765" } });
    });

    it("should render error indicators when explicit text props or invalid sequences are detected", () => {
        const { container } = render(<PhoneNumberField value="+123" onChange={vi.fn()} error="Explicit Error Link" />);

        const input = screen.getByTestId("mock-phone-input");
        fireEvent.blur(input);

        expect(screen.getByText(/Explicit Error Link/i)).toBeInTheDocument();
        expect(container.querySelector(".border-red-300")).toBeInTheDocument();
    });
});