# E2E Tests (Maestro)

End-to-end tests for the Growth mobile app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. Install Maestro:

   ```sh
   curl -Ls "https://get.maestro.mobile" | bash
   ```

2. Install the app on a simulator/emulator:

   ```sh
   # iOS Simulator
   bun run ios

   # Android Emulator
   bun run android
   ```

3. Set the app ID (use the development bundle ID):
   ```sh
   export MAESTRO_APP_ID=com.growth.app.dev  # iOS
   # or
   export MAESTRO_APP_ID=com.growth.app.dev  # Android
   ```

## Running tests

```sh
# Run all e2e tests
maestro test e2e/

# Run a specific test
maestro test e2e/app-launch.yml
```

## Test files

- `app-launch.yml` — Smoke test: app launches and shows the landing screen.
