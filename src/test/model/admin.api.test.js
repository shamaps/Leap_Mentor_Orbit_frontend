import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));
vi.mock("../../shared/utils/axiosInstance", () => ({
    default: { get: mockGet },
}));

import { getPaymentTransactions } from "../../features/admin/model/admin.api";

describe("admin API", () => {
    beforeEach(() => vi.clearAllMocks());

    it("passes transaction filters as request params", () => {
        const filters = { page: 2, limit: 25, status: "paid" };
        getPaymentTransactions(filters);
        expect(mockGet).toHaveBeenCalledWith("/admin/payments/transactions", {
            params: filters,
        });
    });
});
