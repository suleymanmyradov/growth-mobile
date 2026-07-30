# AGENTS.md — Growth Mobile

React Native consumer application for the Growth self-development platform. This is a separate repository from `../frontend`, `../backend`, and `../admin-frontend`.

The app targets iOS and Android with Expo and React Native. It provides native versions of the consumer web app's habits, goals, check-ins, articles, saved content, search, activity, onboarding, profile, settings, notifications, AI coaching, voice coaching, weekly reviews, reporting, and subscription experiences.

## Current repository state

This repository initially contains architecture and implementation rules only. Do not start feature implementation until Phase 0 in this document is complete and its backend blockers have been resolved or explicitly deferred.

## Sources of truth — precedence is mandatory

When sources disagree, use this order:

1. Backend HTTP contracts in `../backend/services/gateway/contract/main.api` and `types.api`.
2. Backend protobuf contracts under `../backend/services/microservices/*/api/v1/` when gateway behavior needs clarification.
3. Backend implementation for custom multipart or SSE endpoints that are not generated from `.api` files.
4. Mobile runtime schemas and generated API types in this repository.
5. Consumer web behavior in `../frontend` as a UX and product reference only.

The web frontend is not an API contract and is not a component library. Previously known drift (`/activities` vs `/activity`, `/onboarding/generate-habits` vs `/personalization/onboarding-habits`) was resolved in the web frontend on 2026-07-22 by aligning the web API client to the gateway contract.

Never reproduce drift to match the web app. Fix the source contract or the incorrect consumer first, regenerate artifacts, and add a contract test.

## Documentation-first rule

Expo and React Native APIs change quickly. Before any task involving Expo, Expo Router, React Native, EAS, or an Expo SDK package:

1. Read this file.
2. Fetch and read the relevant current official Expo documentation from `https://docs.expo.dev/`.
3. Confirm the installed Expo SDK and package versions in `package.json` and the lockfile.
4. Use versioned documentation matching the installed SDK when available.
5. Do not rely on remembered APIs or examples from another SDK.

For third-party native libraries, verify current Expo SDK compatibility, New Architecture support, maintenance status, and whether a config plugin or development build is required before use.

## Locked technical direction

Do not replace these choices without an approved architecture change recorded in this file.

