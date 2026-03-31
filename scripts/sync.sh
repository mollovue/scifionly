#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# SciFi Only — Sync Helper Script
#
# Usage:
#   ./scripts/sync.sh status               Show sync state and DB counts
#   ./scripts/sync.sh initial              Run initial full load from TMDB
#   ./scripts/sync.sh initial --force      Force re-run initial load
#   ./scripts/sync.sh incremental          Run incremental sync
#   ./scripts/sync.sh incremental --dry-run Preview incremental sync (no DB changes)
#   ./scripts/sync.sh seed                 Seed demo data (no TMDB key needed)
#   ./scripts/sync.sh seed --clear         Clear existing data, then seed demo
#   ./scripts/sync.sh backup               Back up the SQLite database
# ──────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="${PROJECT_DIR}/data"
DB_FILE="${DATABASE_PATH:-${DATA_DIR}/scifionly.db}"
LOG_DIR="${PROJECT_DIR}/logs"
BACKUP_DIR="${PROJECT_DIR}/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Prerequisite checks ──────────────────────────────────────

check_node() {
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. See: https://nodejs.org/"
    exit 1
  fi
  local node_major
  node_major=$(node -v | sed 's/v//' | cut -d. -f1)
  if (( node_major < 20 )); then
    log_error "Node.js 20+ required (found $(node -v))"
    exit 1
  fi
}

check_deps() {
  if [ ! -d "${PROJECT_DIR}/node_modules" ]; then
    log_error "Dependencies not installed. Run: npm install"
    exit 1
  fi
}

check_tmdb_key() {
  if [ -z "${TMDB_API_KEY:-}" ]; then
    # Try loading from .env file
    if [ -f "${PROJECT_DIR}/.env" ]; then
      set -a
      # shellcheck source=/dev/null
      source "${PROJECT_DIR}/.env"
      set +a
    fi
    if [ -z "${TMDB_API_KEY:-}" ]; then
      log_error "TMDB_API_KEY is not set."
      echo "  Set it in your environment:  export TMDB_API_KEY=your_bearer_token"
      echo "  Or add it to ${PROJECT_DIR}/.env:  TMDB_API_KEY=your_bearer_token"
      echo ""
      echo "  Get your API Read Access Token from:"
      echo "    https://www.themoviedb.org/settings/api"
      exit 1
    fi
  fi
}

ensure_dirs() {
  mkdir -p "$DATA_DIR" "$LOG_DIR" "$BACKUP_DIR"
}

# ── Commands ─────────────────────────────────────────────────

cmd_status() {
  check_node
  check_deps
  cd "$PROJECT_DIR"
  npx tsx scripts/sync-status.ts
}

cmd_initial() {
  check_node
  check_deps
  check_tmdb_key
  ensure_dirs

  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local logfile="${LOG_DIR}/sync-initial_${timestamp}.log"

  log_info "Starting initial sync..."
  log_info "Log file: ${logfile}"
  echo ""

  cd "$PROJECT_DIR"
  npx tsx scripts/sync-initial.ts "$@" 2>&1 | tee "$logfile"
  local exit_code=${PIPESTATUS[0]}

  echo ""
  if [ "$exit_code" -eq 0 ]; then
    log_info "Initial sync completed successfully."
  else
    log_error "Initial sync failed (exit code ${exit_code}). Check ${logfile}"
  fi

  return "$exit_code"
}

cmd_incremental() {
  check_node
  check_deps
  check_tmdb_key
  ensure_dirs

  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local logfile="${LOG_DIR}/sync-incremental_${timestamp}.log"

  log_info "Starting incremental sync..."
  log_info "Log file: ${logfile}"
  echo ""

  cd "$PROJECT_DIR"
  npx tsx scripts/sync-incremental.ts "$@" 2>&1 | tee "$logfile"
  local exit_code=${PIPESTATUS[0]}

  echo ""
  if [ "$exit_code" -eq 0 ]; then
    log_info "Incremental sync completed successfully."
  else
    log_error "Incremental sync failed (exit code ${exit_code}). Check ${logfile}"
  fi

  return "$exit_code"
}

cmd_seed() {
  check_node
  check_deps
  ensure_dirs

  log_info "Seeding demo data..."
  cd "$PROJECT_DIR"
  npx tsx scripts/seed-demo.ts "$@"
  log_info "Demo data seeded."
}

cmd_backup() {
  ensure_dirs

  if [ ! -f "$DB_FILE" ]; then
    log_error "Database file not found: ${DB_FILE}"
    exit 1
  fi

  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local backup_file="${BACKUP_DIR}/scifionly_${timestamp}.db"

  log_info "Backing up database..."
  cp "$DB_FILE" "$backup_file"

  # Also copy WAL file if present
  if [ -f "${DB_FILE}-wal" ]; then
    cp "${DB_FILE}-wal" "${backup_file}-wal"
  fi

  local size
  size=$(du -sh "$backup_file" | cut -f1)
  log_info "Backup saved: ${backup_file} (${size})"

  # Clean up old backups (keep last 10)
  local count
  count=$(ls -1 "${BACKUP_DIR}"/scifionly_*.db 2>/dev/null | wc -l)
  if (( count > 10 )); then
    local to_delete=$((count - 10))
    log_info "Cleaning up ${to_delete} old backup(s)..."
    ls -1t "${BACKUP_DIR}"/scifionly_*.db | tail -"$to_delete" | while read -r f; do
      rm -f "$f" "${f}-wal"
    done
  fi
}

# ── Usage ────────────────────────────────────────────────────

usage() {
  echo ""
  echo -e "${CYAN}SciFi Only — Sync Helper${NC}"
  echo ""
  echo "Usage: $0 <command> [options]"
  echo ""
  echo "Commands:"
  echo "  status                 Show sync state and database counts"
  echo "  initial [--force]      Run initial full load from TMDB"
  echo "  incremental [--dry-run] Run daily incremental sync"
  echo "  seed [--clear]         Seed demo data (no TMDB key needed)"
  echo "  backup                 Back up the SQLite database"
  echo ""
  echo "Environment:"
  echo "  TMDB_API_KEY           TMDB API Read Access Token (required for sync)"
  echo "  DATABASE_PATH          Custom database path (default: data/scifionly.db)"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────

case "${1:-}" in
  status)       shift; cmd_status "$@" ;;
  initial)      shift; cmd_initial "$@" ;;
  incremental)  shift; cmd_incremental "$@" ;;
  seed)         shift; cmd_seed "$@" ;;
  backup)       shift; cmd_backup "$@" ;;
  -h|--help|"") usage ;;
  *)
    log_error "Unknown command: $1"
    usage
    exit 1
    ;;
esac
