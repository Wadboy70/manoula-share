# Manoula Share

React (Vite) + TypeScript + Tailwind + shadcn/ui + Supabase. Product context: [`PROJECT-DESCRIPTION.md`](PROJECT-DESCRIPTION.md).

## Architecture (`src/`)

- **`src/features/<domain>/`** — Domain logic: services, hooks, types, feature UI, and colocated `*.test.*` files. Examples: `features/search`, `features/auth`, `features/home`, `features/professionals`.
- **`src/pages/`** — Thin route screens: compose layout and render feature entry components. Prefer adding new behavior under `features/`, not only under `pages/`.
- **`src/components/ui/`** — shadcn primitives.
- **`src/components/`** — Shared app chrome and reusable blocks that are not tied to a single feature.
- **`src/lib/`** — Shared utilities and the Supabase client ([`src/lib/supabaseClient.ts`](src/lib/supabaseClient.ts)).
- **`src/types/database.ts`** — Generated from Supabase; do not hand-edit (regenerate after schema changes).

## Testing layout

- **Unit / component tests:** colocate as `*.test.ts` or `*.test.tsx` next to the module under `src/`.
- **Integration / cross-route flows:** only under [`src/__tests__/integration/`](src/__tests__/integration/) (e.g. auth, routing, search across surfaces).
- **Shared test harness:** [`src/test/`](src/test/) (see [`src/test/README.md`](src/test/README.md)): `setup.ts`, mocks, and [`src/test/integration/fixtures.ts`](src/test/integration/fixtures.ts) for data builders—do not add a second parallel integration root.

Run **`npm run test:run`** before committing structural changes.

Search/geo table overview for seeds: [`docs/database-schema.md`](docs/database-schema.md).

## Supabase targets and local seeds

- `.env.local` is for local Supabase values.
- `.env.staging` is for remote staging values.
- Both files are gitignored.

### Run against local Supabase

1. Start local stack: `supabase start`
2. Apply local migrations if needed: `supabase db reset --local` or `supabase migration up --local`
3. Put local URL and anon key into `.env.local` (check with `supabase status`)
4. Seed manual testing data: `npm run seed:local`
5. Run app: `npm run dev:local`

### Run against staging Supabase

- Ensure `.env.staging` has the staging project URL + anon key
- Start app with staging env override: `npm run dev:staging`

### Seed helpers

- `npm run seed:local` → apply `supabase/seeds/local_search_seed.sql` to local DB
- `npm run seed:local:reset` → reset local DB and then apply seed

### Generated TypeScript types

After remote schema changes, regenerate app types, for example:

```bash
supabase gen types typescript --linked > src/types/database.ts
```

(Use your linked project flags as documented in the Supabase CLI.)

## React + Vite (template reference)

Official Vite React plugins:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc/README.md)

## Expanding ESLint

For type-aware lint rules see the [TypeScript ESLint](https://typescript-eslint.io) docs and the [Vite React TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts).
