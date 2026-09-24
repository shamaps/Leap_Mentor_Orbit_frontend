// src/test/context/MenteeOnboardingFormContext.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
    MenteeOnboardingFormContext,
    useMenteeOnboardingForm,
} from "../../features/mentee/context/MenteeOnboardingFormContext";

const Consumer = () => {
    const { form } = useMenteeOnboardingForm();
    return <div>form-name:{form.name}</div>;
};

const ThrowingConsumer = () => {
    useMenteeOnboardingForm();
    return null;
};

describe("MenteeOnboardingFormContext", () => {
    it("throws when used outside a MenteeOnboardingFormContext.Provider", () => {
        expect(() => render(<ThrowingConsumer />)).toThrow(
            "useMenteeOnboardingForm must be used inside MenteeOnboardingFormContext.Provider",
        );
    });

    it("returns the provided context value when rendered inside the provider", () => {
        const value = { form: { name: "Asha" }, errors: {}, handleChange: () => { } };
        render(
            <MenteeOnboardingFormContext.Provider value={value}>
                <Consumer />
            </MenteeOnboardingFormContext.Provider>,
        );
        expect(screen.getByText("form-name:Asha")).toBeInTheDocument();
    });
});