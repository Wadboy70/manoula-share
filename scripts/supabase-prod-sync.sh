#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/supabase-prod-sync.sh --project-ref <prod-project-ref> [--yes] [--skip-functions] [--regen-types]

What this does:
  1) Links Supabase CLI to the provided production project
  2) Pushes pending migrations
  3) Deploys required edge functions (location, profile-update)
  4) Optionally regenerates linked DB types into src/types/database.ts

Options:
  --project-ref <ref>  Required. Production Supabase project ref.
  --yes                Skip interactive production confirmation.
  --skip-functions     Skip edge function deploy step.
  --regen-types        Run supabase gen types typescript --linked > src/types/database.ts
  -h, --help           Show this help text.
EOF
}

PROJECT_REF=""
SKIP_CONFIRM=0
SKIP_FUNCTIONS=0
REGEN_TYPES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-ref)
      PROJECT_REF="${2:-}"
      shift 2
      ;;
    --yes)
      SKIP_CONFIRM=1
      shift
      ;;
    --skip-functions)
      SKIP_FUNCTIONS=1
      shift
      ;;
    --regen-types)
      REGEN_TYPES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PROJECT_REF" ]]; then
  echo "Error: --project-ref is required." >&2
  usage
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "Error: supabase CLI not found in PATH." >&2
  exit 1
fi

if [[ ! -f "supabase/config.toml" ]]; then
  echo "Error: run this script from the repo root (missing supabase/config.toml)." >&2
  exit 1
fi

if [[ "$SKIP_CONFIRM" -eq 0 ]]; then
  echo "You are about to apply migrations/functions to PRODUCTION project: $PROJECT_REF"
  read -r -p "Type 'prod' to continue: " CONFIRM
  if [[ "$CONFIRM" != "prod" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

echo "==> Linking Supabase project: $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

echo "==> Pushing pending migrations"
supabase db push

if [[ "$SKIP_FUNCTIONS" -eq 0 ]]; then
  echo "==> Deploying edge functions"
  supabase functions deploy location
  supabase functions deploy profile-update
else
  echo "==> Skipping edge function deploys (--skip-functions)"
fi

if [[ "$REGEN_TYPES" -eq 1 ]]; then
  echo "==> Regenerating linked DB types to src/types/database.ts"
  supabase gen types typescript --linked > src/types/database.ts
fi

cat <<'EOF'

Done.
Next checks:
  - Verify production env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  - Verify MAPBOX_ACCESS_TOKEN secret for location function if needed
  - Smoke test profile edit flow in production
EOF