| Concern                | Choice                                                                           | Rule                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime                | Expo SDK 57, React Native, TypeScript strict mode                                | Start from Expo's `default@sdk-57` template. Use development builds, not Expo Go, as the supported workflow.                                                      |
| Package manager        | Bun                                                                              | Keep `bun.lock`; do not add npm, pnpm, or Yarn lockfiles.                                                                                                         |
| Navigation             | Expo Router                                                                      | File-based routes, typed routes, route groups, protected routes. Import navigation APIs from Expo Router, not external `@react-navigation/*` application imports. |
| Server state           | `@tanstack/react-query`                                                          | API data never belongs in Zustand. Configure native focus and online managers.                                                                                    |
| Client state           | Zustand                                                                          | Only session metadata, onboarding draft, UI preferences, and ephemeral cross-screen state.                                                                        |
| Forms                  | `react-hook-form`, Zod, `@hookform/resolvers`                                    | One schema powers validation and inferred form types.                                                                                                             |
| HTTP                   | `axios` for JSON/multipart; `expo/fetch` for SSE streams                         | One shared authenticated client; no feature-local Axios instances.                                                                                                |
| Secure secrets         | `expo-secure-store`                                                              | Tokens never go to SQLite, AsyncStorage, logs, analytics, crash reports, URLs, or Zustand persistence.                                                            |
| Non-secret persistence | `expo-sqlite` and `expo-sqlite/kv-store`                                         | Persist query cache, onboarding draft, theme, locale, and non-sensitive preferences.                                                                              |
| Styling                | React Native `StyleSheet` plus typed design tokens                               | Do not use Tailwind/NativeWind or copy web class strings. Do not add a full UI kit.                                                                               |
| Images                 | `expo-image`, `expo-image-picker`, `expo-image-manipulator`                      | Cache remote images; resize/compress uploads before sending.                                                                                                      |
| Audio                  | `expo-audio`, `expo-file-system`                                                 | Replace browser `MediaRecorder` and Blob assumptions with native file URIs.                                                                                       |
| Notifications          | `expo-notifications`, `expo-device`, `expo-application`, `expo-constants`        | Push requires backend device registration. In-app notification APIs remain React Query data.                                                                      |
| OAuth                  | `expo-auth-session` and `expo-web-browser`                                       | Exchange authorization codes at the existing backend. Never embed an OAuth client secret. Use a development build for redirect testing.                           |
| Apple login            | `expo-apple-authentication`                                                      | Required before an iOS release if another social login is offered; requires a backend contract.                                                                   |
| Icons                  | `lucide-react-native` and `react-native-svg`                                     | Preserve the web product's icon language without importing DOM packages.                                                                                          |
| Animation/gestures     | `react-native-reanimated`, `react-native-gesture-handler`                        | Motion must respect reduced-motion settings.                                                                                                                      |
| Long lists             | `@shopify/flash-list`                                                            | Use for feeds, notifications, search, saved items, and conversation history.                                                                                      |
| Sheets                 | `@gorhom/bottom-sheet`                                                           | Use for native action/form sheets where a full screen is not appropriate.                                                                                         |
| Connectivity           | `@react-native-community/netinfo`                                                | Wire to TanStack Query `onlineManager`; no custom polling loop.                                                                                                   |
| Markdown               | `react-native-markdown-display`                                                  | Render a supported markdown subset; do not render arbitrary HTML in a WebView.                                                                                    |
| Localization           | `i18next`, `react-i18next`, `expo-localization`                                  | No new user-facing string may be hardcoded after i18n foundation lands.                                                                                           |
| Errors                 | `@sentry/react-native`                                                           | Scrub request bodies, tokens, message content, and personal data.                                                                                                 |
| Product analytics      | PostHog behind a local `Analytics` interface                                     | Consent-aware, typed event names, no sensitive payloads. Do not call vendor APIs from features.                                                                   |
| Subscriptions          | `react-native-purchases` (RevenueCat)                                            | Native digital subscriptions use StoreKit/Google Play Billing, not Stripe Checkout in a WebView.                                                                  |
| Unit/component tests   | `jest-expo`, React Native Testing Library                                        | Test behavior and accessibility, not component internals.                                                                                                         |
| API mocking            | MSW where React Native support is verified; otherwise a shared transport adapter | Never mock feature hooks directly in integration tests.                                                                                                           |
| E2E                    | Maestro                                                                          | Cover critical user journeys on iOS and Android.                                                                                                                  |

Install Expo-owned/native packages with `bunx expo install` so versions match the installed SDK. Install ordinary JavaScript packages with `bun add`. Do not use floating versions. Prefer releases at least seven days old unless an Expo SDK compatibility matrix requires otherwise.

## System architecture

```text
Native UI / Expo Router routes
              │
              ▼
Feature screens + feature hooks
              │
       ┌──────┴────────┐
       ▼               ▼
TanStack Query      Zustand
(server state)   (small client state)
       │
       ▼
Feature repositories / API functions
       │
       ▼
Authenticated HTTP client ── Secure token manager
       │                         │
       ├── JSON / multipart      └── SecureStore
       └── expo/fetch SSE
       │
       ▼
Growth gateway `/api/v1`
       │
       ▼
Existing backend microservices through gateway only
```

The mobile app talks only to the public gateway. It never talks directly to gRPC services, databases, Kafka, MinIO, Meilisearch, Stripe, or AI providers.

### Dependency direction

Allowed:

```text
app routes → features → core/domain
features → design-system
features → core API/query/storage/telemetry
core → no feature
shared design-system → core theme/types only
```

Forbidden:

- One feature importing another feature's screen, internal component, store, or repository.
- `core` importing `features` or `app`.
- Route files containing business logic, HTTP calls, schemas, or substantial UI.
- UI components calling Axios/fetch directly.
- API modules importing route or presentation code.
- Cross-repository runtime imports such as `../frontend/src/...`.
- Symlinking source from sibling repositories.
- Creating a second API client, query client, token store, theme system, or analytics client.

Enforce boundaries with ESLint `no-restricted-imports`. Public feature imports go through a feature `index.ts` only when a public surface is genuinely needed.

## Required directory layout

