import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetCurrentAdmin } = vi.hoisted(() => ({ mockGetCurrentAdmin: vi.fn() }));
vi.mock("../../../features/admin/model/admin.api", () => ({
  getCurrentAdmin: mockGetCurrentAdmin,
}));

import {
  requireAdminAuth,
  resetAdminSessionCache,
} from "../../../features/admin/model/requireAdminAuth";

describe("requireAdminAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAdminSessionCache();
  });

  it("resolves for an authenticated admin and shares the in-flight session check", async () => {
    let resolveRequest;
    mockGetCurrentAdmin.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));

    const first = requireAdminAuth();
    const second = requireAdminAuth();
    expect(mockGetCurrentAdmin).toHaveBeenCalledTimes(1);

    resolveRequest({ data: { admin: { name: "Admin" } } });
    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
  });

  it("redirects to the admin login route when the session check fails", async () => {
    mockGetCurrentAdmin.mockRejectedValueOnce(new Error("unauthorized"));
    await expect(requireAdminAuth()).rejects.toMatchObject({ status: 302 });
  });

  it("starts a fresh session check after the cache is reset", async () => {
    mockGetCurrentAdmin.mockResolvedValue({});
    await requireAdminAuth();
    resetAdminSessionCache();
    await requireAdminAuth();
    expect(mockGetCurrentAdmin).toHaveBeenCalledTimes(2);
  });
});
