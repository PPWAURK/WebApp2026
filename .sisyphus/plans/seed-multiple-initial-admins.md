# Seed Multiple Initial Admins (ADMIN_EMAILS)

## TL;DR

> **Summary**: Update Prisma seed scripts to create/update multiple initial ADMIN users from `ADMIN_EMAILS`, using `ADMIN_DEFAULT_PASSWORD` only for missing users, and never overwriting existing passwords.
> **Deliverables**:
>
> - Env-driven admin seeding in `prisma/seed.ts` and `backend/prisma/seed.ts`
> - Strict parsing/validation + deterministic summary logging
> - Demo user seeding gated behind `SEED_DEMO_USERS` when `ADMIN_EMAILS` is set
>   **Effort**: Short
>   **Parallel**: YES (2 waves)
>   **Critical Path**: Seed parsing/validation -> seed logic update -> idempotency verification

## Context

### Original Request

- Seed multiple initial admins (instead of a single hardcoded admin).

### Inputs (from user)

- Admin emails (comma-separated):
  - `marketing@zhaogroupe.com`
  - `gestion@zhaogroupe.com`
  - `bonjour@zhaogroupe.com`
  - `comptabilite@zhaogroupe.com`
- Password strategy: use `ADMIN_DEFAULT_PASSWORD` (provided out-of-band; must not be stored in repo).

### Repo Facts (discovered)

- Seed scripts exist in two places and are currently duplicated:
  - `prisma/seed.ts`
  - `backend/prisma/seed.ts`
- Current seed uses `upsert` but overwrites `passwordHash` on every rerun.
- Prisma schema:
  - `User.email` is unique.
  - `User.passwordHash` is required.
  - `User.role` is `ADMIN | MANAGER | EMPLOYEE`.
  - `User.workplaceRole` is `SALLE | CUISINE | BOTH`.

## Work Objectives

### Core Objective

Seed multiple initial admin accounts from env in a safe, idempotent way.

### Definition of Done (verifiable)

- Running seed with `ADMIN_EMAILS` set to the 4 emails and `ADMIN_DEFAULT_PASSWORD` set:
  - creates missing users with `role=ADMIN`.
  - promotes existing users to `role=ADMIN`.
  - sets `isApproved=true`, `isOnProbation=false`, `workplaceRole=BOTH`.
- Re-running seed with a different `ADMIN_DEFAULT_PASSWORD` does not change `passwordHash` for already-existing users.

### Guardrails

- Never log `ADMIN_DEFAULT_PASSWORD` and never commit it.
- Fail fast if `ADMIN_EMAILS` has invalid emails.
- Fail fast if `ADMIN_EMAILS` is set and at least one listed admin user does not exist yet, but `ADMIN_DEFAULT_PASSWORD` is missing/blank.
- Do not create demo accounts (manager/employee) in production by accident when `ADMIN_EMAILS` is set; require `SEED_DEMO_USERS=true` to do so.

## Verification Strategy

- No unit tests required (seed script change); verify with commands + PrismaClient queries.
- Evidence: console outputs from the acceptance commands.

## Execution Strategy

### Parallel Execution Waves

Wave 1

- Implement env parsing/validation helpers in both seed scripts.

Wave 2

- Implement admin seeding behavior + demo-user gating.
- Run acceptance commands (create, rerun idempotency).

## TODOs

