# STORIES

---

## Story 1 — Pairing codes occasionally expire instantly
**Acceptance Criteria**
- Newly generated pairing code valid for 10 minutes.
- ±15s clock tolerance.
- Deterministic validation with tests.
- Do not change public API contracts.

---

## Story 2 — Normalize phone numbers consistently across skills
**Acceptance Criteria**
- Normalize US numbers to +1XXXXXXXXXX.
- Handle multiple input formats.
- Logic must live in a shared library.
- Add tests for edge cases.

---

## Story 3 — Session TTL should actually expire sessions
**Acceptance Criteria**
- Sessions expire after SESSION_TTL_SECONDS (default 3600).
- Expired sessions return 401.
- Tests must not rely on real-time sleeping.

---

## Story 4 — Sanitize messages globally
**Acceptance Criteria**
- Convert CRLF to LF.
- Replace Unicode separators (\u2028, \u2029).
- Trim trailing whitespace per line.
- Implement as shared helper used by gateway.

---

## Story 5 — Improve /healthz endpoint safely
**Acceptance Criteria**
- Return status, uptimeSeconds, skillsLoaded, version.
- Must not expose env secrets.
- Add response shape tests.

---

## Story 6 — Unknown skill errors should be helpful
**Acceptance Criteria**
- Return 400 with errorCode: UNKNOWN_SKILL.
- Include provided skill name and availableSkills list.
- Maintain backward-compatible response shape.

---

## Story 7 — Session status skill

Users want a quick way to see their current session state. Add a `status` skill so that when the message text starts with `status`, the gateway responds with a session summary.

**Acceptance Criteria**
- Route messages starting with `status` (case-insensitive) to a new `statusSkill`.
- Response text must include: message count, session age in seconds, and the last 5 messages each truncated to 80 characters.
- The skill must receive session data through `MessageContext` without breaking existing skills (they must continue to work unmodified).
- Add at least two tests: one with fewer than 5 messages, one with more than 5 that verifies truncation.

---

## Optional Bonus Tasks
- Remove misleading comments or dead code if found.
- Improve type safety where `any` leaks across boundaries.
- Fix suspicious one-liners or operator-precedence bugs if encountered.
