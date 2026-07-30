# Growth Mobile “Paper” Redesign Implementation Guide

This document is the execution plan for redesigning the Expo application from the current Apple-inspired shell to the native “Paper” design defined in [`Mobile Redesign (standalone).html`](./Mobile%20Redesign%20%28standalone%29.html).

It is written for an AI coding agent. Implement the work in the phases below; do not attempt a single large visual rewrite.

## 1. Authority and conflict resolution

Read [`AGENTS.md`](./AGENTS.md) and [`BLOCKERS.md`](./BLOCKERS.md) before changing code.

Use this precedence:

1. `AGENTS.md` remains authoritative for architecture, API contracts, security, storage, accessibility, localization, testing, and native-library choices.
2. `Mobile Redesign (standalone).html` is authoritative for the approved visual system, information architecture, navigation labels, component appearance, interaction design, and screen composition described here.
3. This file translates the HTML into implementation order and acceptance criteria.
4. Existing mobile screens are implementation context, not visual authority.
5. The web frontend is only a product-behavior reference and is neither an API contract nor a React Native component source.

The redesign intentionally supersedes these older `AGENTS.md` design decisions:

- Tabs change from **Home, Explore, Habits, Coach, Profile** to **Today, Plan, Coach, Library, Me**.
- Fonts change from **Plus Jakarta Sans, Fraunces, JetBrains Mono** to **Instrument Sans, Newsreader, IBM Plex Mono**.
- The multi-accent Apple palette changes to a warm neutral palette with one sage accent. This approved design override removes the older optional `calm`, `growth`, and `energy` semantics after their consumers are migrated.
- Progress becomes a stack screen reached from Today rather than a tab.

Do not weaken any non-design rule in `AGENTS.md`. If implementation reveals another contradiction, stop and document it rather than silently choosing a third direction.

`BLOCKERS.md` still prohibits guessing app identifiers, deep-link hosts, OAuth values, EAS ownership, or analytics-consent policy. Visual redesign work that does not require those values may proceed. Do not mark blocked release configuration as complete.

## 2. How to use the design source

The standalone HTML is a bundled design artifact. It is not application code.

- Inspect it in a browser for visual comparison and use sections `1a` through `1l` as the source frames.
- Do not edit the HTML.
- Do not copy DOM nodes, inline CSS, gradients, or web layout primitives into React Native.
- Translate dimensions to density-independent React Native units.
- Use safe-area insets, native keyboard behavior, native sharing, native switches, native sheets, Android ripple, and iOS opacity feedback.
- Use real API data and existing feature hooks. Example names, dates, prices, and counts in the mockups are illustrative only.
- Do not hardcode store prices. RevenueCat offerings provide localized prices.
- Do not invent backend fields to match a mockup. Omit, defer, or derive presentation only when the existing contract safely supports it.

Design source index:

| HTML section | Scope                                                               |
| ------------ | ------------------------------------------------------------------- |
| `1a`         | Colors, typography, targets, spacing, radii, motion, haptics        |
| `1b`         | Today on iOS and Android                                            |
| `1c`         | Today dark/scrolled state and Plan                                  |
| `1d`         | Progress, weekly summary, recent activity, offline state            |
| `1e`         | Coach threads, streaming conversation, voice mode                   |
| `1f`         | Library: Explore, Saved, Templates, People, search                  |
| `1g`         | Me: profile, coaching preferences, reminders, appearance, plan/data |
| `1h`         | Article reader and markdown style map                               |
| `1i`         | Welcome, onboarding, sign-in, validation, dark mode                 |
| `1j`         | Paywall, notifications sheet, skeleton/empty/error/toast states     |
| `1k`         | Shared component inventory and states                               |
| `1l`         | Token values and route handoff                                      |

## 3. Current repository baseline (not the target)

The bullets in this section describe the pre-redesign implementation only. They are inventory, not instructions to preserve the old design. At the time this guide was written:

- Expo SDK 57, React Native 0.86, Expo Router, TypeScript strict mode, and Bun are installed.
- Authentication, onboarding, habits, goals, profile, and settings have feature modules.
- Today/Home, Explore, and Coach tab routes are placeholders.
- Tabs still use `index`, `explore`, `habits`, `coach`, and `profile`.
- Design tokens still use blue/teal Apple-inspired colors and system font fallbacks.
- Shared components include `Badge`, `Button`, `Card`, `EmptyState`, `ErrorState`, `Input`, `Screen`, `Spinner`, `ThemedText`, and `ThemedView`.
- Article, conversation, progress, paywall, notifications, Library, and their supporting feature modules are incomplete or absent.

Before each phase, inspect the current repository again. This baseline will become stale as agents complete work.

## 4. Non-negotiable product direction

- One shared visual system is used on iOS and Android. Platform differences live in system chrome, back affordances, tab geometry, sheet behavior, and press feedback.
- The app uses five tabs: **Today**, **Plan**, **Coach**, **Library**, **Me**.
- **Progress** is pushed from Today.
- Today has calm density: prioritize today’s action, not a dashboard of every metric.
- Habit check-in is one tap on a 44-unit target. Optional notes expand inline; do not open a modal for the normal check-in.
- In-flow cards use a hairline border and no shadow/elevation. Sheets and the Plan floating action button are the only raised surfaces.
- Every async screen ships loading, loaded, empty, error, refreshing, and offline/stale behavior where applicable.
- Light and dark themes must be implemented together. A phase is not done if only one theme works.
- All user-facing copy goes through i18n resources.
- Dynamic Type/font scaling stays enabled. Layouts must remain usable at 200% text scale.

