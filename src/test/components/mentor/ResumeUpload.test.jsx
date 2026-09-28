import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import ResumeUpload from "../../../features/mentor/view/components/ResumeUpload";

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

    it("does nothing when the picker has no selected file", () => {
        const mockChange = vi.fn();
        render(<ResumeUpload file={null} onChange={mockChange} />);
        fireEvent.change(screen.getByLabelText(/Upload resume file/i).querySelector("input"), {
            target: { files: [] },
        });
        expect(mockChange).not.toHaveBeenCalled();
    });

    it("rejects unsupported file types selected through the picker", () => {
        const mockChange = vi.fn();
        render(<ResumeUpload file={null} onChange={mockChange} />);
        const file = new File(["bad"], "resume.txt", { type: "text/plain" });
        fireEvent.change(screen.getByLabelText(/Upload resume file/i).querySelector("input"), {
            target: { files: [file] },
        });
        expect(mockChange).toHaveBeenCalledWith(null, expect.stringContaining("File type not supported"));
    });

    it("rejects oversized files selected through the picker", () => {
        const mockChange = vi.fn();
        render(<ResumeUpload file={null} onChange={mockChange} />);
        const file = new File(["large"], "resume.pdf", { type: "application/pdf" });
        Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
        fireEvent.change(screen.getByLabelText(/Upload resume file/i).querySelector("input"), {
            target: { files: [file] },
        });
        expect(mockChange).toHaveBeenCalledWith(null, "File too large. Maximum size is 10MB.");
    });

    it("accepts a supported file dropped onto the upload target", () => {
        const mockChange = vi.fn();
        render(<ResumeUpload file={null} onChange={mockChange} />);
        const file = new File(["image"], "resume.webp", { type: "image/webp" });
        fireEvent.drop(screen.getByLabelText(/Upload resume file/i), {
            dataTransfer: { files: [file] },
        });
        expect(mockChange).toHaveBeenCalledWith(file, null);
    });

    it("renders the supplied error message", () => {
        render(<ResumeUpload file={null} onChange={vi.fn()} error="Please upload a resume." />);
        expect(screen.getByText("Please upload a resume.")).toBeInTheDocument();
    });

    it("prevents the browser's default behavior while dragging over the upload target", () => {
        render(<ResumeUpload file={null} onChange={vi.fn()} />);
        const event = new Event("dragover", { bubbles: true, cancelable: true });
        screen.getByLabelText(/Upload resume file/i).dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
    });

});