# growth-mobile — Evolella Mobile

Native consumer app for **Evolella** — an AI accountability coach that turns goals into daily habits. iOS and Android, built with Expo SDK 57 and React Native.

Native versions of the web product: Today (coach insight + check-ins), Plan (habits under goals), Coach (AI chat + voice), Library (articles, saved, search), and Me (profile, settings) — plus a seven-step onboarding flow, push notifications, weekly reviews, and subscriptions via RevenueCat.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Expo SDK 57, React Native, TypeScript strict |
| Navigation | Expo Router (file-based, typed routes, protected groups) |
| Server state | TanStack Query over one shared axios client |
| Client state | Zustand (session/UI only) |
| Secrets | `expo-secure-store` (tokens never touch AsyncStorage) |
| Subscriptions | `react-native-purchases` (RevenueCat → StoreKit / Play Billing) |
| Observability | Sentry, PostHog (consent-aware) |
| i18n | i18next + `expo-localization` |
| Tests | jest-expo + RNTL (unit), Maestro (e2e) |
| Package manager | Bun |

The app talks **only** to the public gateway — `${EXPO_PUBLIC_API_ORIGIN}/api/v1` — never to gRPC services, databases, or third-party providers directly.

## Getting started

Development builds are the supported workflow — not Expo Go (native modules like SecureStore, audio, and push require them).

```bash
bun install
bun start             # Metro bundler
bun run ios           # build & launch iOS dev build
bun run android       # build & launch Android dev build
```

Set `EXPO_PUBLIC_API_ORIGIN` to the backend origin (HTTPS required outside development). EAS profiles (`eas.json`) map to app identities: `Evolella Dev` / `Evolella Preview` / `Evolella` (`com.evolella.app[.dev|.preview]`).

## Quality gates

```bash
bun run typecheck     # tsc --noEmit
bun run lint          # expo lint
bun test              # jest
bun run format        # prettier --write
```

## Generated API types

TypeScript types are generated from the backend's unified OpenAPI spec — regenerate after backend contract changes:

```bash
bun run gen:api-types   # backend swagger-combined.json → src/core/api/generated/api-types.ts
```

## Documentation

`AGENTS.md` is the authoritative contributor guide: locked tech choices, dependency-direction rules, screen mapping, reuse policy vs the web app, and API contract rules. `mobile.md` covers the Paper design system and migration plan.