- [ ] 1. Add env parsing + validation in `prisma/seed.ts` and `backend/prisma/seed.ts`

  **What to do**:
  - Add helper `parseAdminEmails()`:
    - Read `process.env.ADMIN_EMAILS`.
    - Split by comma, trim, lowercase.
    - Filter empty entries; de-duplicate.
    - Validate each email with: `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
    - If any invalid -> throw `Error('Invalid admin email: ...')`.
  - Read `ADMIN_DEFAULT_PASSWORD` as a string (may be empty); do not log.
  - Read `SEED_DEMO_USERS` and treat only the literal string `"true"` as enabled.

  **Acceptance Criteria**:
  - [ ] `ADMIN_EMAILS="ok@example.com,not-an-email" npm run prisma:seed` exits non-zero with an explicit invalid-email error.

  **QA Scenarios**:

  ```
  Scenario: Invalid ADMIN_EMAILS fails
    Tool: Bash
    Steps: ADMIN_EMAILS="ok@example.com,not-an-email" npm run prisma:seed
    Expected: non-zero exit; message contains "Invalid admin email"
  ```

  **Commit**: YES | Message: `Add ADMIN_EMAILS parsing for seed` | Files: `prisma/seed.ts`, `backend/prisma/seed.ts`

- [ ] 2. Implement admin seeding loop with password idempotency

  **What to do**:
  - Determine `adminEmails`:
    - If parsed env list length > 0: use it.
    - Else fallback to `['admin@webapp2026.local']` (keeps current dev behavior).
  - For each email:
    - Fetch existing user by email.
    - If missing:
      - Require `ADMIN_DEFAULT_PASSWORD` to be non-empty.
      - Hash it with `bcrypt.hash(password, 10)`.
      - Create user with:
        - `email`, `passwordHash`, `role: ADMIN`, `isApproved: true`, `isOnProbation: false`, `workplaceRole: BOTH`, `name: null`.
    - If exists:
      - Update user with:
        - `role: ADMIN`, `isApproved: true`, `isOnProbation: false`, `workplaceRole: BOTH`.
      - IMPORTANT: omit `passwordHash` from update payload (never overwrite).
      - Keep existing `name` as-is.
  - Log only a summary: `adminsCreated`, `adminsUpdated`.
  - Demo users:
    - If `ADMIN_EMAILS` is set (env list length > 0) and `SEED_DEMO_USERS !== 'true'`, skip seeding the hardcoded `manager@...` and `employee@...` accounts.
    - If `SEED_DEMO_USERS === 'true'`, keep existing behavior but also avoid overwriting their `passwordHash` on rerun (same idempotency rule).

  **Acceptance Criteria**:
  - [ ] With `ADMIN_EMAILS` set to the 4 provided emails + `ADMIN_DEFAULT_PASSWORD` set, `npm run prisma:seed` completes successfully.
  - [ ] Re-running seed with a different `ADMIN_DEFAULT_PASSWORD` does not change `passwordHash` for those admins.

  **QA Scenarios**:

  ```
  Scenario: Create admins from ADMIN_EMAILS
    Tool: Bash
    Steps:
      1) export ADMIN_EMAILS="marketing@zhaogroupe.com,gestion@zhaogroupe.com,bonjour@zhaogroupe.com,comptabilite@zhaogroupe.com"
      2) export ADMIN_DEFAULT_PASSWORD="<secret set in env>"
      3) npm run prisma:seed
    Expected: exit 0; summary indicates created/updated admins

  Scenario: Password idempotency
    Tool: Bash
    Steps:
      1) node - <<'NODE'
         const { PrismaClient } = require('@prisma/client');
         (async () => {
           const prisma = new PrismaClient();
           const emails = [
             'marketing@zhaogroupe.com',
             'gestion@zhaogroupe.com',
             'bonjour@zhaogroupe.com',
             'comptabilite@zhaogroupe.com',
           ];
           const before = await prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true, passwordHash: true, role: true } });
           console.log(JSON.stringify(before));
           await prisma.$disconnect();
         })().catch((e) => { console.error(e); process.exit(1); });
         NODE
      2) export ADMIN_DEFAULT_PASSWORD="<different secret>"
      3) npm run prisma:seed
      4) node - <<'NODE'
         const { PrismaClient } = require('@prisma/client');
         (async () => {
           const prisma = new PrismaClient();
           const emails = [
             'marketing@zhaogroupe.com',
             'gestion@zhaogroupe.com',
             'bonjour@zhaogroupe.com',
             'comptabilite@zhaogroupe.com',
           ];
           const after = await prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true, passwordHash: true, role: true } });
           console.log(JSON.stringify(after));
           await prisma.$disconnect();
         })().catch((e) => { console.error(e); process.exit(1); });
         NODE
    Expected: passwordHash values unchanged; role remains ADMIN
  ```

  **Commit**: YES | Message: `Seed multiple initial ADMIN accounts` | Files: `prisma/seed.ts`, `backend/prisma/seed.ts`

- [ ] 3. Document env vars (no secrets)

  **What to do**:
  - Update these files (leave values blank):
    - `.env.example`
    - `.env.production.example`
    - `backend/.env.example`
    - `backend/.env.production.example`
  - Add:
    - `ADMIN_EMAILS=`
    - `ADMIN_DEFAULT_PASSWORD=`
    - `SEED_DEMO_USERS=false`
  - Add a note: do not commit real passwords.

  **Acceptance Criteria**:
  - [ ] Env var names present in the example files with empty values.

  **Commit**: YES | Message: `Document admin seed env vars` | Files: `.env.example`, `.env.production.example`, `backend/.env.example`, `backend/.env.production.example`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Code Quality Review - unspecified-high
- [ ] F3. Seed Behavior QA - unspecified-high
- [ ] F4. Scope Fidelity Check - deep

## Commit Strategy

- 2-3 commits (seed parsing, seed behavior, env docs).

## Success Criteria

- 4 admins are reliably present as ADMIN after seeding.
- Rerunning seed never changes existing passwords.
- No demo accounts are created unintentionally when `ADMIN_EMAILS` is set.
