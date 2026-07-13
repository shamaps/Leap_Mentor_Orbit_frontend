// src/test/hooks/useInvoiceDownload.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import axiosInstance from "../../utils/axiosInstance";
import logger from "../../utils/logger";
import { useInvoiceDownload } from "../../hooks/useInvoiceDownload";

vi.mock("../../utils/axiosInstance");
vi.mock("../../utils/logger");

describe("useInvoiceDownload", () => {
    let createObjectURLSpy;
    let revokeObjectURLSpy;
    let clickSpy;

    beforeEach(() => {
        vi.clearAllMocks();
        createObjectURLSpy = vi.fn(() => "blob:mock-url");
        revokeObjectURLSpy = vi.fn();
        vi.stubGlobal("URL", {
            ...globalThis.URL,
            createObjectURL: createObjectURLSpy,
            revokeObjectURL: revokeObjectURLSpy,
        });
        clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        clickSpy.mockRestore();
    });

    it("has correct initial state", () => {
        const { result } = renderHook(() => useInvoiceDownload());

        expect(result.current.downloading).toBe(false);
        expect(result.current.error).toBe("");
        expect(typeof result.current.downloadInvoice).toBe("function");
    });

    it("downloads the invoice successfully and triggers a click with the correct filename", async () => {
        axiosInstance.get.mockResolvedValue({ data: new ArrayBuffer(8) });

        const { result } = renderHook(() => useInvoiceDownload());

        await act(async () => {
            await result.current.downloadInvoice("request-abcdef123456");
        });

        expect(axiosInstance.get).toHaveBeenCalledWith("/invoices/request-abcdef123456", {
            responseType: "arraybuffer",
        });
        expect(createObjectURLSpy).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
        expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
        expect(result.current.downloading).toBe(false);
        expect(result.current.error).toBe("");
    });

    it("uses the last 6 characters of requestId, uppercased, in the filename", async () => {
        axiosInstance.get.mockResolvedValue({ data: new ArrayBuffer(8) });

        let capturedLink;
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, "createElement").mockImplementation((tag) => {
            const el = originalCreateElement(tag);
            if (tag === "a") capturedLink = el;
            return el;
        });

        const { result } = renderHook(() => useInvoiceDownload());

        await act(async () => {
            await result.current.downloadInvoice("request-abcdef123456");
        });

        expect(capturedLink.download).toBe("Invoice-123456.pdf");

        document.createElement.mockRestore();
    });

    it("sets an error and logs when the download fails", async () => {
        axiosInstance.get.mockRejectedValue(new Error("network fail"));

        const { result } = renderHook(() => useInvoiceDownload());

        await act(async () => {
            await result.current.downloadInvoice("request-xyz789");
        });

        expect(logger.error).toHaveBeenCalledWith("Invoice download failed", {
            requestId: "request-xyz789",
            message: "network fail",
        });
        expect(result.current.error).toBe("Failed to download invoice. Please try again.");
        expect(result.current.downloading).toBe(false);
    });

    it("sets downloading to true while the request is in flight", async () => {
        let resolveRequest;
        axiosInstance.get.mockReturnValue(
            new Promise((resolve) => {
                resolveRequest = resolve;
            }),
        );

        const { result } = renderHook(() => useInvoiceDownload());

        let downloadPromise;
        act(() => {
            downloadPromise = result.current.downloadInvoice("request-1");
        });

        await waitFor(() => expect(result.current.downloading).toBe(true));

        await act(async () => {
            resolveRequest({ data: new ArrayBuffer(8) });
            await downloadPromise;
        });

        expect(result.current.downloading).toBe(false);
    });
});