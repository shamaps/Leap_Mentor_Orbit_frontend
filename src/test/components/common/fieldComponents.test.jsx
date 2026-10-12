// Tests for TextField, SelectField and TextAreaField (replaces FormField.test.jsx)
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React, { createRef } from "react";
import { useForm } from "react-hook-form";
import TextField from "../../../shared/components/TextField";
import SelectField from "../../../shared/components/SelectField";
import TextAreaField from "../../../shared/components/TextAreaField";

const renderSelect = (props = {}) =>
    render(
        <SelectField {...props}>
            <option value="a">A</option>
            <option value="b">B</option>
        </SelectField>,
    );

// Behavior every field component shares (label / icons / error chrome / ids / classes).
const variants = [
    { name: "TextField", tag: "INPUT", Ref: HTMLInputElement, renderField: (props) => render(<TextField {...props} />) },
    { name: "SelectField", tag: "SELECT", Ref: HTMLSelectElement, renderField: renderSelect },
    { name: "TextAreaField", tag: "TEXTAREA", Ref: HTMLTextAreaElement, renderField: (props) => render(<TextAreaField {...props} />) },
];

describe.each(variants)("$name shared behavior", ({ tag, Ref, renderField }) => {
    it("renders the right element", () => {
        const { container } = renderField({ name: "f" });
        expect(container.querySelector(tag.toLowerCase())).toBeInTheDocument();
    });

    it("renders the label and required asterisk", () => {
        renderField({ label: "Email", required: true, name: "email" });
        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("renders the label without an asterisk when not required", () => {
        renderField({ label: "Nickname", name: "nickname" });
        expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("renders no label element when label is omitted", () => {
        const { container } = renderField({ name: "x" });
        expect(container.querySelector("label")).not.toBeInTheDocument();
    });

    it("does not forward `required` to the DOM element (validation stays in the form layer)", () => {
        const { container } = renderField({ name: "x", required: true });
        expect(container.querySelector(tag.toLowerCase())).not.toHaveAttribute("required");
    });

    it("renders the error message with error styling", () => {
        const { container } = renderField({ name: "x", error: "Required" });
        expect(screen.getByText("Required")).toBeInTheDocument();
        expect(container.querySelector(tag.toLowerCase()).className).toMatch(/border-red-400/);
    });

    it("uses default styling when there is no error", () => {
        const { container } = renderField({ name: "x" });
        expect(container.querySelector(tag.toLowerCase()).className).toMatch(/border-slate-300/);
        expect(container.querySelector("p.text-red-400")).not.toBeInTheDocument();
    });

    it("renders a leading icon and adds left padding", () => {
        const { container } = renderField({ name: "x", icon: <span data-testid="lead">i</span> });
        expect(screen.getByTestId("lead")).toBeInTheDocument();
        expect(container.querySelector(tag.toLowerCase()).className).toMatch(/pl-10/);
    });

    it("renders an end icon", () => {
        renderField({ name: "x", endIcon: <span data-testid="end">e</span> });
        expect(screen.getByTestId("end")).toBeInTheDocument();
    });

    it("omits icon wrappers when no icons are given", () => {
        const { container } = renderField({ name: "x" });
        expect(container.querySelector(".absolute")).not.toBeInTheDocument();
    });

    it("applies a custom className", () => {
        const { container } = renderField({ name: "x", className: "my-extra" });
        expect(container.querySelector(tag.toLowerCase()).className).toMatch(/my-extra/);
    });

    it("links the label to the field via id, then name, then a generated id", () => {
        const { unmount } = renderField({ id: "custom", name: "n", label: "L1" });
        expect(screen.getByText("L1")).toHaveAttribute("for", "custom");
        unmount();

        const second = renderField({ name: "uname", label: "L2" });
        expect(screen.getByText("L2")).toHaveAttribute("for", "uname");
        second.unmount();

        renderField({ label: "L3" });
        expect(screen.getByText("L3").getAttribute("for")).toBeTruthy();
    });

    it("forwards the ref to the right DOM element type", () => {
        const ref = createRef();
        if (tag === "INPUT") render(<TextField name="r" ref={ref} />);
        if (tag === "SELECT") renderSelect({ name: "r", ref });
        if (tag === "TEXTAREA") render(<TextAreaField name="r" ref={ref} />);
        expect(ref.current).toBeInstanceOf(Ref);
    });
});

describe("TextField", () => {
    it("passes native input props through (type, value, readOnly, placeholder)", () => {
        render(<TextField name="e" type="email" placeholder="x" value="a@b.c" onChange={() => { }} readOnly />);
        const input = screen.getByPlaceholderText("x");
        expect(input).toHaveAttribute("type", "email");
        expect(input).toHaveValue("a@b.c");
        expect(input).toHaveAttribute("readonly");
    });

    it("calls onChange and onBlur", () => {
        const onChange = vi.fn();
        const onBlur = vi.fn();
        render(<TextField name="e" placeholder="x" onChange={onChange} onBlur={onBlur} />);
        const input = screen.getByPlaceholderText("x");
        fireEvent.change(input, { target: { value: "hi" } });
        fireEvent.blur(input);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});

describe("SelectField", () => {
    it("renders its option children", () => {
        renderSelect({ name: "role" });
        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.getByText("B")).toBeInTheDocument();
    });

    it("adds select-specific classes", () => {
        renderSelect({ name: "role" });
        expect(screen.getByRole("combobox").className).toMatch(/appearance-none/);
    });

    it("reports the chosen value through onChange", () => {
        const onChange = vi.fn((e) => e.target.value);
        renderSelect({ name: "role", onChange, defaultValue: "a" });
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
        expect(onChange).toHaveReturnedWith("b");
    });
});

describe("TextAreaField", () => {
    it("defaults to 4 rows and accepts a custom row count", () => {
        const { rerender } = render(<TextAreaField name="bio" placeholder="p" />);
        expect(screen.getByPlaceholderText("p")).toHaveAttribute("rows", "4");
        rerender(<TextAreaField name="bio" placeholder="p" rows={8} />);
        expect(screen.getByPlaceholderText("p")).toHaveAttribute("rows", "8");
    });

    it("adds textarea-specific classes", () => {
        render(<TextAreaField name="bio" placeholder="p" />);
        expect(screen.getByPlaceholderText("p").className).toMatch(/resize-none/);
    });
});

describe("react-hook-form integration (ref + value + validation)", () => {
    const Form = ({ onSubmit }) => {
        const { register, handleSubmit, formState: { errors } } = useForm({
            defaultValues: { email: "", role: "a", bio: "" },
        });
        return (
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="Email" placeholder="email" error={errors.email?.message} {...register("email", { required: "Email is required" })} />
                <SelectField label="Role" {...register("role")}>
                    <option value="a">A</option>
                    <option value="b">B</option>
                </SelectField>
                <TextAreaField label="Bio" placeholder="bio" {...register("bio")} />
                <button type="submit">Save</button>
            </form>
        );
    };

    it("shows the validation error and does not submit when invalid", async () => {
        const onSubmit = vi.fn();
        render(<Form onSubmit={onSubmit} />);
        fireEvent.click(screen.getByText("Save"));
        expect(await screen.findByText("Email is required")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("reads values from all three field types through their refs on submit", async () => {
        const onSubmit = vi.fn();
        render(<Form onSubmit={onSubmit} />);
        fireEvent.change(screen.getByPlaceholderText("email"), { target: { value: "a@b.c" } });
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
        fireEvent.change(screen.getByPlaceholderText("bio"), { target: { value: "hello" } });
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());
        expect(onSubmit.mock.calls[0][0]).toEqual({ email: "a@b.c", role: "b", bio: "hello" });
    });
});