```text
mobile/
├── app/
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── (public)/
│   ├── (onboarding)/
│   └── (app)/
│       ├── _layout.tsx
│       ├── (tabs)/
│       ├── article/[id].tsx
│       ├── conversation/[conversationId].tsx
│       ├── goals.tsx
│       ├── weekly-review.tsx
│       ├── notifications.tsx
│       ├── search.tsx
│       ├── saved.tsx
│       ├── activity.tsx
│       ├── settings.tsx
│       └── report.tsx
├── src/
│   ├── core/
│   │   ├── api/
│   │   │   ├── generated/
│   │   │   ├── auth/
│   │   │   ├── client.ts
│   │   │   ├── errors.ts
│   │   │   ├── multipart.ts
│   │   │   └── sse.ts
│   │   ├── auth/
│   │   ├── config/
│   │   ├── query/
│   │   ├── storage/
│   │   ├── telemetry/
│   │   └── testing/
│   ├── design-system/
│   │   ├── components/
│   │   ├── tokens/
│   │   └── theme/
│   ├── features/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── home/
│   │   ├── habits/
│   │   ├── goals/
│   │   ├── check-ins/
│   │   ├── explore/
│   │   ├── articles/
│   │   ├── saved/
│   │   ├── search/
│   │   ├── activity/
│   │   ├── notifications/
│   │   ├── ai-coach/
│   │   ├── weekly-review/
│   │   ├── profile/
│   │   ├── settings/
│   │   ├── billing/
│   │   └── report/
│   ├── i18n/
│   └── types/
├── assets/
├── e2e/
├── scripts/
├── app.config.ts
├── eas.json
└── package.json
```

Each feature may contain `api/`, `components/`, `hooks/`, `screens/`, `schemas/`, `store/`, `types/`, and `__tests__/`. Do not create every folder preemptively.

## Navigation design

### Route groups

- `(public)`: sign in, register, check email, verify email, forgot password, reset password.
- `(onboarding)`: seven-step onboarding flow; authenticated users with incomplete onboarding only.
- `(app)`: authenticated application.
- `(app)/(tabs)`: Today, Plan, Coach, Library, Me. The approved Paper redesign and migration sequence are in `mobile.md`.

Use Expo Router protected routes at group boundaries. The authenticated profile and settings determine whether the user enters onboarding or the app. A route guard is defense-in-depth only; authorization remains a backend responsibility.

### Screen mapping

| Web experience               | Native destination                                                      |
| ---------------------------- | ----------------------------------------------------------------------- |
| `/`                          | Today tab: coach insight, daily check-ins, compact goal progress        |
| `/explore`                   | Library tab, Explore segment                                            |
| `/habits`                    | Plan tab: habits nested under goals                                     |
| `/ai-coach`                  | Coach tab: conversation list/new conversation                           |
| `/ai-coach/[conversationId]` | Conversation stack screen                                               |
| `/profile`                   | Me tab: profile and settings                                            |
| `/goals`                     | Plan tab or compatible goals destination                                |
| `/weekly-review`             | Progress stack screen                                                   |
| `/article/[id]`              | Article detail stack screen                                             |
| `/search`                    | Library search                                                          |
| `/saved`                     | Library tab, Saved segment                                              |
| `/activity`                  | Progress stack screen                                                   |
| Web notification side panel  | Notifications stack screen/sheet                                        |
| `/settings`                  | Settings stack screen                                                   |
| `/report`                    | Report stack screen                                                     |
| `/pricing`                   | Native paywall/subscription screen                                      |
| `/community`                 | Defer until the backend and product behavior are real; do not invent it |

Every content destination must support deep links. Notification payloads may contain only validated internal route identifiers and IDs, never arbitrary URLs passed to the router.

## Reuse policy for `../frontend`

Reuse concepts and platform-neutral logic deliberately; do not mechanically copy files.

### May be ported after review

- Domain names and product behavior.
- Zod schema semantics from `../frontend/src/lib/validation.ts`, reconciled with the backend contract.
- Type concepts from `../frontend/src/api/types.ts`, preferably replaced by generated contract types.
- React Query key conventions, mutation invalidation, and optimistic update ideas from `../frontend/src/hooks/`.
- Zustand onboarding state shape and non-sensitive UI state.
- Constants and pure date/category formatting utilities after removing browser assumptions.
- Product semantics and behavior, but visual tokens follow the approved Paper palette in `mobile.md`, not the web frontend’s older multi-accent palette.
- User-visible copy after moving it into i18n resources.

### Must be rewritten for native

