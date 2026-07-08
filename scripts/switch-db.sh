#!/usr/bin/env bash
# =====================================================================
# CLASS CENTER — Database Provider Switch
# =====================================================================
# Easily switch between local SQLite (dev) and Supabase PostgreSQL (prod)
# without losing your local data or schema.
#
# Usage:
#   ./scripts/switch-db.sh sqlite     # → local dev (default)
#   ./scripts/switch-db.sh postgres   # → production Supabase
#   ./scripts/switch-db.sh status     # → show current provider
# =====================================================================

set -euo pipefail

SCHEMA_DIR="prisma"
SQLITE_SCHEMA="$SCHEMA_DIR/schema.prisma.sqlite"
PG_SCHEMA="$SCHEMA_DIR/schema.prisma.postgres"
ACTIVE_SCHEMA="$SCHEMA_DIR/schema.prisma"

cd "$(dirname "$0")/.."

if [[ "$#" -lt 1 ]]; then
  echo "Usage: $0 <sqlite|postgres|status>"
  exit 1
fi

case "$1" in
  status)
    # Extract the provider value from the `datasource` block specifically
    CURRENT_PROVIDER=$(awk '/datasource/{f=1; next} f&&/\}/{f=0} f&&/provider/{gsub(/^[^"]*"|"$/,""); print; exit}' "$ACTIVE_SCHEMA")
    echo "Current Prisma provider: $CURRENT_PROVIDER"
    if [[ "$CURRENT_PROVIDER" == "sqlite" ]]; then
      echo "→ Local development mode (SQLite at db/custom.db)"
    elif [[ "$CURRENT_PROVIDER" == "postgresql" ]]; then
      echo "→ Production mode (Supabase PostgreSQL — check DATABASE_URL in .env)"
    fi
    ;;

  sqlite)
    if [[ ! -f "$SQLITE_SCHEMA" ]]; then
      echo "ERROR: $SQLITE_SCHEMA not found"
      exit 1
    fi
    cp "$SQLITE_SCHEMA" "$ACTIVE_SCHEMA"
    # Set local DATABASE_URL (absolute path for Prisma)
    PROJECT_DIR="$(pwd)"
    echo "DATABASE_URL=file:${PROJECT_DIR}/db/custom.db" > .env
    mkdir -p db
    echo "✓ Switched to SQLite (local dev)"
    echo "✓ DATABASE_URL set to file:db/custom.db"
    echo ""
    echo "Next steps:"
    echo "  bun run db:generate   # regenerate Prisma client"
    echo "  bun run db:push       # sync schema to local SQLite"
    echo "  bun run dev           # start dev server"
    ;;

  postgres)
    if [[ ! -f "$PG_SCHEMA" ]]; then
      echo "ERROR: $PG_SCHEMA not found"
      exit 1
    fi
    cp "$PG_SCHEMA" "$ACTIVE_SCHEMA"
    echo "✓ Switched to PostgreSQL (Supabase production)"
    echo ""
    echo "IMPORTANT: Set these in your .env (and on Vercel):"
    echo "  DATABASE_URL=\"postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1\""
    echo "  DIRECT_URL=\"postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres\""
    echo "  JWT_SECRET=\"your-long-random-secret\""
    echo ""
    echo "Next steps:"
    echo "  1. Update .env with your Supabase connection string"
    echo "  2. Run prisma/supabase-migration.sql in Supabase SQL Editor (first time only)"
    echo "  3. bun run db:generate   # regenerate Prisma client for PostgreSQL"
    echo "  4. bun run db:push       # sync schema (idempotent with the SQL migration)"
    echo "  5. bun run dev           # test against Supabase locally before Vercel deploy"
    ;;

  *)
    echo "Unknown command: $1"
    echo "Usage: $0 <sqlite|postgres|status>"
    exit 1
    ;;
esac
