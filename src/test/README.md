# Test harness (`src/test/`)

This folder is **not** for integration test suites.

- **`setup.ts`** — Vitest global setup (jest-dom, RTL cleanup).
- **`mocks/`** — Shared mock shapes and documentation for Supabase-style clients.
- **`integration/fixtures.ts`** — Builders and shared data for tests under **`src/__tests__/integration/`** only.

Cross-route flows belong in **`src/__tests__/integration/`**, not here.