- All JSX components. `div`, `button`, CSS, Radix, DOM events, and responsive browser layouts are not reusable React Native UI.
- Next.js routes, layouts, Server Components, server actions, proxy, BFF, middleware, caching, metadata, and route handlers.
- Cookie-based authentication and the BFF refresh flow.
- Tailwind classes, CSS variables, hover styles, web breakpoints, and browser-only animations.
- `next/link`, `next/navigation`, `next/image`, and `next/font` usage.
- `MediaRecorder`, Blob-centric audio capture, browser file inputs, and object URLs.
- `@assistant-ui/*`; implement native chat primitives around the backend protocol.
- Stripe Checkout/portal navigation for native digital subscriptions.

Do not claim a web UI component is reusable merely because its behavior is similar. Only pure logic without DOM, Next.js, CSS, or browser dependencies is directly portable.

## API contract and generated code rules

- Base path is `${EXPO_PUBLIC_API_ORIGIN}/api/v1`. `EXPO_PUBLIC_API_ORIGIN` must be an absolute HTTPS origin in non-development builds.
- The backend `.api` files are authoritative. Regenerate backend Swagger with `make swagger-api` from `../backend` before regenerating mobile types.
- Generate TypeScript API types with `openapi-typescript` into `src/core/api/generated/`.
- Generated files are read-only. Never hand-edit them.
- Runtime validation remains mandatory at network boundaries. Keep Zod schemas near their owning feature or in `core/api` for shared envelopes.
- Keep all route strings in one typed endpoint registry or generated client. Do not inline `/api/v1` paths in screens/components.
- Convert backend errors into one `ApiError` shape containing HTTP status, stable code, user-safe message, optional limit, optional upgrade trigger, and correlation/request ID when available.
- Preserve the backend page envelope: `{ data, page: { total, page, limit, totalPages } }`.
- Validate IDs before interpolation and always URL-encode path parameters.
- Default JSON timeout is 15 seconds. Long-running generation and uploads must use explicit operation-specific timeouts and cancellation.
- Never retry non-idempotent mutations automatically. Queries may retry network/5xx failures with bounded exponential backoff and jitter; never retry ordinary 4xx responses.
- Add `X-Device-Id` to login/register after creating a random installation ID. Treat it as an installation identifier, not a hardware fingerprint.
- Do not send backend service-auth credentials from the app.

Custom multipart/SSE routes currently registered outside generated gateway routes are:

- `POST /api/v1/files/upload`
- `POST /api/v1/personalization/transcribe`
- `POST /api/v1/personalization/voice-turn`

Their transport adapters require dedicated integration tests because they may not appear completely in generated OpenAPI output.

## Authentication and token lifecycle — hard rules

The web app's httpOnly-cookie/BFF design cannot be used in native. Native calls the gateway directly.

1. Login, email verification, or OAuth returns access token, refresh token, expiry, and profile.
2. Keep the access token in memory and persist the token pair only through `expo-secure-store` when session restoration is required.
3. Attach `Authorization: Bearer <access-token>` in the shared HTTP transport.
4. On 401, run exactly one refresh operation for the entire process. Concurrent failed requests await the same refresh promise.
5. Refresh rotates both tokens. Persist the new pair atomically before replaying requests once.
6. If refresh fails, clear SecureStore, query cache, persisted user-scoped cache, Zustand session state, and push registration, then return to sign-in.
7. Never refresh recursively and never retry a replayed request a second time.
8. Logout calls the backend, then clears local state even when the network call fails.
9. App foreground/session restore validates with `/profile/me`; a persisted profile is never proof of authentication.
10. Never decode a JWT to grant client authorization. Claims may be used only for non-security UX such as proactive expiry checks.

Backend blocker: logout currently revokes only the access token, while the client owns a rotating refresh token. Before production, extend the backend logout/session contract so the current refresh token or session can be revoked. Do not falsely represent local deletion as server-side revocation.

### OAuth and email links

- Use authorization-code flow with PKCE where the provider/backend supports it.
- Create redirects with Expo AuthSession and configure an application scheme plus iOS associated domains and Android app links.
- Google authorization codes are exchanged by `POST /auth/google`; the backend owns the client secret.
- Configure separate OAuth client IDs/redirect URIs per platform and environment.
- Add Sign in with Apple backend support before offering Google sign-in in an iOS production build.
- Email verification and password-reset links must use verified universal/app links with a safe web fallback.
- Never accept a post-auth redirect outside the app's internal route allowlist.

## Server state, persistence, and offline behavior

