# Phase 0 Blockers — Organizational Decisions Required

Status: **BLOCKED — all technical work is complete; only organizational decisions remain.**
Last updated: 2026-07-27

This is a reminder for anyone working in this repository. The full decision template
with every field that needs a value lives at
[`../docs/app-identity-environment-matrix.md`](../docs/app-identity-environment-matrix.md).
Fill in every `DECISION REQUIRED:` field there, then update `mobile/AGENTS.md`
Phase 0 item 7 status from "Open" to the chosen resolution.

Do not begin mobile implementation that depends on these fields until they are
decided. Do not invent or guess values — these are organizational decisions that
affect app store submissions, signing credentials, OAuth clients, and legal
consent posture.

---

## What is already done (technical)

All Phase 0 technical blockers have been resolved in `../backend`:

- Push notifications: versioned, typed payload; device registration; async receipt
  worker with ticket persistence; sender wired into notification and reminder flows.
- Logout: device unregistration via gateway composition; Redis session revocation
  failure now returns an error instead of silently succeeding.
- RevenueCat billing: idempotency + entitlement mutation are atomic in a
  serializable transaction; retryable failures return non-2xx so RevenueCat
  retries; permanent failures (bad data) are marked processed to avoid infinite
  retries.
- Table ownership: adminway no longer queries client-owned tables directly; admin
  CRUD RPCs were added to the client service and adminway now calls them via gRPC.
  `make check-ownership` passes with 0 violations.
- OpenAPI: `swagger-combined.json` is in sync (93 operations, no drift).

Verification (run from `../backend`): `go build ./...`, `go test ./...`,
`make check-ownership`, `make swagger-combined`, `make check-openapi-drift` all pass.

---

## What is blocked (organizational)

Five categories of decisions are outstanding. Each links to the corresponding
section of the full template.

### 1. App identifiers — `../docs/app-identity-environment-matrix.md#1-app-identifiers`

iOS bundle IDs, Android application IDs, Expo schemes, display names, App Store
SKU, and EAS project ID — for production, preview, and development profiles.
These must be distinct per EAS profile. The production iOS bundle ID is also the
Apple Services ID audience used by Sign in with Apple and must match
`backend` `AppleOAuth.ServiceID`.

### 2. Deep links — `../docs/app-identity-environment-matrix.md#2-deep-links`

Custom URL scheme(s), universal link host (iOS), app link host (Android), web
fallback origin for email links, Apple associated-domain service IDs,
`apple-app-site-association` and `assetlinks.json` file locations, the confirmed
set of deep-link destinations, OAuth redirect URIs per platform/environment, and
the email verification / password-reset link path scheme.

### 3. Environment matrix — `../docs/app-identity-environment-matrix.md#3-environment-matrix`

`EXPO_PUBLIC_API_ORIGIN`, Google OAuth client IDs (web/iOS/Android), Apple
Services ID and redirect URIs, Expo push credentials, RevenueCat public keys +
project ID, Sentry DSN, and PostHog host/key — for production, preview, and
development. No secrets may enter this repo or `EXPO_PUBLIC_*` variables.

### 4. EAS ownership & signing — `../docs/app-identity-environment-matrix.md#4-eas-ownership--signing`

Expo account/org slug, EAS project slug, Apple Developer Team ID and account
role, Google Play Console account and role, iOS signing credentials strategy,
Android keystore strategy, EAS credentials owner, EAS secrets list, who may run
`eas build` / `eas submit`, branch → profile mapping, and EAS Update channel
mapping. The Apple Team ID must match `backend` `AppleOAuth.TeamID`.

### 5. Analytics consent policy — `../docs/app-identity-environment-matrix.md#5-analytics-consent-policy

Product analytics (PostHog) and crash analytics (Sentry) consent model
(opt-in vs opt-out, per jurisdiction), default state before user choice, where
the consent prompt is shown, consent withdrawal mechanism, separation of crash
vs product analytics, prohibited fields, event taxonomy owner, person
identification strategy in PostHog, data retention period, and App Store / Play
data-safety labels owner.

---

## How to unblock

1. Open `../docs/app-identity-environment-matrix.md`.
2. Fill in every `DECISION REQUIRED:` field.
3. Update `mobile/AGENTS.md` Phase 0 item 7 status from "Open" to the chosen
   resolution and reference the completed template.
4. Only then begin mobile implementation that depends on these fields
   (`app.config.ts`, `eas.json`, OAuth config, deep-link config, analytics
   consent UI, environment files).
