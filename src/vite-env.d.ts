/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Set to `'false'` to re-enable marketplace routes and auth chrome. */
  readonly VITE_PRELAUNCH_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