- TanStack Query owns all remotely sourced data.
- Zustand must not duplicate habits, goals, articles, notifications, profile, billing, or conversation history.
- Use query-key factories per domain, for example `habitKeys.all`, `habitKeys.list(params)`, and `habitKeys.detail(id)`.
- Mutations invalidate or update every affected domain explicitly. Preserve the web behavior where habit/check-in changes also affect activity, billing entitlements, personalization, and weekly review data.
- Wire React Native `AppState` to TanStack Query `focusManager` and NetInfo to `onlineManager`.
- Persist only an allowlisted query cache. Public articles/categories/templates and user read models may be cached; tokens and sensitive AI content are excluded by default.
- Partition persisted user data by user ID and purge it on logout/account switch.
- Show stale cached data with an offline indicator when appropriate.
- Phase 1 is offline-readable, not offline-first writable. Do not queue create/update/delete/check-in mutations until the backend provides idempotency keys, delta sync, and conflict semantics.
- Never promise background sync for arbitrary tasks; mobile operating systems may defer or stop background work.

## SSE, AI coaching, and voice

Use `expo/fetch` streaming bodies for:

- `POST /weekly-reviews/generate-stream`
- `POST /personalization/coaching-stream`
- `POST /personalization/voice-turn`

Implement one tested SSE parser in `src/core/api/sse.ts`. It must handle chunk boundaries, CRLF/LF separators, multiple `data:` lines, comments/heartbeats, malformed events, cancellation, stream completion, and bounded buffers.

- Always attach the bearer token; browser `credentials: include` does not apply.
- Abort active streams when the owning screen unmounts, the user cancels, auth is lost, or a replacement request starts.
- Do not blindly reconnect POST streams because generation may be duplicated. Reconnect only after backend idempotency/resume support exists.
- Keep prompts and AI policy on the backend. The app sends user input/context identifiers only.
- Do not log conversation text, transcripts, generated coaching content, or audio.
- Render streaming text incrementally without rebuilding the entire conversation list on every token; batch UI updates when needed.
- Voice capture uses `expo-audio` and uploads a file URI as multipart with a supported extension/MIME type.
- Stop and release recorder/player resources on interruption, navigation, phone call, backgrounding, cancellation, and error.
- Base64 TTS audio in SSE is accepted for parity but is a mobile performance risk. Prefer a future authenticated short-lived audio URL or binary endpoint before optimizing voice at scale.

## Push notifications

In-app notifications already exist, but push infrastructure does not. Production push requires backend work first:

- A notifications-owned device installation/token table.
- Authenticated register/update/unregister installation endpoints.
- Multiple devices per user and token rotation handling.
- Expo Push Service or direct FCM/APNs delivery in the notifications service.
- Invalid-token cleanup, retries, delivery telemetry, preference checks, and deep-link payload versioning.
- Logout and account deletion unregister/deactivate the installation.

Follow backend ownership and topology rules: notification device tables belong to the notifications service; gateway composes public calls; RPC services never call each other. Until these contracts exist, implement only local permission UX and in-app notifications—do not add a fake mobile-only token API.

Ask for notification permission contextually after the user enables reminders, not at first launch. Treat denial as a valid state. Validate notification routes and IDs before navigation.

## Billing and entitlements

The web app's Stripe Checkout and customer portal endpoints are not the default native purchase path for digital premium features.

- Use RevenueCat (`react-native-purchases`) as the client abstraction over StoreKit and Google Play Billing.
- The backend remains authoritative for Growth entitlements.
- Add backend receipt/webhook reconciliation that maps App Store/Play purchases to the existing subscription/entitlement model.
- Restore purchases and account switching must be tested.
- Never unlock a feature solely from a client purchase callback or cached RevenueCat state; refresh backend billing overview after reconciliation.
- Existing Stripe web subscriptions must remain visible to the same account, but native upgrade/manage actions must follow store policy.
- Do not open Stripe Checkout inside a WebView for digital subscriptions.

Billing is a release blocker until product IDs, RevenueCat project configuration, backend reconciliation, and store-policy review are complete.

## Design system and UI rules

Implement the approved native Paper design in `Mobile Redesign (standalone).html` according to `mobile.md`:

