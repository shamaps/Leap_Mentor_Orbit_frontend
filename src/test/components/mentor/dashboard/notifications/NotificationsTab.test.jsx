import { describe, it, expect } from "vitest";
import {
    NOTIFICATION_TAB_BY_TYPE,
    resolveNotificationTab,
} from "../../../../../features/notifications/model/notificationTabs";

describe("notificationTabs", () => {
    it.each([
        ["connect_request_received", "requests"],
        ["connect_request_declined", "requests"],
        ["connect_request_accepted", "history"],
        ["upcoming_session", "connects"],
        ["new_message", "connects"],
        ["session_completed", "connects"],
        ["new_review", "profile"],
        ["support_resolved", "home"],
    ])("should map %s to the %s tab", (type, tab) => {
        expect(resolveNotificationTab(type)).toBe(tab);
    });

    it("should cover exactly the supported types", () => {
        expect(Object.keys(NOTIFICATION_TAB_BY_TYPE)).toHaveLength(8);
    });

    it("should return undefined for unknown types", () => {
        expect(resolveNotificationTab("something_new")).toBeUndefined();
        expect(resolveNotificationTab("")).toBeUndefined();
    });

    it("should ignore inherited object keys", () => {
        expect(resolveNotificationTab("constructor")).toBeUndefined();
        expect(resolveNotificationTab("toString")).toBeUndefined();
    });
});