## 5. Paper foundations

### 5.1 Color tokens

Update `src/design-system/tokens/colors.ts` to this semantic schema. Feature code must never use these hex values directly.

| Token                                    | Light                 | Dark                     |
| ---------------------------------------- | --------------------- | ------------------------ |
| `background`                             | `#F6F4EF`             | `#161514`                |
| `foreground`                             | `#1C1A17`             | `#F0EDE6`                |
| `surface`                                | `#FFFFFF`             | `#201E1B`                |
| `surfaceForeground`                      | `#1C1A17`             | `#F0EDE6`                |
| `surfaceElevated`                        | `#FFFFFF`             | `#201E1B`                |
| `surfaceElevatedForeground`              | `#1C1A17`             | `#F0EDE6`                |
| `primary`                                | `#1C1A17`             | `#F0EDE6`                |
| `primaryForeground`                      | `#F6F4EF`             | `#161514`                |
| `secondary` / `muted`                    | `#EAE6DE`             | `#2E2B27`                |
| `secondaryForeground`                    | `#1C1A17`             | `#F0EDE6`                |
| `mutedForeground`                        | `#6E6A63`             | `#8C877E`                |
| `accent` / `success`                     | `#4F6B57`             | `#7FA189`                |
| `accentForeground` / `successForeground` | `#F6F4EF`             | `#161514`                |
| `successSoft`                            | `#F1F4EF`             | `#2A322C`                |
| `border`                                 | `rgba(28,26,23,0.10)` | `rgba(255,255,255,0.08)` |
| `input`                                  | `rgba(28,26,23,0.14)` | `rgba(255,255,255,0.14)` |
| `ring`                                   | `#4F6B57`             | `#7FA189`                |
| `destructive` / temporary `error` alias  | `#B4553F`             | `#C9705A`                |
| `destructiveForeground`                  | `#F6F4EF`             | `#161514`                |
| `overlay`                                | `rgba(28,26,23,0.40)` | `rgba(0,0,0,0.60)`       |

Remove `calm*`, `growth*`, `energy*`, `warning*`, and `chart1`–`chart5` only after migrating every consumer. Charts use foreground/accent at controlled opacities instead of unrelated hues. Add `successSoft`. Keep `error` and `secondaryText` aliases temporarily while migration is in progress, then remove them in a dedicated cleanup with typecheck coverage.

### 5.2 Typography

Use `expo-font` as the loader and source the families from verified `@expo-google-fonts/*` packages when those exact packages and weights support Expo SDK 57; otherwise bundle licensed OTF/TTF assets locally. Verify package names rather than guessing them. The SDK 57 Font documentation permits either the `expo-font` config plugin (preferred for native embedding) or runtime `useFonts`; choose one approach consistently and document it. Before installing anything, follow `AGENTS.md`, read the SDK 57 official documentation, and install Expo/native packages through `bunx expo install`. Keep the splash visible until required runtime fonts are loaded; provide system fallbacks so a font failure does not permanently block boot.

Required families and weights:

- `Newsreader`: regular 400 and medium 500.
- `Instrument Sans`: regular 400, medium 500, semibold 600.
- `IBM Plex Mono`: regular 400 and medium 500.

Use named semantic text styles through `ThemedText`, not screen-local font recipes:

| Variant        | Family                  | Size / line height       |
| -------------- | ----------------------- | ------------------------ |
| `screenTitle`  | Newsreader regular      | 34 / 39                  |
| `sectionTitle` | Newsreader regular      | 22 / 29                  |
| `cardTitle`    | Newsreader regular      | 18 / 24                  |
| `rowTitle`     | Newsreader regular      | 17 / 22                  |
| `body`         | Instrument Sans regular | 16 / 24                  |
| `bodySmall`    | Instrument Sans regular | 15 / 22                  |
| `label`        | Instrument Sans medium  | 13 / 18                  |
| `meta`         | Instrument Sans regular | 13 / 18                  |
| `caption`      | Instrument Sans regular | 12 / 16                  |
| `numeric`      | IBM Plex Mono medium    | 15 / 20, tabular numbers |
| `reader`       | Instrument Sans regular | 17 / 29                  |

The final `1l` handoff defines the global `screenTitle` as 34/39 and takes precedence over the earlier `1a` 30/1.2 specimen. Dedicated frames also define a 30/37.5 onboarding/auth title, 32/38.4 article/paywall title, and 38/43.7 welcome title; add explicit semantic variants for these roles rather than treating them as contradictions or writing ad hoc inline styles. Twelve units is the minimum text size and is reserved for metadata.

### 5.3 Spacing, radius, targets, and motion

```ts
spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 };
radius = { field: 8, card: 12, sheet: 20, pill: 999 };
hitSlop = { minTarget: 44 };
duration = { instant: 80, quick: 140, base: 220, overlay: 260, slow: 1600 };
```

