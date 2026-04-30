#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/supabase-prod-smoke.sh [--supabase-url <url>] [--anon-key <key>] [--db-url <postgres-url>]

Purpose:
  Run a fast production smoke test for this profile/dashboard rollout.

What it checks:
  1) Auth API reachability (better key/url validation than REST root)
  2) Edge function invoke for location (search + profile mode)
  3) (Optional) SQL assertions for bucket/policies via psql

Inputs:
  --supabase-url   Optional. Falls back to VITE_SUPABASE_URL
  --anon-key       Optional. Falls back to VITE_SUPABASE_ANON_KEY
  --db-url         Optional. If provided (or SUPABASE_DB_URL set), runs SQL checks
  -h, --help       Show this help

Examples:
  scripts/supabase-prod-smoke.sh
  scripts/supabase-prod-smoke.sh --supabase-url https://xyz.supabase.co --anon-key <anon>
  scripts/supabase-prod-smoke.sh --db-url "postgresql://postgres:***@db.xyz.supabase.co:5432/postgres"
EOF
}

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"
DB_URL="${SUPABASE_DB_URL:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --supabase-url)
      SUPABASE_URL="${2:-}"
      shift 2
      ;;
    --anon-key)
      ANON_KEY="${2:-}"
      shift 2
      ;;
    --db-url)
      DB_URL="${2:-}"
      shift 2
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

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" ]]; then
  echo "Error: missing Supabase URL or anon key." >&2
  echo "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or pass --supabase-url/--anon-key." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required." >&2
  exit 1
fi

FAILURES=0
LAST_HTTP_CODE=""
LAST_RESPONSE_FILE=""

pass() {
  echo "PASS: $1"
}

fail() {
  echo "FAIL: $1"
  FAILURES=$((FAILURES + 1))
}

check_http_ok() {
  local name="$1"
  local method="$2"
  local url="$3"
  local body="${4:-}"
  local auth_mode="${5:-anon_bearer}"

  LAST_RESPONSE_FILE="$(mktemp -t supabase-smoke-response.XXXXXX)"
  local http_code
  if [[ -n "$body" ]]; then
    if [[ "$auth_mode" == "apikey_only" ]]; then
      http_code=$(curl -sS -o "$LAST_RESPONSE_FILE" -w "%{http_code}" \
        -X "$method" "$url" \
        -H "apikey: $ANON_KEY" \
        -H "Content-Type: application/json" \
        --data "$body")
    else
      http_code=$(curl -sS -o "$LAST_RESPONSE_FILE" -w "%{http_code}" \
        -X "$method" "$url" \
        -H "apikey: $ANON_KEY" \
        -H "Authorization: Bearer $ANON_KEY" \
        -H "Content-Type: application/json" \
        --data "$body")
    fi
  else
    if [[ "$auth_mode" == "apikey_only" ]]; then
      http_code=$(curl -sS -o "$LAST_RESPONSE_FILE" -w "%{http_code}" \
        -X "$method" "$url" \
        -H "apikey: $ANON_KEY")
    else
      http_code=$(curl -sS -o "$LAST_RESPONSE_FILE" -w "%{http_code}" \
        -X "$method" "$url" \
        -H "apikey: $ANON_KEY" \
        -H "Authorization: Bearer $ANON_KEY")
    fi
  fi

  LAST_HTTP_CODE="$http_code"
  if [[ "$http_code" == "200" || "$http_code" == "201" || "$http_code" == "204" ]]; then
    pass "$name (HTTP $http_code)"
  else
    fail "$name (HTTP $http_code)"
    echo "  Response:"
    sed 's/^/    /' "$LAST_RESPONSE_FILE" || true
    if [[ "$http_code" == "401" ]]; then
      echo "  Hint:"
      echo "    This usually means your SUPABASE_URL and ANON_KEY do not belong to the same project."
      echo "    Verify both values were copied from the exact same production project."
    fi
  fi
}

echo "==> API/function smoke checks"
check_http_ok "Auth settings endpoint reachable" "GET" "${SUPABASE_URL}/auth/v1/settings" "" "apikey_only"
check_http_ok "Location function (search mode)" "POST" "${SUPABASE_URL}/functions/v1/location" '{"query":"London","mode":"search"}'
check_http_ok "Location function (profile mode)" "POST" "${SUPABASE_URL}/functions/v1/location" '{"query":"London","mode":"profile"}'

if [[ -n "$DB_URL" ]]; then
  echo "==> SQL policy checks (psql)"
  if ! command -v psql >/dev/null 2>&1; then
    fail "psql not installed; cannot run SQL checks"
  else
    bucket_row=$(psql "$DB_URL" -tA -c "
      select id || '|' || file_size_limit || '|' || array_to_string(allowed_mime_types, ',')
      from storage.buckets
      where id = 'profile-photos';
    " | tr -d '\r')

    if [[ "$bucket_row" == profile-photos\|3145728\|*image/jpeg* && "$bucket_row" == *image/png* && "$bucket_row" == *image/webp* ]]; then
      pass "profile-photos bucket limits and MIME types"
    else
      fail "profile-photos bucket limits and MIME types"
      echo "  Got: ${bucket_row:-<empty>}"
    fi

    policy_count=$(psql "$DB_URL" -tA -c "
      select count(*)
      from pg_policies
      where schemaname = 'storage'
        and tablename = 'objects'
        and policyname in (
          'profile_photos_public_read',
          'profile_photos_insert_own',
          'profile_photos_update_own',
          'profile_photos_delete_own'
        );
    " | tr -d '[:space:]')

    if [[ "$policy_count" == "4" ]]; then
      pass "storage.objects profile photo policies present"
    else
      fail "storage.objects profile photo policies present"
      echo "  Found count: ${policy_count:-<empty>}"
    fi

    specialties_policy_count=$(psql "$DB_URL" -tA -c "
      select count(*)
      from pg_policies
      where schemaname = 'public'
        and tablename = 'professional_specialties'
        and policyname in (
          'professional_specialties_insert_own',
          'professional_specialties_update_own',
          'professional_specialties_delete_own'
        );
    " | tr -d '[:space:]')

    if [[ "$specialties_policy_count" == "3" ]]; then
      pass "professional_specialties write policies present"
    else
      fail "professional_specialties write policies present"
      echo "  Found count: ${specialties_policy_count:-<empty>}"
    fi
  fi
else
  echo "==> Skipping SQL checks (no --db-url / SUPABASE_DB_URL provided)"
fi

if [[ "$FAILURES" -gt 0 ]]; then
  echo
  echo "Smoke test completed with ${FAILURES} failure(s)."
  exit 1
fi

echo
echo "Smoke test passed."
