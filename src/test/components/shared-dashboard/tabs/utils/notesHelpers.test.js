import { describe, it, expect } from "vitest";
import {
    formatFileSize,
    formatDate,
    formatDateSeparator,
    isSameDay,
    getFileType,
    ALLOWED_FILE_TYPES,
    FILE_ICON_STYLES,
    FILE_ICON_LABELS,
} from "../../../../../features/shared-dashboard/view/components/tabs/helpers/notesHelpers";

describe("Notes Utility Helpers Full Coverage Suite", () => {

    describe("formatFileSize() Bounds", () => {
        it("should return a placeholder dash when byte values are falsy or zero", () => {
            expect(formatFileSize(0)).toBe("—");
            expect(formatFileSize(null)).toBe("—");
            expect(formatFileSize(undefined)).toBe("—");
        });

        it("should format bytes under 1024 without modification", () => {
            expect(formatFileSize(512)).toBe("512 B");
            expect(formatFileSize(1023)).toBe("1023 B");
        });

        it("should format values into KB when falling within the Kilobyte range", () => {
            expect(formatFileSize(1024)).toBe("1.0 KB");
            expect(formatFileSize(1024 * 512)).toBe("512.0 KB");
            expect(formatFileSize((1024 * 1024) - 1)).toBe("1024.0 KB");
        });

        it("should format values into MB when meeting Megabyte thresholds", () => {
            expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
            expect(formatFileSize(1024 * 1024 * 3.45)).toBe("3.5 MB");
        });
    });

    describe("formatDate() Bounds", () => {
        it("should return an empty string when the input string is missing or falsy", () => {
            expect(formatDate("")).toBe("");
            expect(formatDate(null)).toBe("");
            expect(formatDate(undefined)).toBe("");
        });

        it("should correctly compile standard date representations into short formats", () => {
            expect(formatDate("2026-07-12T10:00:00")).toBe("Jul 12, 2026");
        });
    });

    describe("formatDateSeparator() Relative Date Logic", () => {
        it("should return 'Today' when the date matches the current calendar instance", () => {
            const today = new Date().toISOString();
            expect(formatDateSeparator(today)).toBe("Today");
        });

        it("should return 'Yesterday' when the date parameters map exactly one day back", () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            expect(formatDateSeparator(yesterday.toISOString())).toBe("Yesterday");
        });

        it("should fallback to a long format if dates reside further in the past or future", () => {
            expect(formatDateSeparator("2026-06-15T09:00:00")).toBe("June 15, 2026");
        });
    });

    describe("isSameDay() Operations", () => {
        it("should return true when date elements share identical calendar windows", () => {
            // Use uniform local time strings to prevent global UTC shifting variations
            expect(isSameDay("2026-07-12T02:00:00", "2026-07-12T22:00:00")).toBe(true);
        });

        it("should return false when date elements cross calendar horizons", () => {
            // Absolute boundary check using local time components explicitly
            expect(isSameDay("2026-07-12T23:59:00", "2026-07-13T00:01:00")).toBe(false);
        });
    });

    describe("getFileType() Extensions Router Matrix", () => {
        it("should return 'other' when filenames are missing or blank", () => {
            expect(getFileType("")).toBe("other");
            expect(getFileType(null)).toBe("other");
            expect(getFileType(undefined)).toBe("other");
        });

        it("should correctly identify alternative formats across extension groupings", () => {
            // PDF
            expect(getFileType("doc.pdf")).toBe("pdf");
            expect(getFileType("CASE.PDF")).toBe("pdf");

            // Images
            expect(getFileType("img.jpg")).toBe("image");
            expect(getFileType("img.jpeg")).toBe("image");
            expect(getFileType("img.png")).toBe("image");
            expect(getFileType("img.gif")).toBe("image");
            expect(getFileType("img.webp")).toBe("image");

            // Documents
            expect(getFileType("file.doc")).toBe("doc");
            expect(getFileType("file.docx")).toBe("doc");

            // Presentations
            expect(getFileType("slides.ppt")).toBe("ppt");
            expect(getFileType("slides.pptx")).toBe("ppt");

            // Excel Spreadsheet
            expect(getFileType("sheet.xls")).toBe("excel");
            expect(getFileType("sheet.xlsx")).toBe("excel");

            // Text
            expect(getFileType("readme.txt")).toBe("txt");

            // Unrecognized fallback path
            expect(getFileType("archive.tar.gz")).toBe("other");
            expect(getFileType("config.json")).toBe("other");
        });
    });

    describe("Static Mappings and Structure Registries", () => {
        it("should assert that ALLOWED_FILE_TYPES exports a valid, complete 13-item array structure", () => {
            expect(Array.isArray(ALLOWED_FILE_TYPES)).toBe(true);
            expect(ALLOWED_FILE_TYPES).toHaveLength(13);
        });

        it("should confirm mapping definitions share identical structure parameters across classifications", () => {
            const expectedKeys = ["pdf", "image", "doc", "ppt", "excel", "txt", "other"];

            expectedKeys.forEach((key) => {
                expect(FILE_ICON_STYLES).toHaveProperty(key);
                expect(FILE_ICON_LABELS).toHaveProperty(key);
                expect(typeof FILE_ICON_STYLES[key]).toBe("string");
                expect(typeof FILE_ICON_LABELS[key]).toBe("string");
            });
        });
    });
});