Layout rules:

- Screen gutter: 20; onboarding/auth may use 24 as shown.
- Card padding: 16.
- Row group gap: 12.
- Major group gap: 28.
- Inputs are 48 high; medium buttons are 44 and large buttons are 52.
- Small 36-high buttons are allowed only inside a parent row whose complete touch target is at least 44.
- Cards: one-unit semantic border, radius 12, no shadow/elevation.
- Sheets: top radius 20 and native safe-area handling.

Motion rules:

- `instant` 80 ms: press feedback.
- `quick` 140 ms: colors, focus, selection.
- `base` 220 ms: check-in fill, row state, progress, collapsing header.
- `overlay` 260 ms: sheet, toast, and screen transition.
- `slow` 1600 ms: skeleton pulse and voice bars.
- Read reduced-motion settings. Reduced motion sets movement durations to zero; opacity may remain at 140 ms.
- Use Reanimated only where animation is meaningful. Do not animate static layout for decoration.

Use the Expo SDK 57-compatible `expo-haptics` package: `impactAsync(ImpactFeedbackStyle.Light)` for check-in and `notificationAsync(NotificationFeedbackType.Success | Warning)` for streak milestones and failed mutations. Haptics are limited to those events, must be best-effort, and must not block the action. Re-read the SDK 57 Haptics documentation before implementation and install with `bunx expo install expo-haptics`.

## 6. Target navigation and compatibility

Thin route files import feature screens; route files contain no business logic or substantial UI.

```text
app/(app)/(tabs)/index.tsx       Today
app/(app)/(tabs)/plan.tsx        Plan
app/(app)/(tabs)/coach.tsx       Coach
app/(app)/(tabs)/library.tsx     Library
app/(app)/(tabs)/me.tsx          Me
app/(app)/progress.tsx           pushed from Today
app/(app)/article/[id].tsx       pushed content screen
app/(app)/conversation/[conversationId].tsx  pushed coaching screen
app/(app)/paywall.tsx            modal
app/(app)/notifications.tsx      native sheet presentation
```

Route migration rules:

- Keep `index.tsx` as the route filename but replace its Home/article-feed presentation with Today. Keep and redesign `coach.tsx`. Replace `explore.tsx`, `habits.tsx`, and `profile.tsx` with `library.tsx`, `plan.tsx`, and `me.tsx`; do not leave hidden duplicate tab screens.
- Merge existing habits and goals behavior into Plan without merging the feature modules. Plan composes public hooks/components from `features/habits` and `features/goals`.
- Library composes articles, saved, search, templates, and people/search behavior while those domains keep separate feature ownership.
- Me composes profile and settings public surfaces without moving remote state into a new store.
- Keep stable old internal route identifiers used by notification payloads and existing deep links. Extend the existing allowlist and mapping in `src/core/auth/deep-links.ts` (`DeepLinkDestination`, `ALLOWED_DESTINATIONS`, and `destinationToRoute`) and its tests; do not create a second registry. Map legacy identifiers such as `weekly-review` and `activity` to the supported Progress destination only after the route exists. Never accept arbitrary URLs, and validate required UUIDs before interpolation.
- Verify back behavior and tab-state preservation on iOS and Android.
- Notifications are presented as a sheet even though Expo Router may use a route to make it deep-linkable/testable.
- Paywall receives a validated reason/limit identifier, never arbitrary marketing copy through route params.

Recommended Lucide icon concepts are `Circle`/Today, `ListChecks`/Plan, `MessageCircle`/Coach, `Library`/Library, and `User`/Me. Use existing icon dependencies; do not draw CSS-like icons manually.

## 7. Shared component contract

Build shared primitives before feature screens. Extend existing components rather than creating parallel versions.

Required primitives:

