# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

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

- `npm run seed:local` -> apply `supabase/seeds/local_search_seed.sql` to local DB
- `npm run seed:local:reset` -> reset local DB and then apply seed
