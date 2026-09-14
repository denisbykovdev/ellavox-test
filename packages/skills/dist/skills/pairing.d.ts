import type { Skill } from "../skill.js";
export type PairingRequest = {
    code: string;
    createdAt: number;
};
export declare function isPairingCodeValid(req: PairingRequest, nowMs: number): boolean;
export declare const pairingSkill: Skill;
//# sourceMappingURL=pairing.d.ts.map