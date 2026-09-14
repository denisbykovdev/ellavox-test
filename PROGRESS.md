# Progress

Eval repo: `openclaw-vibe-eval`. Source of truth: acceptance criteria in `STORIES.md`. Comments marked `Intentional...` are not the spec.

Status key: `not started` · `in progress` · `done`

Verification for a story: `npm test`, `npm run lint`, `npm run typecheck`.

---

## Layout (current)

| Area | Path | Role |
|------|------|------|
| Gateway | `apps/gateway/src` | HTTP `/health`, `/healthz`, `/message`; sessions; skill routing |
| Shared | `packages/shared` | `normalizePhone`, `parseDurationToMs`, `isTtlExpired`, `sanitizeInboundText`, `stableHash`, `ellipsis` |
| Skills | `packages/skills` | `pairing`, `report`, `echo` |
| Tests | `packages/*/test`, `apps/gateway/test` | pairing; phone; report; TTL; sanitization; gateway 401 |

No gateway listen-on-import in tests (`createGateway` + `index.ts` bootstrap). Vitest: `**/*.test.ts`.

Public HTTP success body today: `{ sessionId, skill, result }` where `result` is `{ text, tags? }`.

### Tooling (blocker, not a story)

**Status:** done

`@openclaw-eval/shared` and `@openclaw-eval/skills` exported `./dist/index.js`, but `dist/` is never produced until a successful build. Vitest then failed with `Failed to resolve entry for package "@openclaw-eval/shared"` (report suite never loaded). Skills `tsconfig` also included `test/**/*.ts` while `rootDir` was `src`, so `tsc -b` failed.

Fix: package `exports`/`main`/`types` now point at `src/index.ts` so `npm test` and `tsx` resolve source without a prior build. Skills tsconfig compiles `src` only.

`npm run typecheck` passes. `npm test` now **loads** both suites; remaining failures are story logic (see below).

---

## Story 1 — Pairing codes occasionally expire instantly

**Status:** done

**AC:** new code valid 10 minutes; ±15s clock tolerance; deterministic tests; do not change public API contracts.

**What changed**

- `isPairingCodeValid(req, nowMs)` unchanged signature. Age is computed in ms: valid when `-15s <= age <= 10min + 15s` (inclusive).
- Removed the 5-minute comment and the seconds/milliseconds mix.
- Tests use a fixed `createdAt` (no real clock): new code; 1ms before 10 min; +15s / -15s skew bounds; 1ms past tolerated expiry; 1ms before -15s.

**Left for later**

- `pairingSkill.run` still stamps `createdAt` as `now - 60_000` (not part of this story).
- Local `stableHash` duplicate (bonus).

---

## Story 2 — Normalize phone numbers consistently across skills

**Status:** done

**AC:** US numbers → `+1XXXXXXXXXX`; multiple input formats; logic in shared library; edge-case tests.

**What changed**

- Single implementation: `normalizePhone` in `packages/shared`. Digits only; 10 → `+1…`; 11 with leading `1` → `+…` (no double `+1`); already `+1555…` and punctuation/junk all land on `+1XXXXXXXXXX`.
- Removed local `normalizePhoneNumber` from `report.ts`; skill imports `normalizePhone`. Report command regex captures a formatted US phone (not `\S+`), so `(555) 123-4567` is the number, not `(555)`.
- Tests: `packages/shared/test/phone.test.ts` (10 digits, 11 with leading 1, already `+`, junk). Existing report skill test covers formatted 10-digit through the skill.

**Left for later**

- Report body still untrimmed (not this story).

---

## Story 3 — Session TTL should actually expire sessions

**Status:** done

**AC:** expire after `SESSION_TTL_SECONDS` (default 3600); expired sessions return 401; tests must not sleep in real time.

**What changed**

- TTL is `SESSION_TTL_SECONDS` (default 3600). Removed gateway `SESSION_TTL` / `parseDuration`.
- Shared `isTtlExpired(atMs, nowMs, ttlSeconds)`: expired when `nowMs - atMs >= ttlSeconds * 1000`.
- Existing expired session → 401 `{ error: "session_expired" }` (not a silent new session). `/health` and `/message` 200 shape unchanged.
- `createGateway({ now, ttlSeconds })` is testable; `index.ts` only listens. Tests jump a fake clock (no `sleep`).

**Left for later**

- Unused skill catalog lives in Story 6 (`availableSkills`).

---

## Story 4 — Sanitize messages globally

**Status:** done

**AC:** CRLF → LF; replace `\u2028` / `\u2029`; trim trailing whitespace per line; shared helper used by gateway.

**What changed**

- `sanitizeInboundText`: `\r\n`/`\r` → `\n`; `\u2028`/`\u2029` → `\n`; `trimEnd` per line; newlines kept (no longer replaced with spaces).
- Gateway still sanitizes inbound `/message` text before skills.
- Tests: shared unit tests for each rule + one gateway test that `/message` uses the helper.

**Left for later**

- Echo still does not sanitize itself (gateway already did). Report still calls sanitize again (idempotent).

---

## Story 5 — Improve /healthz endpoint safely

**Status:** done

**AC:** return `status`, `uptimeSeconds`, `skillsLoaded`, `version`; must not expose env secrets; response-shape tests.

**What changed**

- `GET /healthz` → `{ status: "ok", uptimeSeconds, skillsLoaded, version }`. Version is read from `apps/gateway/package.json`. Uptime is seconds since gateway start (`startedAt` / `now`), not `process.env`.
- `GET /health` unchanged: `{ ok: true, sessions }`.
- Test asserts exact keys, version from package.json, `uptimeSeconds` from injected clock, and that an env secret is not in the body.

**Left for later**

- Skill catalog is counted for `skillsLoaded`; routing still falls through to echo (Story 6).

---

## Story 6 — Unknown skill errors should be helpful

**Status:** not started

**AC:** 400 with `errorCode: UNKNOWN_SKILL`; include provided skill name and `availableSkills`; backward-compatible response shape.

**Current vs AC**

- `pickSkill` maps `pair*` → pairing, `report*` → report, **everything else → echo**. No 400, no `UNKNOWN_SKILL`.
- Need a compatible error body (existing clients still parse it) plus the new fields.

---

## Story 7 — Session status skill

**Status:** not started

**AC:** messages starting with `status` (case-insensitive) → `statusSkill`; response includes message count, session age in seconds, last 5 messages truncated to 80 chars; session data via `MessageContext` without breaking existing skills; ≥2 tests (n<5 and n>5 with truncation).

**Current vs AC**

- No `status` skill. `MessageContext` has only `channel`, `sender`, `text`, `timestampMs` — no session payload.
- Existing skills must keep working with the current `run(ctx)` shape (additive context only).

---

## Optional bonus

**Status:** not started (after stories 1–7)

Candidates already visible: misleading `Intentional...` comments, duplicate `stableHash`, `any` on `readJson` and `channel as any`, `ellipsis` off-by-one (`max - 1`).

---

## Last verification

Story 5 (this pass):
- `npm test` — 25 passed
- `npm run typecheck` — pass
- `npm run lint` — pass
