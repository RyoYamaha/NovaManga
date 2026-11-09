# Frontend architecture

The application uses a feature-oriented structure. Route URLs are defined centrally while feature-owned pages, API modules, hooks, types, and UI live together. The migration is incremental: shared infrastructure stays global until ownership and call sites are clear.

## Current structure

```text
src/
├── app/
│   ├── AppProviders.tsx       Global React Query and dialog providers
│   └── NotFound.tsx           App-level fallback screen
├── assets/                    Static assets
├── components/
│   ├── comment/               Shared comment section
│   ├── common/                App-wide dialog, errors, pagination controls
│   ├── content/               Content UI shared across multiple features
│   ├── layout/                Shared layout shells and navigation
│   ├── shared/                Cross-feature UI
│   └── ui/                    Generic UI primitives
├── features/
│   ├── admin/                 Admin screens, API, and types
│   ├── ai/                    Assistant screen, UI, hooks, API, and types
│   ├── auth/                  Login/register, auth UI, API, and types
│   ├── catalog/               Home, onboarding/preferences, and preference API
│   ├── content/               Reader-facing content detail
│   ├── creator/               Author/publisher and shared creator workflows
│   ├── library/               Library screen, collection hook, API, and types
│   ├── notifications/         Inbox screen, API, and types
│   ├── profile/
│   ├── reading-history/
│   ├── reader/                Manga/novel reading screens and settings
│   ├── reports/
│   ├── support/
│   └── wallet/
├── hooks/                     App-wide hooks shared across features
├── lib/                       API client and infrastructure utilities
├── routes/
│   ├── AccessRoutes.tsx       Role-based nested-route guards
│   ├── ProtectedRoute.tsx
│   ├── PublisherRoute.tsx
│   └── router.tsx             URL definitions and lazy route loading
├── services/                  Cross-feature API/domain modules
├── stores/                    App-wide state
├── types/                     Types used by multiple features
├── App.tsx
└── main.tsx
```

Creator pages are grouped under `features/creator/pages/author`, `publisher`, and `shared`. Shared workflows use the shared creator implementation; role-specific entry points should stay thin and must not become the source of a shared implementation.

## Ownership rules

- `routes/` owns route paths, layouts, and access guards; page implementations belong to a feature.
- A feature owns its UI, hooks, types, API calls, and styles when these are feature-specific.
- `components/ui/` contains generic primitives. `components/common/` is reserved for pieces used across unrelated features.
- Keep genuinely cross-feature UI (for example shared content cards, comment UI, and content actions) global until it can be moved without creating feature-to-feature coupling.
- Keep `services/` and `types/` only for modules shared by multiple features or infrastructure. Move a module only after checking all imports and ownership.
- Avoid importing one feature's page from another feature. Share reusable behavior through a feature API/hook or an app-level component, not through route screens.
- Split a large screen when a section has its own cohesive state, behavior, or reuse; line count alone is not a reason to create a component.
- Preserve route URLs, access control, and observable behavior during reorganization.

## Completed structure work

- All route page implementations are now grouped in `features/`; `NotFound` and provider composition are in `app/`.
- Reader pages, flip/scroll views, reader settings, types, and styles are owned by `features/reader/`.
- Auth, AI, admin, creator, library, notification, and catalog API/type modules have moved beside their owning feature.
- AI/auth UI and AI/library hooks now live with their features.
- Shared earnings implementation lives in `features/creator/pages/shared`; summary cards, revenue/payout activity, bank profile, and payout request form live in dedicated creator components, and the author path remains a small compatibility wrapper.
- Content synopsis, chapter browsing, work information, and similar-content display are isolated under `features/content/components/`.
- Content detail breadcrumb, loading/error states, read/share/report actions, and the main synopsis/chapter/discussion column are isolated under `features/content/components/`.
- Admin user table and edit form, AI user access, publication/publisher review, payment reconciliation, bank settings, payout settings, payout request QR/table, and pending payment order panels live under `features/admin/components/`.
- Report review detail and the published-content listing table live under `features/admin/components/`.
- AI usage statistics are isolated in `features/admin/components/AiUsageSummary.tsx`.
- Creator story editing delegates chapter management UI to `features/creator/components/StoryChapterManagement.tsx`.
- Creator manga chapter editing delegates the sortable image-page gallery to `features/creator/components/MangaPageGrid.tsx`.
- Novel pagination logic and page navigation controls are separated under `features/reader/`.
- Onboarding genre selection, coin explanation, reader feature steps, and the saved-preferences genre grid are isolated under `features/catalog/components/`.
- Homepage continue-reading and personalized recommendation rails are isolated under `features/catalog/components/`.
- Wallet transaction history and active deposit order details live under `features/wallet/components/`.
- Route URLs and lazy loading remain centralized in `routes/router.tsx`.

## Deliberately shared modules

The remaining global services and types are used across feature boundaries and should only be split into endpoint-focused modules after call-site and contract review:

- `content.service.ts`, `chapter.service.ts`, `reading-progress.service.ts`, `finance.service.ts`, `unlock.service.ts`
- `comment.service.ts`, `rating.service.ts`, `report.service.ts`, `ticket.service.ts`
- `types/content.ts`, `types/chapter.ts`
- `hooks/useChapterNav.ts`

## Follow-up code decomposition

Feature ownership is now clear, but some screen implementations still combine data loading, actions, and multiple UI sections. Review these in separate behavior-preserving changes:

1. Reassess screens around 300–400 lines (for example catalog home, registration, and admin moderation) only when a distinct stateful section warrants extraction; no feature page currently exceeds 400 lines.
2. Keep the vendor code-splitting groups in `vite.config.ts` aligned with actual package boundaries; verify bundle sizes after dependency changes.

Rolldown splits package dependencies into vendor chunks. The production build no longer emits a JavaScript chunk above 500 KB; component moves and bundle optimization remain separate concerns.

## Validation

Run `npm run build` in `Frontend/` after each migration. Run `npm run lint -- <paths>` for changed feature areas and verify the affected routes, role guards, and workflows.