- Semantic colors use a warm background/surface/foreground/muted foundation, one sage accent/success color, and destructive color. Remove the older calm/growth/energy/chart palette after migrating consumers.
- Light and dark themes come from one token schema; do not use raw colors in feature code.
- Use Instrument Sans for body, Newsreader for display, and IBM Plex Mono for numeric/technical metadata, loaded with `expo-font` using verified SDK 57-compatible assets/packages.
- Use the Paper spacing, typography, radius, duration, opacity, icon-size, and minimum-touch-target tokens specified in `mobile.md`.
- Feature code consumes semantic tokens, never platform-specific CSS names or hardcoded hex values.
- Use native safe-area handling, keyboard avoidance, haptics where meaningful, pull-to-refresh, and platform-appropriate sheets/menus.
- Use system controls when they provide better accessibility and behavior.
- Every asynchronous screen has loading, empty, error, offline/stale, and populated states.
- Every mutation prevents accidental duplicate submission and communicates pending/success/failure states.
- Destructive actions require confirmation and remain reversible where the backend supports it.

### Accessibility

- Minimum touch target: 44×44 points.
- Support Dynamic Type/font scaling and avoid fixed-height text containers.
- Provide accessibility labels, roles, states, and hints for non-text controls.
- Preserve logical focus order and announce important async outcomes.
- Never rely on color alone.
- Meet WCAG AA contrast for text and controls.
- Respect reduced motion and screen reader use.
- Test core flows with VoiceOver and TalkBack on real devices.

## Configuration and security

- Use `app.config.ts` as the single Expo app configuration source.
- Validate environment variables at startup with Zod.
- Only variables prefixed `EXPO_PUBLIC_` may enter the client bundle, and none may be secrets.
- Public config may include API origin, OAuth client IDs, Sentry DSN, PostHog host/key, RevenueCat public platform keys, and EAS project ID.
- Secrets, service-auth keys, OAuth client secrets, Stripe secrets, private Sentry tokens, and backend credentials never belong in this repository or EAS public environment variables.
- Maintain development, preview, and production EAS profiles with distinct bundle IDs/package names, schemes, API origins, and service files.
- Production traffic must use HTTPS. Cleartext HTTP is development-only and must not be broadly enabled.
- Redact Authorization, refresh tokens, passwords, email verification/reset tokens, OAuth codes, audio, AI messages, and PII from logs.
- Do not add certificate pinning without an approved rotation and incident-recovery design.
- Account deletion is destructive: require re-authentication/confirmation as appropriate and clearly explain consequences.

## Testing strategy

### Required layers

1. Pure unit tests: Zod schemas, formatters, query keys, reducers/stores, error mapping, SSE parser, token refresh coordinator.
2. Component tests: forms, loading/error/empty states, accessibility labels, optimistic mutation behavior.
3. API contract tests: generated OpenAPI types, runtime schemas, backend fixture responses, custom multipart/SSE routes.
4. Integration tests: login/refresh/logout, onboarding submission, habit/check-in cache updates, article save/like, push registration adapter, purchase reconciliation adapter.
5. Maestro E2E on both platforms: registration/email-link handoff, login, onboarding, habit creation/check-in, goal progress, AI text coaching/cancel, settings, logout, and subscription restore in sandbox.
6. Real-device tests: OAuth redirects, universal/app links, notifications, microphone permissions, recording/playback, image upload, background/foreground, low connectivity, and store purchases.

Test failures must reproduce defects before fixes where practical. Mock at the network/transport boundary, not by mocking the feature under test.

### Verification commands

Once the Expo project is initialized, keep these scripts working:

```bash
bun run lint
bun run typecheck
bun run test
bun run test:ci
bun run format:check
bunx expo-doctor
bunx expo export --platform android
bunx expo export --platform ios
```

Run the narrowest relevant test during iteration, then all affected checks before completion. Native/config changes require development builds on both iOS and Android; Expo Go success is not verification.

## Delivery plan

### Phase 0 — contracts and mobile backend readiness

