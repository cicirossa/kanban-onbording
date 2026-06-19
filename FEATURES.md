# Features

A catalog of every feature shipped in this monorepo, so anyone (AI or human) can see
what already exists before building something new. This is an **index** — for *how* a
feature works, follow the linked deep-dive docs in [`backend/docs/`](./backend/docs) and
[`frontend/docs/`](./frontend/docs) (see the [Documentation Map](./README.md#documentation-map)).

> **Before adding a feature:** check this list first to avoid duplicating something that
> already ships. To add one, follow the recipes in
> [`backend/docs/ADDING_FEATURES.md`](./backend/docs/ADDING_FEATURES.md) and
> [`frontend/docs/ADDING_FEATURES.md`](./frontend/docs/ADDING_FEATURES.md), then add a row
> here.

---

## Platform features

| Feature | What it does | Backend module | Frontend |
|---|---|---|---|
| **Authentication** | JWT access + refresh tokens, login/logout, token blacklisting, CSRF double-submit on refresh/logout | `auth/` (`/api/auth`) | `(auth)/login`, `(auth)/forgot-password`, `(auth)/reset-password` |
| **Google OAuth & OIDC SSO** | Social login + enterprise SSO (auth-code + PKCE, back-channel logout) | `auth/`, `sso/` (`/api/sso`) | login page buttons |
| **Email verification** | Token-based (24h) verify flow, enforced server-side via `JwtAuthGuard`, gated client-side | `auth/` | `(auth)/verify-email`, email-verification gate |
| **Invitations** | Invite-only onboarding — admin emails an invite link; invitee sets their own password (auto-verified) | `invitations/` (`/api/invitations`) | `(users)/invitations`, accept-invite page |
| **RBAC (roles & permissions)** | Roles + granular permission strings, enforced at the API (guards) and UI (sidebar + action buttons) | `roles/` (`/api/roles`), `permissions/` (`/api/permissions`) | `(databases)/roles`, `(databases)/permissions` |
| **User management** | CRUD users, assign roles/permissions, reset password | `users/` (`/api/users`) | `(users)/users`, profile page |
| **Media library** | S3-compatible upload, per-user ownership, admin override | `media/` (`/api/media`) | `(media)/media` |
| **Notifications** | Real-time Socket.IO gateway + HTTP polling fallback + browser desktop notifications | `notifications/` (`/api/notifications`) | `(content)/notifications` |
| **Kanban boards** ⭐ | Trello-style boards → columns → cards with drag-and-drop ordering (owner-private) | `boards/`, `columns/`, `cards/` | `(kanban)/kanban`, `(kanban)/kanban/$boardId` |
| **Email (Mailgun)** | Transactional email for verification, invites, password reset | `mail/` (no controller — event-driven) | — |
| **Health check** | `GET /api/health` — DB ping + heap memory (`@nestjs/terminus`) | `health/` (`/api/health`) | — |
| **Dashboard** | Recharts dashboard with quick-link cards | — | `index` route |
| **Settings & profile** | User profile edit + app settings | `users/` | `profile`, `settings` routes |

### Cross-cutting capabilities

- **Generic CRUD layer** — `BaseService<T>` ([backend/src/common/services/base.service.ts](backend/src/common/services/base.service.ts)): pagination, search, soft delete, domain events.
- **Soft deletes** — every entity has `@DeleteDateColumn`; nothing is hard-deleted.
- **Rate limiting** — global IP throttler (100 req/min); tighter limits on auth/upload.
- **Caching** — Redis with in-memory fallback (`CacheInterceptor` + `CacheService`).
- **Env validation** — Zod schema in [backend/src/config/env.ts](backend/src/config/env.ts), fails fast on boot.
- **Data tables** — generic sortable/searchable/paginated table with Excel export and URL-driven state (`useDataTable`).
- **PWA** — installable, offline-capable frontend.

---

## Kanban (most recently added)

A Trello-style task board. Each board belongs to its creator (**owner-private** — users only
ever see and edit their own boards); cards are not shared or assignable.

**Data model:** `Board → BoardColumn → Card` (the entity is `BoardColumn` / table
`board_columns` because `column` is a SQL reserved word).

**Cards** carry `title`, `description`, `dueDate`, and a `priority` enum (`low` / `medium` /
`high`). Columns and cards order via a fractional `position` (double precision) so a
drag-and-drop move persists as a single-row update.

### Backend

| Resource | Module | Endpoints |
|---|---|---|
| Boards | [backend/src/boards/](backend/src/boards/) | `GET/POST /api/boards`, `GET/PATCH/DELETE /api/boards/:id` (hydrates columns + cards) |
| Columns | [backend/src/columns/](backend/src/columns/) | `GET /api/columns?boardId=`, `POST /api/columns`, `PATCH/DELETE /api/columns/:id`, **`PATCH /api/columns/:id/move`** |
| Cards | [backend/src/cards/](backend/src/cards/) | `POST /api/cards`, `PATCH/DELETE /api/cards/:id`, **`PATCH /api/cards/:id/move`** |

- Services extend `BaseService<T>`; ownership is enforced in the service via `req.user.userId`
  scoping (nested-relation `where`), returning 404 (not 403) to avoid leaking existence.
- Deleting a board soft-deletes its columns and cards (cascade with eager-loaded relations).
- Move endpoints are dedicated (not generic `PATCH`) so position recalculation and
  cross-column ownership checks stay correct.

### Frontend

- **Routes:** [`(kanban)/kanban/index.tsx`](frontend/src/routes/%28kanban%29/kanban/index.tsx) (board grid),
  [`(kanban)/kanban/$boardId.tsx`](frontend/src/routes/%28kanban%29/kanban/$boardId.tsx) (interactive board).
- **Drag-and-drop:** `@dnd-kit/core` + `sortable` + `utilities`, with **optimistic** react-query
  cache updates (`onMutate` snapshot → midpoint position → rollback on error → `onSettled` reconcile).
- **Components:** [frontend/src/components/features/kanban/](frontend/src/components/features/kanban/) — `board-card`, `column`, `card`, and `board/column/card` modals.
- **Hooks:** [`use-boards.ts`](frontend/src/hooks/use-boards.ts) (board list), [`use-kanban-board.ts`](frontend/src/hooks/use-kanban-board.ts) (single board + DnD).
- **Services:** [`board.service.ts`](frontend/src/lib/services/board.service.ts), [`column.service.ts`](frontend/src/lib/services/column.service.ts), [`card.service.ts`](frontend/src/lib/services/card.service.ts).
- State split follows house rules: react-query owns server state, transient drag state is local React state, Zustand owns only modal UI state.

---

## Permission reference (RBAC surface)

All permission strings are seeded in
[backend/src/database/seeder/seeder.service.ts](backend/src/database/seeder/seeder.service.ts)
and typed in [backend/src/auth/permissions.type.ts](backend/src/auth/permissions.type.ts).
`menu.*` permissions toggle sidebar visibility; resource permissions gate API + UI actions.

| Resource | Permissions |
|---|---|
| **Menu (sidebar)** | `menu.dashboard`, `menu.users`, `menu.database`, `menu.roles`, `menu.permissions`, `menu.media`, `menu.invitations`, `menu.kanban` |
| **Users** | `users.invite`, `users.read`, `users.update`, `users.delete`, `users.manage_roles`, `users.manage_permissions` |
| **Roles** | `roles.create`, `roles.read`, `roles.update`, `roles.delete`, `roles.manage_permissions` |
| **Permissions** | `permissions.create`, `permissions.read`, `permissions.update`, `permissions.delete` |
| **Media** | `media.create`, `media.read`, `media.read_all`, `media.delete`, `media.delete_all` |
| **Boards** | `boards.create`, `boards.read`, `boards.update`, `boards.delete` |
| **Columns** | `columns.create`, `columns.read`, `columns.update`, `columns.delete` |
| **Cards** | `cards.create`, `cards.read`, `cards.update`, `cards.delete` |

> A new permission must be kept in sync across **four** places — see the checklist in
> [CLAUDE.md](./CLAUDE.md#adding-a-permission--keep-it-in-sync-across-all-four-places).
> Kanban permissions are granted to the standard `user` role since boards are owner-private.
