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

---

## Story 1 — Pairing codes occasionally expire instantly

**Status:** not started

**AC:** new code valid 10 minutes; ±15s clock tolerance; deterministic tests; do not change public API contracts.

**Current vs AC**

- `isPairingCodeValid` converts age to **seconds**, then compares to `5 * 60 * 1000` (milliseconds). Units are mixed; TTL is 5 minutes in comments, not 10 minutes in AC.
- Existing test (`packages/skills/test/pairing.test.ts`) expects expiry after 5 minutes and no ±15s window — that test itself does not match AC.
- `pairingSkill.run` stamps `createdAt` as `ctx.timestampMs - 60_000` (already 1 minute old).
- Duplicate local `stableHash` (also in `packages/shared`).

**Public contract to keep:** `isPairingCodeValid(req, nowMs)`, `PairingRequest`, skill name `pairing`.

---

## Story 2 — Normalize phone numbers consistently across skills

**Status:** not started

**AC:** US numbers → `+1XXXXXXXXXX`; multiple input formats; logic in shared library; edge-case tests.

**Current vs AC**

- Shared `normalizePhone`: 11-digit numbers starting with `1` become `+1` + all 11 digits (`15551234567` → `+115551234567`).
- Report skill uses a **local** `normalizePhoneNumber`, not shared. Local 11-digit path is `+${digits}` (different from shared).
- Only one test: 10-digit `(555) 123-4567` via `reportSkill`. No 11-digit / already-E.164 / punctuation cases.

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

Not run yet (no code changes this pass).