- ~~Reconcile `/activity` vs `/activities` and onboarding-generation route drift.~~ (Done 2026-07-22: web API client aligned to gateway contract.)
- Ensure all public endpoints are represented in generated Swagger or explicitly documented custom transports. **Done** (2026-07-27): OpenAPI 3.0 overlay at `services/gateway/contract/swagger/custom-transports.yaml` documents the 3 custom transport routes (`files/upload` multipart, `transcribe` multipart, `voice-turn` SSE). Merge script (`scripts/merge-swagger.sh`) converts goctl's Swagger 2.0 to OpenAPI 3.0 and merges the overlay. `make swagger-combined` produces `swagger-combined.json`.
- ~~Define native logout/session revocation.~~ (Done 2026-07-22: backend logout now revokes the session via Redis `revoked:session:<sessionID>`, revokes the refresh token by value, and the refresh RPC checks session revocation. Gateway contract updated to accept `LogoutRequest` with optional `refreshToken`. Web frontend sends refresh token in server-side logout.)
- Define Google mobile redirect URIs and add Sign in with Apple backend flow. **Done** (2026-07-27): `pkg/oauth/apple` verifies Apple ID tokens against Apple's JWKS (RS256, issuer/audience/expiry validation, nonce check, private relay email handling). Auth proto + gateway route `POST /api/v1/auth/apple` added. Auth logic links Apple identity to existing user by email or creates new OAuth-only user. Best-effort authorization code exchange for refresh tokens. Apple config (ServiceID, TeamID, KeyID, private key) in auth service config. 12 tests covering happy path, bad signature, wrong audience/issuer, expired tokens, nonce, JWKS caching, private relay emails. Google mobile redirect URIs still need platform-specific values (iOS/Android dev/preview/prod).
- Design notifications-owned device registration and push delivery. **Done** (2026-07-27): `notification_devices` table (migration 042) with per-installation Expo push tokens. `PUT/DELETE /devices/:installationId` gateway routes + notifications proto RPCs. `pkg/notifications/expo` client (send, check receipts, disable stale tokens). `internal/delivery/sender.go` bridges in-app notifications to push delivery. Config-driven enable/disable. 17 Expo client tests + 6 delivery tests.
- Design RevenueCat/App Store/Play purchase reconciliation into backend entitlements. **Done** (2026-07-27): `revenuecat_customer_id` column on `subscriptions` (migration 043). `pkg/revenuecat` client (entitlement fetch, webhook signature verification, subscription backfill). `POST /api/v1/billing/revenuecat-webhook` gateway route + client proto RPC. Webhook handler processes INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, ENTITLEMENT_CHANGE events with idempotency via `processed_events`. Entitlement re-fetch from RevenueCat API for PRODUCT_CHANGE/ENTITLEMENT_CHANGE. Trial detection, annual/monthly interval mapping, automatic downgrade to free on expiration. 13 RevenueCat client tests + 12 webhook handler tests.
- Decide deep-link hosts/schemes, bundle IDs, Android application IDs, environments, EAS ownership, and analytics consent policy. **Decision template ready** (2026-07-27): `docs/app-identity-environment-matrix.md` contains the decision template for bundle IDs, Android application IDs, deep-link hosts/schemes, EAS project ownership, environment matrix (dev/preview/prod), and analytics consent policy. Requires organizational decisions to fill in.
- ~~Create sanitized API fixtures for contract tests.~~ (Done 2026-07-27: `frontend/src/api/__fixtures__/` expanded with habits, goals, notifications, billing (free/pro), search, multipart upload, and SSE stream fixtures. 21 contract tests validating all JSON fixtures against Zod schemas + 5 SSE parser tests validating wire format, CRLF/LF mixing, malformed events, and chunk-boundary robustness. Secret sanitization scan covers `.json` and `.sse` files.)

Exit: mobile-critical contracts are reviewed, additive, versioned, and backend work is tracked. All Phase 0 backend items are implemented (Apple Sign In, push notifications, RevenueCat billing, OpenAPI overlay, expanded fixtures). Remaining: organizational decisions for app identity/environments (decision template ready at `docs/app-identity-environment-matrix.md`) and Google mobile redirect URI platform-specific values.

### Phase 1 — application foundation

- Create the SDK 57 Expo Router application and EAS development builds.
- Add strict TypeScript, lint boundary rules, formatting, Jest/RNTL, Maestro skeleton, and CI.
- Implement app config/env validation, themes/tokens, typography, safe areas, error boundary, Sentry adapter, and analytics interface.
- Generate API types; implement ApiError, authenticated client, SecureStore token manager, single-flight refresh, multipart adapter, SSE parser, and contract fixtures.
- Configure QueryClient with AppState/NetInfo and allowlisted persistence.
- Implement auth/public/app/onboarding route protection and internal deep-link validation.

Exit: a tested shell runs on physical iOS and Android devices, can authenticate against development, restore/refresh/logout a session, and render design-system primitives.

### Phase 2 — core value vertical slice

- Port registration, verification-link handoff, login, forgot/reset password.
- Port the seven-step onboarding flow and make submission duplicate-safe.
- Port Habits CRUD, categories, recent history, daily reset, and check-ins.
- Port Goals CRUD, linked habits, toggle, and progress.
- Port Profile and essential Settings.

