import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import {
    payEscrow, releaseEscrow, refundEscrow, getEscrowStatus,
    payAdditionalEscrow, getPlatformCommissionRate, getWallet,
} from "../../api/escrow.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("escrow.api", () => {
    it("payEscrow: POSTs the exact payload to /escrow/pay", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/escrow/pay`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ transactionId: "tx1", status: "locked" });
            }),
        );
        const result = await payEscrow({ connectRequestId: "cr1", sessionRate: 500, sessionCount: 4 });
        expect(receivedBody).toEqual({ connectRequestId: "cr1", sessionRate: 500, sessionCount: 4 });
        expect(result).toEqual({ transactionId: "tx1", status: "locked" });
    });

    it("releaseEscrow: PATCHes { action: 'release' } to /escrow/:requestId", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/escrow/cr1`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({ status: "released" });
            }),
        );
        const result = await releaseEscrow("cr1");
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual({ action: "release" });
        expect(result).toEqual({ status: "released" });
    });

    it("refundEscrow: PATCHes { action: 'refund' } to /escrow/:requestId", async () => {
        let receivedBody;
        server.use(
            http.patch(`${BASE}/escrow/cr1`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ status: "refunded" });
            }),
        );
        const result = await refundEscrow("cr1");
        expect(receivedBody).toEqual({ action: "refund" });
        expect(result).toEqual({ status: "refunded" });
    });

    it("getEscrowStatus: GETs /escrow/status/:requestId", async () => {
        server.use(
            http.get(`${BASE}/escrow/status/cr1`, () =>
                envelope({ status: "locked", walletBalance: 1000 }),
            ),
        );
        const result = await getEscrowStatus("cr1");
        expect(result).toEqual({ status: "locked", walletBalance: 1000 });
    });

    it("payAdditionalEscrow: POSTs the exact payload to /escrow/pay-additional", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/escrow/pay-additional`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ transactionId: "tx2" });
            }),
        );
        const result = await payAdditionalEscrow({ connectRequestId: "cr1", sessionRate: 500, slotId: "slot1" });
        expect(receivedBody).toEqual({ connectRequestId: "cr1", sessionRate: 500, slotId: "slot1" });
        expect(result).toEqual({ transactionId: "tx2" });
    });

    it("getPlatformCommissionRate: GETs /escrow/commission-rate", async () => {
        server.use(
            http.get(`${BASE}/escrow/commission-rate`, () => envelope({ rate: 0.1 })),
        );
        const result = await getPlatformCommissionRate();
        expect(result).toEqual({ rate: 0.1 });
    });

    it("getWallet: GETs /escrow/wallet", async () => {
        server.use(
            http.get(`${BASE}/escrow/wallet`, () => envelope({ balance: 2500 })),
        );
        const result = await getWallet();
        expect(result).toEqual({ balance: 2500 });
    });
});