import { describe, it, expect } from "vitest";
import { commissionSchema, addAdminSchema } from "../../schemas/settingsSchemas";

describe("commissionSchema", () => {
    it("passes with a valid commission rate", () => {
        expect(commissionSchema.safeParse({ commission: "15.5" }).success).toBe(true);
    });

    it("fails when commission is empty", () => {
        const result = commissionSchema.safeParse({ commission: "" });
        expect(result.error.flatten().fieldErrors.commission[0]).toBe(
            "Commission rate is required.",
        );
    });

    it("fails when commission is not a valid number", () => {
        const result = commissionSchema.safeParse({ commission: "abc" });
        expect(result.error.flatten().fieldErrors.commission).toContain("Enter a valid number.");
    });

    it("fails when commission is negative", () => {
        const result = commissionSchema.safeParse({ commission: "-5" });
        expect(result.error.flatten().fieldErrors.commission).toContain(
            "Commission must be between 0 and 100.",
        );
    });

    it("fails when commission is over 100", () => {
        const result = commissionSchema.safeParse({ commission: "150" });
        expect(result.error.flatten().fieldErrors.commission).toContain(
            "Commission must be between 0 and 100.",
        );
    });

    it("passes at the boundary values 0 and 100", () => {
        expect(commissionSchema.safeParse({ commission: "0" }).success).toBe(true);
        expect(commissionSchema.safeParse({ commission: "100" }).success).toBe(true);
    });

    it("trims whitespace before validating", () => {
        expect(commissionSchema.safeParse({ commission: "  25  " }).success).toBe(true);
    });
});

describe("addAdminSchema", () => {
    it("passes with a valid name and email", () => {
        const result = addAdminSchema.safeParse({
            adminName: "Admin User",
            adminEmail: "admin@example.com",
        });
        expect(result.success).toBe(true);
    });

    it("fails when adminName is empty", () => {
        const result = addAdminSchema.safeParse({ adminName: "", adminEmail: "admin@example.com" });
        expect(result.error.flatten().fieldErrors.adminName[0]).toBe("Name is required.");
    });

    it("fails when adminEmail is empty", () => {
        const result = addAdminSchema.safeParse({ adminName: "Admin User", adminEmail: "" });
        expect(result.error.flatten().fieldErrors.adminEmail[0]).toBe("Email is required.");
    });

    it("fails when adminEmail is not a valid format", () => {
        const result = addAdminSchema.safeParse({ adminName: "Admin User", adminEmail: "bad" });
        expect(result.error.flatten().fieldErrors.adminEmail[0]).toBe(
            "Please enter a valid email address.",
        );
    });

    it("trims whitespace from adminName and adminEmail", () => {
        const result = addAdminSchema.safeParse({
            adminName: "  Admin User  ",
            adminEmail: "  admin@example.com  ",
        });
        expect(result.success).toBe(true);
        expect(result.data.adminName).toBe("Admin User");
        expect(result.data.adminEmail).toBe("admin@example.com");
    });
});