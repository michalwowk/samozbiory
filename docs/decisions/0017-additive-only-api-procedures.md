# 0017 — API procedures are additive only

- **Status:** accepted
- **Date:** 2026-09-26

## Context

On the web, client and server ship together: a breaking change to a procedure and the code calling it
land in the same deploy. **A mobile app cannot be force-updated.** A user who installed in March will
still be calling the API in December. The same applies to any partner integrating against the public
REST surface.

This asymmetry is invisible until the first mobile release, at which point it is expensive.

## Decision

Published procedures change additively only. Do not remove a field, narrow a type, make an optional
input required, or change the meaning of an existing value. A breaking change is a **new procedure**.

## Consequences

- Today this is one sentence in `packages/api/AGENTS.md` and costs nothing.
- After a mobile release it is the only thing standing between a routine refactor and broken phones in
  users' hands.
- Procedures accumulate. That is the intended trade: a deprecated procedure is cheap, a broken client is
  not. Removal requires evidence that no live client still calls it.
