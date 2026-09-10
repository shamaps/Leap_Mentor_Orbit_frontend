import { describe, it, expect } from "vitest";
import { IMAGES } from "../../shared/constants/images";

describe("Centralized Images Constants Suite", () => {

    describe("IMAGES Schema Mappings Registry", () => {
        it("should contain accurate standard static single asset path strings", () => {
            expect(IMAGES.logo).toBe("/images/logo.webp");
            expect(IMAGES.logoPng).toBe("/images/logo.png");
            expect(IMAGES.loginHero).toBe("/images/login.webp");
            expect(IMAGES.verifyHero).toBe("/images/imageverify.webp");
            expect(IMAGES.mentorBg).toBe("/images/mentor-bg.jpg");
            expect(IMAGES.menteeBg).toBe("/images/mentee-bg.jpg");
        });

        it("should contain a valid hero carousel array structure matching specific mock locations", () => {
            expect(Array.isArray(IMAGES.heroCarousel)).toBe(true);
            expect(IMAGES.heroCarousel).toHaveLength(3);

            // Verify specific indices inside the carousel collection array structure
            expect(IMAGES.heroCarousel[0]).toBe("/images/mentor3.webp");
            expect(IMAGES.heroCarousel[1]).toBe("/images/mentor4.webp");
            expect(IMAGES.heroCarousel[2]).toBe("/images/mentor2.webp");
        });

        it("should verify that all values map to valid, non-empty string components", () => {
            const registryValues = [
                IMAGES.logo,
                IMAGES.logoPng,
                IMAGES.loginHero,
                IMAGES.verifyHero,
                IMAGES.mentorBg,
                IMAGES.menteeBg,
                ...IMAGES.heroCarousel
            ];

            registryValues.forEach((assetPath) => {
                expect(typeof assetPath).toBe("string");
                expect(assetPath.trim().length).toBeGreaterThan(0);
            });
        });
    });
});