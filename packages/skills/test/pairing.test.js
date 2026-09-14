import { describe, expect, it } from "vitest";
import { isPairingCodeValid } from "../src/skills/pairing.js";
describe("pairing", () => {
    it("expires after 5 minutes", () => {
        const createdAt = 1_000_000;
        const nowMs = createdAt + 5 * 60 * 1000 + 1;
        expect(isPairingCodeValid({ code: "1234", createdAt }, nowMs)).toBe(false);
    });
});
//# sourceMappingURL=pairing.test.js.map