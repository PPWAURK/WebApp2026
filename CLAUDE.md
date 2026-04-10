# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ZHAO Plateforme 2026** — a store operations platform for a restaurant chain. Features include employee management, onboarding approval, training content distribution, procurement ordering, and store administration.

- **Backend**: NestJS 11 + Prisma 6 + MySQL 8.4 (TypeScript, REST API, JWT auth)
- **Frontend**: Expo 54 + React Native 0.81 + Expo Router 6 (TypeScript, mobile-first with web support)
- **Languages**: French and Chinese throughout the UI

---

## Commands

All commands run from the repository root unless noted.

### Development

```bash
# Start local MySQL
npm run db:up

# Run backend in watch mode (port 3000)
npm run start:dev

# Run frontend web dev server (port 8081)
npm --prefix frontend run web

# Run frontend on iOS/Android
npm --prefix frontend run ios
npm --prefix frontend run android
```

### Testing

```bash
npm run test              # Backend unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage
npm run test:e2e          # End-to-end tests

# Run a single test file
npx jest path/to/spec.ts

# Run tests matching a pattern
npx jest --testNamePattern "UserService"
```

### Lint, Typecheck & Format

```bash
npm run lint              # ESLint
npm run lint:fix          # ESLint with auto-fix
npm run format            # Prettier
npm run typecheck         # TypeScript check (backend + frontend)
npm run verify            # Full CI check: lint + typecheck + test + e2e + build
```

### Database

```bash
npm run prisma:generate         # Regenerate Prisma Client after schema changes
npm run prisma:migrate          # Create & run dev migration
npm run prisma:migrate:deploy   # Apply migrations in production
npm run prisma:seed             # Seed initial admin users
npm run prisma:studio           # Open Prisma Studio GUI
```

### Build

```bash
npm run build                    # Backend + frontend
npm --prefix backend run build   # Backend only
npm --prefix frontend run build  # Frontend web export
```

---

## Architecture

### Backend (`backend/src/`)

NestJS modules with thin controllers and business logic in services. Each feature module is self-contained.

**Module layout**:
- `auth/` — JWT login, registration, password reset
- `users/` — split into focused services: `users.service` (CRUD), `users-approval.service` (registration review), `users-training-access.service` (training permissions), `users-workforce.service`
- `orders/` — procurement workflow: `orders.service` (core logic) + `orders-document.service` (PDF generation)
- `news/` — announcements & training posts with audience filtering and read tracking
- `products/` + `suppliers/` + `restaurants/` — catalog & location data
- `uploads/` — file management (images/videos/documents, categorized by module + section)
- `prisma/` — Prisma service wrapper injected app-wide
- `config/` — environment validation at startup

**Key data model** (see `backend/prisma/schema.prisma`):
- `User`: role (`ADMIN | MANAGER | EMPLOYEE`), employeeLevel (`L0_PROBATION`…`L7_D`), restaurantId, trainingAccess (JSON)
- `NewsPost`: audience (`ALL | MANAGERS | EMPLOYEES`), visibleEmployeeLevels (JSON)
- `PurchaseOrder` / `PurchaseOrderItem`: order with PDF, delivery date, supplier
- `Document`: file record with module (`TRAINING | POLICY | MANAGEMENT | FORMS`) and section (e.g. `RECIPE_TRAINING`, `RED_RULES`)

### Frontend (`frontend/`)

File-based routing via Expo Router with two route groups:
- `app/(auth)/` — login, register, reset-password
- `app/(app)/` — all authenticated screens

Screen components live in `src/components/` (one directory per screen/feature). API calls are isolated in `src/services/` (e.g. `ordersApi.ts`, `usersApi.ts`). State is local (useState) or persisted via AsyncStorage — no Redux/Zustand.

**Data flow**: Screen component → service function (adds JWT header) → NestJS endpoint → Prisma → MySQL.

### Auth & Access Control

- JWT issued at login, stored in AsyncStorage, sent as `Authorization: Bearer <token>`
- `JwtAuthGuard` protects all non-public routes
- `EmployeeLevel` JSON field on `User` determines which training sections are visible
- Restaurant association restricts order and staff access
- New user registrations require manager/admin approval before login is permitted

### File Storage

Files are saved to `STORAGE_ROOT_PATH` on the host (mounted at `/data/storage` in Docker). Public URLs are built from `PUBLIC_API_BASE_URL + API_PREFIX`. Upload endpoints support single and multiple files.

### Environment Variables

See `.env.example`. Key vars: `DATABASE_URL`, `JWT_SECRET`, `STORAGE_ROOT_PATH`, `PUBLIC_API_BASE_URL`, `API_PREFIX` (default `/backend2` in production).

---

## Code Standards (from AGENTS.md)

- **Single responsibility**: each function does one thing; controllers stay thin
- **Function size**: ideal 10–30 lines; refactor at 60+
- **Service size**: ideal 80–200 lines; hard limit 300 lines without justification — split into companion services when exceeded (see `users-*` pattern)
- **No `any`**: strong typing required throughout
- **Naming**: no vague terms like `Manager`, `Handler`, `Helper`, `Processor`; use verb-first utilities (`buildOrderPayload`, `validateEmail`); hooks use `use*` prefix
- **DTOs**: all controller inputs validated via class-validator DTOs; backend is the source of truth for the API contract
- After modifying `backend/prisma/schema.prisma`, always run `npm run prisma:generate`
