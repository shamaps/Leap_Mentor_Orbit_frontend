import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React, { createRef } from "react";
import FormField from "../../../shared/components/FormField";

describe("FormField Component Suite", () => {
    it("should render a default input element with minimal props", () => {
        render(<FormField placeholder="Enter name" />);
        expect(screen.getByPlaceholderText("Enter name").tagName).toBe("INPUT");
    });

    it("should render a select element when as='select', including children options", () => {
        render(
            <FormField as="select" name="role">
                <option value="mentor">Mentor</option>
                <option value="mentee">Mentee</option>
            </FormField>
        );
        const select = screen.getByRole("combobox");
        expect(select.tagName).toBe("SELECT");
        expect(screen.getByText("Mentor")).toBeInTheDocument();
        expect(screen.getByText("Mentee")).toBeInTheDocument();
    });

    it("should render a textarea element when as='textarea' with custom rows", () => {
        render(<FormField as="textarea" name="bio" rows={8} placeholder="About you" />);
        const textarea = screen.getByPlaceholderText("About you");
        expect(textarea.tagName).toBe("TEXTAREA");
        expect(textarea).toHaveAttribute("rows", "8");
    });

    it("should render the label and required asterisk when both are provided", () => {
        render(<FormField label="Email" required name="email" />);
        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render the label without an asterisk when required is false", () => {
        render(<FormField label="Nickname" name="nickname" />);
        expect(screen.getByText("Nickname")).toBeInTheDocument();
        expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("should not render a label element when label is omitted", () => {
        const { container } = render(<FormField name="email" />);
        expect(container.querySelector("label")).not.toBeInTheDocument();
    });

    it("should render the error message when error is provided", () => {
        render(<FormField name="email" error="Email is required" />);
        expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    it("should not render an error message when error is omitted", () => {
        const { container } = render(<FormField name="email" />);
        expect(container.querySelector("p.text-red-400")).not.toBeInTheDocument();
    });

    it("should render a leading icon when provided", () => {
        render(<FormField name="search" icon={<span data-testid="lead-icon">🔍</span>} />);
        expect(screen.getByTestId("lead-icon")).toBeInTheDocument();
    });

    it("should not render a leading icon span when icon is omitted", () => {
        const { container } = render(<FormField name="search" />);
        // icon wrapper span only exists when icon prop given
        expect(container.querySelector(".absolute.left-3\\.5")).not.toBeInTheDocument();
    });

    it("should render an end icon when provided", () => {
        render(<FormField name="password" endIcon={<span data-testid="end-icon">👁</span>} />);
        expect(screen.getByTestId("end-icon")).toBeInTheDocument();
    });

    it("should not render an end icon span when endIcon is omitted", () => {
        const { container } = render(<FormField name="password" />);
        expect(container.querySelector(".absolute.right-2")).not.toBeInTheDocument();
    });

    it("should use the id prop directly when provided", () => {
        render(<FormField id="custom-id" name="email" label="Email" />);
        expect(screen.getByText("Email")).toHaveAttribute("for", "custom-id");
    });

    it("should fall back to name when id is not provided", () => {
        render(<FormField name="username" label="Username" />);
        expect(screen.getByText("Username")).toHaveAttribute("for", "username");
    });

    it("should fall back to a generated id when neither id nor name is provided", () => {
        render(<FormField label="Anonymous Field" />);
        const label = screen.getByText("Anonymous Field");
        expect(label).toHaveAttribute("for");
        expect(label.getAttribute("for")).not.toBe("");
    });

    it("should forward the ref to the underlying input DOM node", () => {
        const ref = createRef();
        render(<FormField name="focusme" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it("should forward the ref to the underlying select DOM node", () => {
        const ref = createRef();
        render(
            <FormField as="select" name="role" ref={ref}>
                <option value="a">A</option>
            </FormField>
        );
        expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });

    it("should forward the ref to the underlying textarea DOM node", () => {
        const ref = createRef();
        render(<FormField as="textarea" name="bio" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it("should apply a custom className alongside the base field classes", () => {
        render(<FormField name="email" className="my-extra-class" placeholder="x" />);
        expect(screen.getByPlaceholderText("x").className).toMatch(/my-extra-class/);
    });

    it("should apply error state styling classes when error is present", () => {
        render(<FormField name="email" error="Required" placeholder="x" />);
        expect(screen.getByPlaceholderText("x").className).toMatch(/border-red-400/);
    });

    it("should apply default (non-error) state styling classes when no error", () => {
        render(<FormField name="email" placeholder="x" />);
        expect(screen.getByPlaceholderText("x").className).toMatch(/border-slate-300/);
    });

    it("should pass through arbitrary inputProps like onChange and value", () => {
        const handleChange = vi.fn();
        render(<FormField name="email" placeholder="x" value="test@example.com" onChange={handleChange} readOnly />);
        expect(screen.getByPlaceholderText("x")).toHaveValue("test@example.com");
    });
});