import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import ResumeUpload from "../../../components/mentor/ResumeUpload";

describe("ResumeUpload Component Suite", () => {
    it("should accept valid PDF file selection streams via traditional file input channels", () => {
        const mockChange = vi.fn();
        render(<ResumeUpload file={null} onChange={mockChange} error="" />);

        const file = new File(["dummy contents"], "resume.pdf", { type: "application/pdf" });
        const labelWrapper = screen.getByLabelText(/Upload resume file/i);
        const input = labelWrapper.querySelector("input[type='file']");

        fireEvent.change(input, { target: { files: [file] } });
        expect(mockChange).toHaveBeenCalledWith(file, null);
    });

    it("should flag error alerts if a dropped file contains mismatched extension formats", () => {
        const mockChange = vi.fn();
        render(<ResumeUpload file={null} onChange={mockChange} error="" />);

        const invalidFile = new File(["executable payload"], "malicious.exe", { type: "application/x-msdownload" });
        const labelWrapper = screen.getByLabelText(/Upload resume file/i);

        fireEvent.drop(labelWrapper, {
            dataTransfer: { files: [invalidFile] },
        });
        expect(mockChange).toHaveBeenCalledWith(null, expect.stringContaining("File type not supported"));
    });

    it("should reject file uploads that exceed the maximum boundary size restriction limits", () => {
        const mockChange = vi.fn();
        render(<ResumeUpload file={null} onChange={mockChange} error="" />);

        const giantFile = new File(["huge data content chunk"], "large.pdf", { type: "application/pdf" });
        Object.defineProperty(giantFile, "size", { value: 15 * 1024 * 1024 }); // 15MB

        const labelWrapper = screen.getByLabelText(/Upload resume file/i);
        fireEvent.drop(labelWrapper, {
            dataTransfer: { files: [giantFile] },
        });
        expect(mockChange).toHaveBeenCalledWith(null, "File too large. Maximum size is 10MB.");
    });

    it("should execute asset removal handlers when clicking on the clear cross icon button", () => {
        const mockChange = vi.fn();
        const seededFile = new File(["seeded content"], "cv.pdf", { type: "application/pdf" });

        render(<ResumeUpload file={seededFile} onChange={mockChange} error="" />);
        expect(screen.getByText("cv.pdf")).toBeInTheDocument();

        const removeBtn = screen.getByRole("button");
        fireEvent.click(removeBtn);
        expect(mockChange).toHaveBeenCalledWith(null, null);
    });
});