- `ThemedText`: semantic variant, semantic color, font scaling enabled, no fixed-height text wrapper.
- `Screen`: safe area, optional scroll/list host, refresh support, keyboard-safe behavior, and optional offline banner.
- `Button`: `primary`, `secondary`, `outline`, `ghost`, `destructive`; `sm`, `md`, `lg`; pending and disabled states.
- `Input`: label, help/error message, 48-unit field, accent focus ring without glow, destructive invalid ring.
- `Card`: radius 12, hairline border, optional padding, no in-flow shadow.
- `Sheet`: wraps the approved bottom-sheet library and handles dark mode, safe area, drag dismissal, and Android back.
- `ListRow`, `SectionLabel`, `SegmentedTabs`, `Chip`, `Badge`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast`, `ProgressBar`, and `Avatar`.
- `CheckInControl`: 28-unit circle in a 44-unit pressable; rest, pressed, syncing, done, failed, and disabled states.
- `StreakBar`: 14 visual bars paired with a textual summary. Bars are hidden from accessibility; text carries the meaning.

Accessibility requirements:

- `CheckInControl` uses `accessibilityRole="checkbox"`, correct checked/busy/disabled state, and a label containing the habit name.
- Icon-only actions have localized labels and hints.
- Visual color is never the only state indicator.
- Every interactive target is at least 44 by 44.
- Focus order follows reading order.
- Skeleton content is not announced as real data.
- Toasts announce concise status without stealing focus.

Skeletons match loaded geometry, use two neutral tones, pulse for 1.6 seconds, and do not shimmer. Spinners are reserved for an already-pressed button or compact indeterminate operation.

## 8. Screen implementation specifications

### 8.1 Today

Use the existing `features/home` domain from the required repository layout for the Today composition screen; “Today” is the product/tab label, not a second feature module. It may import public hooks from habits, check-ins, goals, activity, notifications, and AI coaching only through their supported public surfaces.

Order:

1. Date eyebrow in mono, Today title, Progress action, and notification bell.
2. Coach insight card with primary and secondary actions when data exists.
3. “Check in” heading and “Check in all” action.
4. Today’s habit rows with one-tap optimistic check-in, undo, syncing/failure states, textual streak summary, and optional inline note expansion.
5. Compact goal progress cards.

Behavior:

- Use optimistic check-in only if the existing mutation semantics support safe rollback. Do not queue writes offline.
- “Check in all” must clearly expose partial failure and must not retry non-idempotent requests blindly.
- The expanded Today header collapses to a compact sticky row after scrolling; animate over 220 ms or instantly with reduced motion.
- Pull-to-refresh uses native refresh behavior.
- Offline mode shows allowlisted cached data with timestamp and Retry; mutation controls must reflect inability to write.
- Empty state leads to adding a small first habit.

### 8.2 Plan

Plan combines goal-oriented planning and habit management while preserving domain boundaries.

- Header shows goal/habit counts and All, Active, Paused filters.
- Goal cards show title, percentage, progress bar, due/pace metadata, and the habits that serve the goal.
- Untied habits appear under “Not tied to a goal” and offer “Link a goal”.
- A 56-unit sage floating action button opens a native sheet for creating a habit or goal.
- Habit/goal create and edit use existing feature forms and mutations, restyled with Paper primitives.
- A habit row may expose check-in state but navigation/edit affordances must remain distinct and accessible.
- Paused and completed states must not rely on opacity alone.

### 8.3 Progress

Progress replaces separate weekly-review/activity entry points in the primary information architecture, but underlying feature/API ownership stays separate.

- Pushed from Today with native back behavior.
- Week label, check-in total, consistency metric, per-habit progress, coach interpretation, and recent activity.
- Weekly-review generation/streaming remains a dedicated domain operation and follows the SSE rules in `AGENTS.md`.
- Pull-to-refresh, cached offline view, last-updated timestamp, Retry, skeleton, empty, and error states are required.
- Use only data available from current contracts. Never fabricate a “coach read” from unrelated fields.

### 8.4 Coach and conversation

Coach tab:

- Two primary entry cards: text conversation and voice.
- Earlier conversations in a long-list implementation.
- Entitlement/usage banner with a specific Upgrade action when limits are known.

Conversation screen:

- Native back title, thread title, and overflow actions.
- User messages use a muted bubble; assistant messages are visually quieter and need not use a bubble.
- Composer follows keyboard insets and remains usable with large text.
- Streaming renders partial text, exposes Stop, handles cancel/reconnect/auth failure, and never duplicates chunks.
- Conversation history uses FlashList and keeps sensitive AI content out of persisted cache by default.

Voice mode:

- Full-screen listening/transcribing state, live transcript, restrained voice bars, stop/send/cancel controls, permissions, interruption handling, and cleanup.
- Follow the existing native audio/file/SSE rules in `AGENTS.md`; never introduce browser `MediaRecorder` or Blob assumptions.

### 8.5 Library

Library consolidates discovery without collapsing feature boundaries.

- Search field is 44 units high and searches articles/templates/people according to supported contracts.
- Segments: Explore, Saved, Templates, People. Hide or explicitly defer a segment if its backend behavior is not real; do not populate fake content.
- Explore has a featured article, article rows with save state, and template cards.
- Saved and result lists use FlashList and preserve scroll/query state per segment.
- Search loading is debounced/cancelable and must not send stale results over a newer query.
- Article rows navigate to `article/[id]`; template actions route to the appropriate native creation flow.

### 8.6 Me

Me combines account overview and settings navigation.

- Profile header: avatar, name, plan/joined metadata when available, Edit.
- Summary cards: check-ins, streak, goals only when contracts provide trustworthy values.
- Sections: Coaching, Reminders, Appearance, Plan & data.
- Use native Switch controls with accent track.
- Appearance offers System, Light, Dark and uses the existing persisted theme mode.
- Plan & billing opens native subscription management/paywall behavior.
- Export data and delete account require real backend support and confirmation; do not simulate success.
- Destructive operations must use explicit confirmation and the established auth/session cleanup flow.

### 8.7 Article reader

Render supported markdown with `react-native-markdown-display`; never use arbitrary HTML in a WebView.

Style map:

- Body: Instrument Sans 17/29, 20-unit gutters, 14-unit paragraph gap.
- `h1`: Newsreader 32/38.
- `h2`: Newsreader 24/30 with 28 top space.
- `h3`: Instrument Sans semibold 19/25.
- Blockquote: Newsreader italic 18, accent text, two-unit accent left rule, no tinted background.
- Links: accent with an underline; validate external URLs before opening.
- Code: IBM Plex Mono 14/22 on muted background, radius 10, horizontally scrollable.
- Lists: body reader style, muted marker, 8-unit item gap.
- Images: full content width, radius 8, centered 13-unit muted caption.
- Divider: semantic hairline with 28-unit vertical clearance.

Header actions are Back, Save, native Share, and reading size. All are 44-unit targets. Display a three-unit reading progress line below the header. Persist three reader-size choices as non-secret preference and restore scroll position per article. Do not repeat the article title in the navigation header.

### 8.8 Welcome, onboarding, and authentication

- Welcome uses a brand image, “Small things, kept.” display title, primary Get started, and secondary existing-account action.
- Preserve the current seven logical steps and all contract-required fields: goal title/category, motivation, blocker, daily commitment, accountability style, check-in time, and generated habit selection. The HTML’s four-question example is a visual specimen, not approval to remove or merge fields. Changing the seven-step contract requires a separately approved product/backend change.
- Show one logical step per screen, back action, progress line, `n/7` step count, selection limits, and a persistent Continue action.
- Auth fields use visible labels, 48-unit inputs, inline validation, and an accessible show/hide password action.
- Server errors must map to safe localized messages and field/form placement.
- Implement light and dark states and keyboard avoidance.
- Preserve registration, verification, forgot/reset, OAuth, and secure token behavior from `AGENTS.md`.

### 8.9 Paywall

- Present from the limit the user reached; the eyebrow identifies the real limit reason.
- Use RevenueCat offerings and localized store prices. Never use the illustrative Turkish prices from the HTML.
- Show feature list, selectable packages, period equivalent where valid, Continue, Restore purchase, Terms, Privacy, and plain billing/cancellation copy.
- No Stripe checkout and no WebView for native digital subscriptions.
- A purchase callback alone does not unlock access. Reconcile entitlement with the backend before updating gated behavior.
- Cover loading, unavailable offerings, purchase pending, canceled, failed, restored, and backend-reconciliation states.

### 8.10 Notifications and transient states

- Notifications open as a draggable native sheet from Today’s bell and dismiss via drag or Android system back.
- Header includes “Mark all read”. Unread uses an accent dot plus stronger text; read rows use muted text.
- Tapping a row routes only through the validated internal-route allowlist.
- Toasts appear one at a time above tab/navigation chrome, dismiss after four seconds, support one optional action, and pause while screen reader focus is on them.
- Every async screen implements a geometry-matched skeleton, action-oriented empty state, explanatory error state, and offline state where cached data is allowed.

## 9. Delivery phases

Each phase should be a reviewable change set. Keep exactly one phase in progress. Run the verification gate before moving on.

### Phase A — reconcile documentation and establish visual tests

1. Update stale design/navigation statements in `AGENTS.md` so future agents do not reintroduce the old tabs/fonts/palette. Preserve all architecture and generated-code rules.
2. Record the chosen screenshot device matrix: iPhone 16 Pro-sized viewport and Pixel 8-sized viewport, light and dark.
3. Add or confirm a test/render harness for shared components without introducing a second UI framework.
4. Inventory all consumers of color, typography, route names, and old semantic variants.

Exit: conflicts are removed from agent instructions, migration consumers are known, and current screens have baseline captures where practical.

### Phase B — foundations

1. Migrate color schema with temporary compatibility aliases.
2. Install/load fonts and keep splash behavior correct.
3. Add semantic text styles, spacing, radii, minimum target, and duration tokens.
4. Update `Theme`, `ThemedText`, and theme persistence.
5. Add reduced-motion plumbing and platform press feedback.
6. Restyle existing shared primitives and add focused component tests.

Exit: the component sheet can be reproduced in light/dark, at normal and 200% text scale, without feature-specific hex/font values.

### Phase C — shared interaction primitives

Implement `Sheet`, `ListRow`, `SectionLabel`, `SegmentedTabs`, `Chip`, `Skeleton`, `Toast`, `ProgressBar`, `Avatar`, `CheckInControl`, and `StreakBar`. Extend `Screen`, `Button`, `Input`, `Card`, `EmptyState`, and `ErrorState`.

Exit: every primitive has accessibility roles/states, dark mode, disabled/loading/error behavior, reduced motion, and component tests.

### Phase D — route migration and shell

1. Add the five target tab routes and tab bar.
2. Add target stack/modal routes as thin wrappers, using explicit temporary placeholder feature screens only where necessary.
3. Add validated compatibility aliases for old internal identifiers.
4. Verify tab-state preservation, safe areas, keyboard, native back, and dark status/navigation bar appearance.
5. Remove obsolete duplicate tab files after all imports/deep links are migrated.

Exit: Today, Plan, Coach, Library, and Me are the only visible tabs; all target stack destinations resolve safely.

### Phase E — Today, Plan, and Progress

1. Build Today composition and one-tap check-in states.
2. Restyle/recompose habits and goals into Plan.
3. Build Progress using existing weekly-review/activity contracts.
4. Add skeleton, empty, error, refresh, stale/offline, and mutation rollback coverage.

Exit: a user can see today’s plan, check in/undo, manage plan structure, and inspect progress on iOS/Android in both themes.

### Phase F — Library and article reader

1. Implement Library segments and search.
2. Implement saved state and template actions using real contracts.
3. Implement article route, markdown style map, progress, reader preference, save, share, and scroll restoration.
4. Add long-list and malformed/unsupported markdown tests.

Exit: content discovery, save/search, deep linking, offline-readable content, and reader accessibility work end to end.

### Phase G — Me, auth, and onboarding

1. Compose profile/settings into Me.
2. Apply Paper styling to all auth screens and error states.
3. Reconcile backend-required onboarding fields, then implement one-question-per-screen presentation.
4. Verify theme, keyboard, 200% text, screen reader, session restoration, and route guards.

Exit: public/onboarding/account flows use Paper without changing secure auth or contract semantics.

### Phase H — Coach and voice

1. Implement conversation list and entitlement usage state.
2. Implement conversation history, composer, streaming, cancellation, retry, and keyboard states.
3. Implement voice permission, recording/transcription/stream/playback/interruption behavior.
4. Test malformed SSE, auth refresh during stream, app backgrounding, network loss, and cleanup.

Exit: text and voice coaching pass real-device interruption and privacy checks.

### Phase I — notifications and subscriptions

1. Implement notification sheet and allowlisted navigation.
2. Implement limit-aware paywall with RevenueCat offerings and backend reconciliation.
3. Implement restore and legal links with validated destinations.
4. Test sandbox purchases and push routing on real iOS and Android devices when organizational configuration is available.

Exit: notification and subscription behavior is store-compliant and never trusts client entitlement alone.

### Phase J — cleanup and hardening

1. Remove compatibility color aliases and old route artifacts after repository-wide migration.
2. Remove raw feature hex colors, ad hoc typography recipes, and old category rainbow mappings.
3. Audit localization, reduced motion, contrast, screen readers, switch controls, focus order, large text, RTL readiness, and touch targets.
4. Profile long lists, image memory, re-renders, startup/font loading, and animation performance.
5. Complete unit/component, integration, and Maestro critical journeys.

Exit: no old design token/tab/font references remain, all quality gates pass, and the visual acceptance matrix is approved.

## 10. Testing requirements

### Unit and component

- Token objects and theme switching.
- `ThemedText` variant mapping and font scaling.
- Button/Input/Chip/Switch state semantics.
- Check-in optimistic success, rollback, syncing, disabled, and accessibility state.
- Streak text and hidden decorative bars.
- Skeleton/empty/error/offline branching.
- Internal-route allowlist and compatibility aliases.
- Markdown style behavior and safe links.
- Paywall package selection and entitlement reconciliation state machine.

Use React Native Testing Library and test behavior/accessibility rather than implementation details. Mock the shared transport boundary, not feature hooks.

### Integration

- Today query composition and mutation invalidation.
- Plan goal/habit grouping without cross-feature internal imports.
- Search cancellation and stale-result prevention.
- Article save/share/reader preferences/scroll restoration.
- SSE chunking, malformed events, cancellation, auth refresh, and reconnect rules.
- Notification open/read/mark-all/navigation.
- RevenueCat adapter plus backend entitlement refresh.

### Maestro journeys

At minimum:

1. Sign in → Today → check in → undo → Progress.
2. Plan → create/edit habit → link to goal.
3. Library → search → save → article → change reader size → share.
4. Coach → start conversation → stream → stop → resume history.
5. Notification sheet → open a validated destination.
6. Reach a real limit → paywall → cancel and restore/purchase sandbox paths.
7. Switch System/Light/Dark and relaunch.
8. Offline cached read with disabled unsafe writes.

### Visual acceptance matrix

Capture at minimum:

- iOS-sized and Android-sized devices.
- Light and dark.
- Default and 200% font scale.
- Loaded, skeleton, empty, error, offline, and mutation-pending states.
- Keyboard shown on auth and conversation.
- Reduced motion enabled.

Compare against the relevant HTML frame for hierarchy, spacing, typography, color, and state—not pixel-identical system chrome.

## 11. Verification gate for every phase

From `mobile/` run:

```bash
bun run typecheck
bun run lint
bun run test --runInBand
bun run format:check
```

Also run the narrowest relevant tests during implementation. For native/navigation/font/audio/purchase changes, verify on development builds for both iOS and Android; Expo web is not an adequate acceptance environment.

Before declaring a phase complete:

- Review `git diff` for unrelated changes and accidental generated-file edits.
- Search modified feature code for raw hex colors and hardcoded user-facing strings.
- Confirm no token, message content, personal data, or purchase data is logged.
- Confirm no new browser/DOM APIs, feature-local HTTP clients, duplicate stores, or cross-feature internal imports were added.
- Confirm all new async UI includes required non-happy states.
- Confirm dark mode and large text manually.
- Record any backend/product blocker rather than adding fake data or placeholder success behavior.

## 12. Agent completion format

At the end of each implementation phase, report:

1. Phase and scope completed.
2. Files/routes/components changed.
3. Behavior and accessibility covered.
4. Tests and device checks run, with results.
5. Remaining compatibility aliases or temporary placeholders.
6. Contract, product, or organizational blockers.
7. The next phase, but do not begin it unless it is part of the approved task.

A phase is not complete merely because the primary mockup renders. It is complete only when its data flow, native behavior, accessibility, dark theme, non-happy states, tests, and migration cleanup satisfy this guide and `AGENTS.md`.

## 13. Phase A artifacts — device matrix and migration inventory

### 13.1 Visual acceptance device matrix

Capture screenshots and run Maestro journeys against these two device classes, in both light and dark, at default and 200% font scale:

- **iOS-sized**: iPhone 16 Pro class viewport (393 × 852 pt).
- **Android-sized**: Pixel 8 class viewport (412 × 915 dp).

Compare against the relevant HTML frame for hierarchy, spacing, typography, color, and state — not pixel-identical system chrome.

### 13.2 Migration inventory (captured at Phase A baseline)

These counts are a snapshot. Re-run the greps before each phase that touches tokens or routes; the counts drift as code is migrated.

**Color token consumers** — every file that reads `colors.*` via `useTheme()`:

- All `src/design-system/components/*` and `src/design-system/theme/*`.
- `app/(app)/(tabs)/_layout.tsx`, `index.tsx`, `coach.tsx`, `explore.tsx`.
- `app/(public)/index.tsx`, `app/+not-found.tsx`.
- `src/features/auth/screens/*` (6 screens).
- `src/features/goals/{screens,components}/*`, `src/features/habits/{screens,components}/*`.
- `src/features/onboarding/screens/OnboardingScreen.tsx`, `src/features/profile/screens/ProfileScreen.tsx`, `src/features/settings/screens/SettingsScreen.tsx`.

**Old semantic fields still referenced by feature/route code** (keep as temporary aliases, then remove in Phase J):

| Field           | Approx. uses | Paper alias / action                            |
| --------------- | ------------ | ----------------------------------------------- |
| `secondaryText` | 52           | alias of `mutedForeground`                      |
| `primaryText`   | 20           | alias of `foreground`                           |
| `error`         | 17           | alias of `destructive`                          |
| `success`       | 12           | becomes `accent`/`success` (same sage token)    |
| `warning`       | 2            | no Paper equivalent — migrate these two callers |

No feature code references `calm*`, `growth*`, `energy*`, or `chart1`–`chart5`; those exist only in the token definitions and can be dropped from the schema once the type is migrated.

**Typography consumers** — files reading `typography.fontSize.*` / `typography.fontWeight.*`:

- `src/design-system/components/{Badge,Button,Input,Screen,ThemedText}.tsx`.
- `app/(app)/(tabs)/{coach,explore,index}.tsx`, `app/(public)/index.tsx`, `app/+not-found.tsx`.
- `src/features/onboarding/screens/OnboardingScreen.tsx`.

No code consumes `typography.fontFamily` yet (the committed baseline has no font loading). Phase B introduces `fontFamily` and `textStyles`; screens migrate to `ThemedText variant=…`.

**Route names in use** (pre-migration):

- Tabs: `index`, `explore`, `habits`, `coach`, `profile` → become `index` (Today), `plan`, `coach`, `library`, `me`.
- Stack/modal routes referenced: `/(app)/goals`, `/(app)/settings` → fold into Plan and Me respectively.
- Deep-link destinations in `src/core/auth/deep-links.ts`: `habit-detail`, `goal-detail`, `article-detail`, `conversation`, `weekly-review`, `activity`, `notifications`. Only `habit-detail` and `goal-detail` currently resolve (to `/habits`, `/goals`); the rest return `null`. Phase D re-points these to the new IA and adds `progress` as the destination for `weekly-review` and `activity`.

### 13.3 Test/render harness

The component test harness is the `jest-expo` preset plus `@testing-library/react-native`, configured in `jest.config.js` and `jest.setup.js`. Native modules (secure store, netinfo, expo-router, constants, localization) are mocked in `jest.setup.js`. Component tests render through a `ThemeProvider`-wrapped helper added in Phase B; no second UI framework is introduced.

### 13.4 Phase B completion — foundations

Phase B is complete. The verification gate (typecheck, lint, test, format:check) passes with 138 tests.

**Tokens (`src/design-system/tokens/`)**

- `colors.ts` — Paper schema: warm paper ground (`#F6F4EF` light / `#161514` dark), sage accent (`#4F6B57` / `#7FA189`), destructive (`#B4553F` / `#C9705A`), success = accent, plus canonical `foreground`/`mutedForeground`/`surface`/`border`/`input`/`overlay`/`ring`/`muted`/`surfaceElevated`/`accentForeground`/`destructiveForeground`/`successForeground`/`successSoft`. Temporary compat aliases retained: `error`→`destructive`, `secondaryText`→`mutedForeground`, `primaryText`→`foreground`, `primary`→`accent`, `background` (kept), `surface` (kept). Old `calm/growth/energy/chart` semantics removed.
- `spacing.ts` — Paper scale: `xs:4 sm:8 md:12 lg:16 xl:20 xxl:28 xxxl:40`.
- `radius.ts` — canonical `field:8 card:12 sheet:20 pill:999` + deprecated t-shirt aliases (`sm/md/lg/xl/full`) mapping to closest canonical.
- `typography.ts` — `fontFamily` (Newsreader/Instrument Sans/IBM Plex Mono token names), `textStyles` (14 semantic variants: screenTitle/sectionTitle/cardTitle/rowTitle/body/bodySmall/label/meta/caption/numeric/reader/onboardingTitle/articleTitle/welcomeTitle), `resolveTextStyle()` helper, plus t-shirt `fontSize`/`fontWeight`/`lineHeight` scales for one-offs.
- `motion.ts` — `duration` (instant:80 quick:140 base:220 overlay:260 slow:1600) and `hitSlop.minTarget:44`.

**Fonts (`src/design-system/theme/fonts.ts`)**

- `@expo-google-fonts/{newsreader,instrument-sans,ibm-plex-mono}` installed (Sept 2025 releases). `usePaperFonts()` loads the 7 needed weights via `expo-font`'s `loadAsync`. `app/_layout.tsx` keeps the splash visible until `loaded`; on error the app boots with system fallbacks. The `ThemeProvider` accepts `fontsLoaded` and switches the resolved font map from `systemFonts` to the loaded Paper families.

**Theme (`src/design-system/theme/theme.tsx`)**

- `Theme` now exposes `colors`, `spacing`, `typography`, `radius`, `duration`, `fonts` (resolved family map), and `textStyles` (semantic specs). `ThemeProvider` takes `fontsLoaded`. System fallbacks (`System`/`Menlo`) are used until fonts load.

**Hooks (`src/design-system/theme/`)**

- `use-reduced-motion.ts` — reads `AccessibilityInfo.isReduceMotionEnabled`, subscribes to changes, subscription-object cleanup.
- `use-press-feedback.ts` — `useAndroidRipple()` returns `android_ripple` props (28-radius foreground ripple) for Android, empty for iOS; `usePressDuration()` returns `instant` (or `quick` under reduced motion).

**Primitives restyled for Paper**

- `Button` — sage accent primary, 44/52 (md/lg) min targets, opacity (iOS) / ripple (Android) press feedback, `radius.field`.
- `Input` — 48 high, accent focus ring (2px) without glow, destructive invalid ring, `mutedForeground` placeholder.
- `Card` — hairline border, `radius.card` (12), no shadow.
- `Screen` — 20 gutter (`spacing.xl`), canonical colors, `sectionTitle` header.
- `ThemedText` — resolves semantic `textStyles` via `resolveTextStyle` with the loaded font map; legacy `heading` alias → `sectionTitle`.
- `Badge` — pill, label-sized, semantic variant tints.
- `Spinner`/`EmptyState`/`ErrorState` — canonical Paper colors.

**Tests**

- `tokens.test.ts` — asserts the Paper color/spacing/radius/motion/typography values and compat aliases.
- `ThemedText.test.tsx` — semantic variant resolution, tabular-nums, legacy `heading` alias.
- `Button.test.tsx` — variant colors, loading/disabled accessibility states, 44/52 min targets.
- Render helper at `src/design-system/test-utils/render.tsx` (async `renderWithTheme`).

### 13.5 Phase C completion — shared interaction primitives

Phase C is complete. The verification gate passes with 138 tests (17 new).

**New primitives (`src/design-system/components/`)**

- `Sheet.tsx` — wraps `@gorhom/bottom-sheet`; `radius.sheet` (20) top corners, theme overlay backdrop, drag-to-close, `open`/`onClose` controlled API, `forwardRef` to `BottomSheetMethods`.
- `ListRow.tsx` — 44 min target, hairline separator, disclosure chevron when `onPress`, opacity/ripple press feedback.
- `SectionLabel.tsx` — mono, uppercase, letter-spaced, `mutedForeground`, `accessibilityRole="header"`.
- `SegmentedTabs.tsx` — pill container, selected segment on `surface`, `accessibilityRole="tab"` + `selected` state; segment sub-component avoids hook-in-loop.
- `Chip.tsx` — selectable pill, accent when selected, 44 target, `selected` accessibility state.
- `Skeleton.tsx` — `Animated.Value` via `useMemo` (not `useRef`), 1.6s pulse, hidden from accessibility, reduced-motion freezes at full opacity.
- `Toast.tsx` — 4s auto-dismiss, `polite` live region, optional action, pauses on screen reader focus, `overlay` duration fade.
- `ProgressBar.tsx` — hairline track, accent fill, clamped [0,1], decorative (`accessibilityRole="adjustable"`).
- `Avatar.tsx` — circular, `expo-image` for remote, monogram fallback (index-guarded).
- `CheckInControl.tsx` — 28-unit circle in 44-unit pressable, `accessibilityRole="checkbox"` with checked/busy/disabled states, sage fill + check glyph (color not the only indicator).
- `StreakBar.tsx` — 14 decorative bars (hidden from a11y) + textual summary (source of truth).

**Test infrastructure**

- `jest.stubs/lucide-react-native.js` — stubs the ESM-only icon package so component tests don't need to transform `.mjs`. Registered in `jest.config.js` `moduleNameMapper`.
- `eslint.config.js` — test files now disable `i18next/no-literal-string` (test fixtures aren't user-facing).
- `primitives.test.tsx` — 17 tests covering Chip, SegmentedTabs, ListRow, ProgressBar, StreakBar, CheckInControl (parameterized states), SectionLabel, Avatar, Skeleton.
