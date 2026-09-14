# Progress

Eval repo: `openclaw-vibe-eval`. Source of truth: acceptance criteria in `STORIES.md`. Comments marked `Intentional...` are not the spec.

Status key: `not started` · `in progress` · `done`

Verification for a story: `npm test`, `npm run lint`, `npm run typecheck`.

---

## Layout (current)

| Area | Path | Role |
|------|------|------|
| Gateway | `apps/gateway/src/index.ts` | HTTP `/health`, `/message`; sessions; skill routing |
| Shared | `packages/shared` | `normalizePhone`, `parseDurationToMs`, `sanitizeInboundText`, `stableHash`, `ellipsis` |
| Skills | `packages/skills` | `pairing`, `report`, `echo` |
| Tests | `packages/skills/test/*.test.ts` | pairing expiry; report 10-digit phone |

No gateway tests. No shared-package tests. Vitest: `**/*.test.ts`.

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

**Status:** not started

**AC:** US numbers → `+1XXXXXXXXXX`; multiple input formats; logic in shared library; edge-case tests.

**Current vs AC**

- Shared `normalizePhone`: 11-digit numbers starting with `1` become `+1` + all 11 digits (`15551234567` → `+115551234567`).
- Report skill uses a **local** `normalizePhoneNumber`, not shared. Local 11-digit path is `+${digits}` (different from shared).
- Only one test: 10-digit `(555) 123-4567` via `reportSkill`. No 11-digit / already-E.164 / punctuation cases.
- After the package resolve fix, that test **runs and fails**: local parser takes `\S+` so `(555)` is the “phone” and `123-4567 hello` is the body → `To: +555`. Shared `normalizePhone` is not used.

---

## Story 3 — Session TTL should actually expire sessions

**Status:** not started

**AC:** expire after `SESSION_TTL_SECONDS` (default 3600); expired sessions return 401; tests must not sleep in real time.

**Current vs AC**

- Env is `SESSION_TTL` string (`"30m"`), not `SESSION_TTL_SECONDS`. Local `parseDuration` duplicates shared `parseDurationToMs`.
- On expiry the gateway **creates a new session** and still returns 200 — never 401.
- Comment claims the TTL comparison is reversed / sessions never expire. The `< ttlMs` check is a normal “still alive” test; the real AC gap is missing 401 + wrong env/default.
- No session/TTL tests. `Date.now()` is used directly.

---

## Story 4 — Sanitize messages globally

**Status:** not started

**AC:** CRLF → LF; replace `\u2028` / `\u2029`; trim trailing whitespace per line; shared helper used by gateway.

**Current vs AC**

- `sanitizeInboundText` strips `\0`, replaces `\n` with a **space** (leaves `\r` from CRLF), then `.trim()` on the whole string. No Unicode separators, no per-line trailing trim.
- Gateway already calls it on inbound `/message` text. Echo’s “forgets to sanitize” comment is downstream of that.

---

## Story 5 — Improve /healthz endpoint safely

**Status:** not started

**AC:** return `status`, `uptimeSeconds`, `skillsLoaded`, `version`; must not expose env secrets; response-shape tests.

**Current vs AC**

- Route is `GET /health`, not `/healthz`. Body is `{ ok: true, sessions }` — no required fields.
- Secrets are not dumped today; keep it that way (`process.env` must not appear in the body).
- No health tests.

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

Candidates already visible: misleading `Intentional...` comments, duplicate `stableHash` / duration / phone helpers, `any` on `readJson` and `channel as any`, `ellipsis` off-by-one (`max - 1`).

---

## Last verification

Story 1 (this pass):
- pairing tests: 6 passed (fixed `createdAt`, boundaries, ±15s)
- `npm test` — pairing green; report still fails (Story 2, untouched)
- `npm run typecheck` — pass
- `npm run lint` — fail on pre-existing unused `skills` in `apps/gateway/src/index.ts` (not this story)
