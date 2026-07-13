// src/test/context/MentorOnboardingFormContext.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
    MentorOnboardingFormContext,
    useMentorOnboardingForm,
} from "../../context/MentorOnboardingFormContext";

const Consumer = () => {
    const { form } = useMentorOnboardingForm();
    return <div>form-name:{form.name}</div>;
};

const ThrowingConsumer = () => {
    useMentorOnboardingForm();
    return null;
};

describe("MentorOnboardingFormContext", () => {
    it("throws when used outside a MentorOnboardingFormContext.Provider", () => {
        expect(() => render(<ThrowingConsumer />)).toThrow(
            "useMentorOnboardingForm must be used inside MentorOnboardingFormContext.Provider",
        );
    });

    it("returns the provided context value when rendered inside the provider", () => {
        const value = { form: { name: "Ravi" }, errors: {}, onChange: () => { } };
        render(
            <MentorOnboardingFormContext.Provider value={value}>
                <Consumer />
            </MentorOnboardingFormContext.Provider>,
        );
        expect(screen.getByText("form-name:Ravi")).toBeInTheDocument();
    });
});