Exit: a new user can register, verify, onboard, create and check in a habit, manage goals, relaunch with a valid session, and log out on both platforms.

### Phase 3 — content and engagement

- Today composition: coach insight, daily habit check-ins, compact goal progress, and Progress entry.
- Plan composition: habits nested under the goals they serve, plus untied habits and CRUD sheets.
- Library: Explore, Saved, Templates, People where supported, and search.
- Article detail markdown, image caching, like/share/save, reader size, and reading-position restoration.
- Progress combines weekly-review summaries and recent activity without merging domain ownership.
- In-app notification sheet/unread/read-all and notification preferences.
- Image avatar selection, compression, upload, and retry.

Exit: content and engagement behavior has parity with supported web behavior, including deep links and offline-readable cached content.

### Phase 4 — AI coaching and weekly review

- Native conversation list/history and composer; do not port `@assistant-ui`.
- Streaming personalized coaching with thinking/delta/complete/error states and cancellation.
- Weekly review history/current/generation stream.
- Markdown rendering, entitlement/limit errors, and plan adjustment actions.
- Performance-test long conversations and incremental rendering.

Exit: text AI flows are stable under interruption, auth refresh, cancellation, malformed events, and poor networks.

### Phase 5 — voice, push, and subscriptions

- Microphone permission education, recording, upload, transcript, streamed response, TTS playback, interruptions, and cleanup.
- Backend device registration plus Expo/APNs/FCM push delivery, token rotation, notification deep links, and preferences.
- RevenueCat paywall, purchase, restore, account switching, backend entitlement reconciliation, and existing Stripe entitlement display.

Exit: real-device tests pass; sandbox purchase and push delivery work on iOS and Android; privacy/store requirements are met.

### Phase 6 — hardening and release

- Accessibility audit, localization extraction, analytics consent, privacy disclosures, and store data-safety labels.
- Cold start, list, image, memory, battery, audio, and stream performance profiling.
- Network matrix: offline, latency, packet loss, 401 storms, 429, 5xx, stream disconnect, upload failure.
- Security review of token lifecycle, deep links, logs, dependencies, and account deletion.
- EAS preview/production builds, signed store submissions, staged rollout, alerting, and rollback plan.

Exit: release checklist, monitoring, support runbook, staged rollout, and rollback are approved.

## Definition of done for every feature

A feature is not complete until all applicable items are true:

- Behavior and contract were compared with backend source and web product intent.
- Route files remain thin; feature boundaries and dependency direction are preserved.
- Request and response boundaries use generated types plus runtime validation.
- Loading, empty, error, offline/stale, success, and permission-denied states exist.
- Cancellation, duplicate taps, retries, and app background/foreground behavior are handled.
- Accessibility labels, dynamic text, contrast, reduced motion, and touch targets are verified.
- User-facing copy is localized.
- Analytics events are typed, consent-aware, and contain no sensitive data.
- Unit/component tests and relevant integration/E2E coverage pass.
- `lint`, `typecheck`, tests, formatting check, and `expo-doctor` pass.
- Native/config changes are tested in development builds on iOS and Android.
- Documentation in this file is updated if architecture, contracts, commands, or project knowledge changed.

## Hard prohibitions

- No direct database, gRPC, Kafka, MinIO, AI provider, Stripe secret API, FCM server API, or APNs server API access from mobile.
- No browser cookie/BFF emulation in native.
- No tokens in ordinary persistence, Zustand, query cache, logs, analytics, URLs, or error reports.
- No manually edited generated files.
- No duplicated server state in Zustand.
- No API calls from visual components or route files.
- No copied DOM/Radix/Next.js components presented as native components.
- No arbitrary HTML/WebView rendering for articles or AI output.
- No automatic retry of non-idempotent writes or POST streams.
- No fake offline-write support without backend idempotency/conflict design.
- No WebView Stripe Checkout for native digital subscriptions.
- No social login on iOS release without reviewing Sign in with Apple requirements.
- No permission prompt at first launch without user context.
- No new dependency or architecture pattern merely for one feature when an approved abstraction already exists.
- No disabling security, lint, type, test, EAS, or store-compliance controls to make a build pass.

## Related repositories

- `../frontend`: Next.js consumer web application; product behavior and visual reference.
- `../backend`: Go gateway and microservices; API and data source of truth.
- `../admin-frontend`: administrator interface; not a mobile implementation source.
- `../docs`: shared product/technical documentation where applicable.
