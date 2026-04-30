# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ZHAO Plateforme 2026** — a store operations platform for a restaurant chain. Features include employee management, onboarding approval, training content distribution, procurement ordering, purchase returns, and store administration.

- **Backend**: NestJS 11 + Prisma 6 + MySQL 8.4 (TypeScript, REST API, JWT auth)
- **Frontend**: Expo 54 + React Native 0.81 + Expo Router 6 (TypeScript, mobile-first with web support)
- **Admin Frontend**: Separate Next.js app in `frontend-admin/` for internal administration
- **Languages**: French and Chinese throughout the UI

## Instruction Priority

When rules conflict: User task > [AGENTS.md](./AGENTS.md) > [RESPONSIVE_WEB_STANDARDS.md](./RESPONSIVE_WEB_STANDARDS.md) > This file > existing code style > general best practices.

---

## Commands

All commands run from the repository root unless noted.

### Development

```bash
# Start local MySQL (Docker, mapped to host port 3307)
npm run db:up

# Run backend in watch mode (port 3000)
npm run start:dev

# Run frontend web dev server (port 8081)
npm --prefix frontend run web

# Run frontend on iOS/Android
npm --prefix frontend run ios
npm --prefix frontend run android

# Run admin frontend dev server
npm run admin:dev
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
- `auth/` — JWT login, registration, email verification, password reset; `guards/jwt-auth.guard.ts` protects all non-public routes
- `users/` — split into focused services: `users.service` (CRUD), `users-approval.service` (registration review), `users-training-access.service` (training permissions), `users-workforce.service`
- `orders/` — procurement workflow: `orders.service` (core logic) + `orders-document.service` (PDF generation)
- `news/` — announcements & training posts with audience filtering and read tracking
- `products/` + `suppliers/` + `restaurants/` — catalog & location data
- `uploads/` — file management (images/videos/documents, categorized by module + section)
- `health/` — health check endpoint
- `mail/` — email service integration
- `prisma/` — Prisma service wrapper injected app-wide
- `config/` — environment validation at startup

**Key data model** (see `backend/prisma/schema.prisma`):
- `User`: role (`ADMIN | REGIONAL_MANAGER | MANAGER | EMPLOYEE`), workplaceRole (`SALLE | CUISINE | BOTH`), employeeLevel (`L0_PROBATION`…`L7_D`), restaurantId, trainingAccess (JSON)
- `EmployeeLevelAccessProfile`: access control configuration per employee level
- `NewsPost`: audience (`ALL | MANAGERS | EMPLOYEES`), visibleEmployeeLevels (JSON)
- `PurchaseOrder` / `PurchaseOrderItem`: order with PDF, delivery date, supplier
- `PurchaseReturn` / `PurchaseReturnItem` / `PurchaseReturnItemPhoto`: return workflow with photos
- `Document` / `ModuleCategory`: file records with module (`TRAINING | POLICY | MANAGEMENT | FORMS`) and section (e.g. `RECIPE_TRAINING`, `RED_RULES`); `ModuleCategory` for custom categories
- `TrainingQuizLink`: quiz URLs per training section and language

### Frontend (`frontend/`)

File-based routing via Expo Router with two route groups:
- `app/(auth)/` — login, register, verify-email, reset-password
- `app/(app)/` — all authenticated screens

Screen components live in `src/components/` (one directory per screen/feature). API calls are isolated in `src/services/` (e.g. `ordersApi.ts`, `usersApi.ts`). State is local (useState) or persisted via AsyncStorage — no Redux/Zustand.

**Data flow**: Screen component → service function (adds JWT header) → NestJS endpoint → Prisma → MySQL.

**Key shared resources**:
- `src/constants/breakpoints.ts` — canonical responsive breakpoints: `BREAKPOINT_COMPACT=560`, `BREAKPOINT_TABLET=768`, `BREAKPOINT_DESKTOP=1024`, `BREAKPOINT_WIDE=1180`, `BREAKPOINT_ULTRA_WIDE=1400`
- `src/constants/colors.ts` — color palette
- `src/utils/roleAccess.ts` / `orderAccess.ts` — access control utilities
- `src/locales/translations.ts` — all UI strings (French/Chinese i18n)

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

## Admin Frontend (`frontend-admin/`)

Separate Next.js application for internal administration. Run independently with `npm run admin:dev`. Has its own TypeScript config, lint, and build pipeline (`npm run admin:*`).

---

## Responsive Web Standard

For any frontend work involving responsive web layouts, desktop adaptations, tablet layouts, or web-specific UI fixes, Claude Code must follow [RESPONSIVE_WEB_STANDARDS.md](./RESPONSIVE_WEB_STANDARDS.md).

Important repository-specific expectations:

- Always import breakpoints from `src/constants/breakpoints.ts` — never hardcode magic numbers
- Prefer existing React Native Web patterns such as `useWindowDimensions()`, `Platform.OS === 'web'`, `.web.tsx`, and existing style factories/constants
- Keep mobile behavior stable first, then enhance tablet/desktop layouts
- Use the minimum necessary change and avoid unrelated refactors
