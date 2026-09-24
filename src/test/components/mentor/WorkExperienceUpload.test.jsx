import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import WorkExperienceUpload from "../../../features/mentor/view/components/WorkExperienceUpload";

describe("WorkExperienceUpload Component Suite", () => {
    it("should successfully mount file lists and clear items individually upon request click executions", () => {
        const mockChange = vi.fn();
        const activeMockFiles = [new File(["abc"], "offer.pdf", { type: "application/pdf" })];

        render(<WorkExperienceUpload files={activeMockFiles} onChange={mockChange} error="" />);
        expect(screen.getByText("offer.pdf")).toBeInTheDocument();

        const clearBtn = screen.getByRole("button");
        fireEvent.click(clearBtn);
        expect(mockChange).toHaveBeenCalledWith([], null);
    });

    it("should prevent additional uploads if the batch size exceeds the allowed limits", () => {
        const mockChange = vi.fn();
        const maxedFiles = [
            new File(["1"], "a.png", { type: "image/png" }),
            new File(["2"], "b.png", { type: "image/png" }),
            new File(["3"], "c.png", { type: "image/png" }),
        ];

        render(<WorkExperienceUpload files={maxedFiles} onChange={mockChange} error="" />);
        expect(screen.queryByLabelText(/Upload work experience files/i)).not.toBeInTheDocument();
    });

    it("should restrict additions if incoming file lists violate count constraints during selection cycles", () => {
        const mockChange = vi.fn();
        render(<WorkExperienceUpload files={[]} onChange={mockChange} error="" />);

        const excessiveFilesList = [
            new File(["1"], "1.pdf", { type: "application/pdf" }),
            new File(["2"], "2.pdf", { type: "application/pdf" }),
            new File(["3"], "3.pdf", { type: "application/pdf" }),
            new File(["4"], "4.pdf", { type: "application/pdf" }),
        ];

        const dropZone = screen.getByLabelText(/Upload work experience files/i);
        fireEvent.drop(dropZone, {
            dataTransfer: { files: excessiveFilesList },
        });
        expect(mockChange).toHaveBeenCalledWith([], "Maximum 3 files allowed");
    });

    it("should filter unsupported mime-types out of file processing handlers", () => {
        const mockChange = vi.fn();
        render(<WorkExperienceUpload files={[]} onChange={mockChange} error="" />);

        const invalidExtensionFile = new File(["text payload"], "script.sh", { type: "application/x-sh" });
        const zoneLabel = screen.getByLabelText(/Upload work experience files/i);

        fireEvent.change(zoneLabel.querySelector("input"), { target: { files: [invalidExtensionFile] } });
        expect(mockChange).toHaveBeenCalledWith([], "Only PDF, JPG, PNG, WEBP files are allowed");
    });

    it("should trigger volume errors if single target documents exceed individual asset limitations", () => {
        const mockChange = vi.fn();
        render(<WorkExperienceUpload files={[]} onChange={mockChange} error="" />);

        const bulkyFile = new File(["bytes"], "oversized.pdf", { type: "application/pdf" });
        Object.defineProperty(bulkyFile, "size", { value: 22 * 1024 * 1024 }); // 22MB

        const selectZone = screen.getByLabelText(/Upload work experience files/i);
        fireEvent.change(selectZone.querySelector("input"), { target: { files: [bulkyFile] } });
        expect(mockChange).toHaveBeenCalledWith([], "Each file must be under 10MB");
    });

    // --- Added for 100% coverage ---

    it("should accept a valid file via file input and reset the input value", () => {
        const mockChange = vi.fn();
        render(<WorkExperienceUpload files={[]} onChange={mockChange} error="" />);

        const validFile = new File(["abc"], "valid.pdf", { type: "application/pdf" });
        const zoneLabel = screen.getByLabelText(/Upload work experience files/i);
        const input = zoneLabel.querySelector("input");

        fireEvent.change(input, { target: { files: [validFile] } });

        expect(mockChange).toHaveBeenCalledWith([validFile], null);
        expect(input.value).toBe("");
    });

    it("should accept valid dropped files without errors", () => {
        const mockChange = vi.fn();
        const existing = [new File(["1"], "existing.pdf", { type: "application/pdf" })];
        render(<WorkExperienceUpload files={existing} onChange={mockChange} error="" />);

        const validDropFile = new File(["2"], "second.pdf", { type: "application/pdf" });
        const dropZone = screen.getByLabelText(/Upload work experience files/i);

        fireEvent.drop(dropZone, { dataTransfer: { files: [validDropFile] } });

        expect(mockChange).toHaveBeenCalledWith([existing[0], validDropFile], null);
    });

    it("should reject dropped files with disallowed mime types", () => {
        const mockChange = vi.fn();
        render(<WorkExperienceUpload files={[]} onChange={mockChange} error="" />);

        const badDropFile = new File(["bad"], "bad.exe", { type: "application/x-msdownload" });
        const dropZone = screen.getByLabelText(/Upload work experience files/i);

        fireEvent.drop(dropZone, { dataTransfer: { files: [badDropFile] } });

        expect(mockChange).toHaveBeenCalledWith([], "Only PDF, JPG, PNG, WEBP files are allowed");
    });

    it("should reject oversized dropped files", () => {
        const mockChange = vi.fn();
        render(<WorkExperienceUpload files={[]} onChange={mockChange} error="" />);

        const bigDropFile = new File(["big"], "big.pdf", { type: "application/pdf" });
        Object.defineProperty(bigDropFile, "size", { value: 15 * 1024 * 1024 });

        const dropZone = screen.getByLabelText(/Upload work experience files/i);
        fireEvent.drop(dropZone, { dataTransfer: { files: [bigDropFile] } });

        expect(mockChange).toHaveBeenCalledWith([], "Each file must be under 10MB");
    });

    it("should render the error message and red-bordered drop zone when an error prop is passed", () => {
        const mockChange = vi.fn();
        render(<WorkExperienceUpload files={[]} onChange={mockChange} error="Some upload error" />);

        expect(screen.getByText("Some upload error")).toBeInTheDocument();
        const dropZone = screen.getByLabelText(/Upload work experience files/i);
        expect(dropZone.className).toMatch(/border-red-300/);
    });

    it("should render without an error prop supplied at all (undefined)", () => {
        const mockChange = vi.fn();
        render(<WorkExperienceUpload files={[]} onChange={mockChange} />);

        const dropZone = screen.getByLabelText(/Upload work experience files/i);
        expect(dropZone.className).toMatch(/border-slate-200/);
    });
});