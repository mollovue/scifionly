# SciFi Only — Installation and Operation Guide

This guide covers everything needed to install, configure, build, deploy, and operate SciFi Only on Ubuntu, including TMDB data synchronization and ongoing maintenance.

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Install Dependencies](#3-install-dependencies)
4. [Obtain a TMDB API Key](#4-obtain-a-tmdb-api-key)
5. [Configuration](#5-configuration)
6. [Database Initialization and Initial Data Load](#6-database-initialization-and-initial-data-load)
7. [Running in Development Mode](#7-running-in-development-mode)
8. [Production Build and Deployment](#8-production-build-and-deployment)
9. [Running Tests](#9-running-tests)
10. [Incremental Sync Operations](#10-incremental-sync-operations)
11. [Sync Helper Script Reference](#11-sync-helper-script-reference)
12. [Automated Daily Sync with systemd](#12-automated-daily-sync-with-systemd)
13. [Backups](#13-backups)
14. [Reverse Proxy with Nginx](#14-reverse-proxy-with-nginx)
15. [Monitoring and Troubleshooting](#15-monitoring-and-troubleshooting)

---

## 1. Prerequisites

Install the following on your Ubuntu system.

### Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify the installation:

```bash
node --version    # Expected: v20.x.x
npm --version     # Expected: 10.x.x
```

### Build Essentials

`better-sqlite3` compiles a native C module during `npm install`. The compiler toolchain is required:

```bash
sudo apt-get install -y build-essential python3
```

### Git

```bash
sudo apt-get install -y git
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/intergist/scifionly.git
cd scifionly
```

All subsequent commands in this guide assume you are inside the `scifionly/` project root.

---

## 3. Install Dependencies

```bash
npm install
```

This installs all runtime and development dependencies, including compiling the native `better-sqlite3` module. Expect this to take 30–60 seconds.

---

## 4. Obtain a TMDB API Key

A TMDB API key is required for the initial full load and for incremental syncs. It is **not** needed if you only want to run the app with demo data.

1. Create a free account at [https://www.themoviedb.org/signup](https://www.themoviedb.org/signup).
2. Go to [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
3. Copy the **API Read Access Token** (the long Bearer token, not the short API Key).

---

## 5. Configuration

Create a `.env` file in the project root:

```bash
cat > .env << 'EOF'
# Required for TMDB sync (initial + incremental)
TMDB_API_KEY=your_bearer_token_here

# Optional overrides (defaults shown)
# TMDB_BASE_URL=https://api.themoviedb.org/3
# DATABASE_PATH=./data/scifionly.db
# SYNC_RATE_LIMIT_MS=300
# PORT=5000
EOF
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `TMDB_API_KEY` | For sync | — | TMDB API Read Access Token |
| `DATABASE_PATH` | No | `./data/scifionly.db` | Path to the SQLite database file |
| `SYNC_RATE_LIMIT_MS` | No | `300` | Minimum milliseconds between TMDB API calls |
| `PORT` | No | `5000` | HTTP port for the web server |

---

## 6. Database Initialization and Initial Data Load

The database and all tables are created automatically the first time any script or the server accesses the database. No manual schema migration step is needed.

You have two options for populating data.

### Option A: Demo Data (no TMDB key needed)

Seeds 99 movies and 30 TV series with realistic data. Good for development and testing:

```bash
npx tsx scripts/seed-demo.ts
```

To clear existing data and re-seed:

```bash
npx tsx scripts/seed-demo.ts --clear
```

### Option B: Full TMDB Load (requires TMDB key)

Loads all sci-fi movies and TV series from TMDB. This is the path for production deployments.

Ensure your `TMDB_API_KEY` is set (in `.env` or your environment), then run:

```bash
npx tsx scripts/sync-initial.ts
```

Or using the helper script:

```bash
./scripts/sync.sh initial
```

**What this does:**

1. Fetches the TMDB genre list.
2. Discovers all sci-fi movie IDs via `/discover/movie?with_genres=878` (up to 10,000 results).
3. Discovers all sci-fi TV series IDs via `/discover/tv?with_genres=10765`.
4. Fetches full details for each title (including credits and keywords) via TMDB API.
5. Upserts everything into the database within per-record transactions.
6. Rebuilds FTS5 full-text search index with denormalized cast/crew/keyword names.
7. Updates `sync_state` to mark the initial load as complete.

**Expected duration:** 2–4 hours depending on the TMDB rate limit. The script rate-limits itself to ~3 requests/second and includes exponential backoff on 429 responses. Progress is checkpointed every 50 records, so if interrupted, re-running resumes safely (upsert logic is idempotent).

**Expected result:** ~8,000–10,000 movies and ~2,000–4,000 TV series.

**To force a re-run** after the initial load has already completed:

```bash
npx tsx scripts/sync-initial.ts --force
```

---

## 7. Running in Development Mode

```bash
npm run dev
```

This starts the Express server on port 5000 with Vite's HMR middleware for the React frontend. Open [http://localhost:5000](http://localhost:5000) in your browser.

The development server:
- Serves the React frontend via Vite with hot module replacement.
- Proxies `/api/*` requests to the Express backend.
- Uses the SQLite database in `data/scifionly.db`.

---

## 8. Production Build and Deployment

### Build

```bash
npm run build
```

This produces:
- `dist/public/` — Static frontend assets (HTML, CSS, JS).
- `dist/index.cjs` — Bundled server (Express + API routes).

### Run in Production

```bash
npm start
```

This runs `NODE_ENV=production node dist/index.cjs`, which:
- Serves the pre-built static frontend from `dist/public/`.
- Exposes the API on port 5000 (configurable via `PORT`).

### Production Deployment as a systemd Service

For a production Ubuntu server, create a dedicated user and install as a service:

```bash
# Create a system user
sudo useradd --system --create-home --home-dir /opt/scifionly --shell /bin/false scifionly

# Copy project files
sudo cp -r . /opt/scifionly/
sudo chown -R scifionly:scifionly /opt/scifionly/

# Install the systemd service
sudo cp /opt/scifionly/scripts/systemd/scifionly.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable scifionly
sudo systemctl start scifionly
```

Check the service status:

```bash
sudo systemctl status scifionly
sudo journalctl -u scifionly -f
```

---

## 9. Running Tests

```bash
# Run all tests (163 tests across 5 suites)
npm test

# Run tests in watch mode during development
npm run test:watch
```

Tests cover:
- **Unit tests:** storage layer, image cache, image fetcher.
- **Integration tests:** API endpoints, image API endpoints.

---

## 10. Incremental Sync Operations

After the initial load, keep the database current by running incremental syncs. The incremental sync uses the TMDB Changes API to find titles that have been modified since the last sync.

### How It Works

1. Reads `last_change_date` from the `sync_state` table.
2. Queries `/movie/changes` and `/tv/changes` for the date range.
3. For each changed ID, fetches full details from the TMDB API.
4. If the title has the sci-fi genre: upserts it into the database.
5. If the title is in the database but no longer sci-fi: removes it.
6. Updates `sync_state` with the new `last_change_date`.

### Running Manually

```bash
# Run the incremental sync
npx tsx scripts/sync-incremental.ts

# Or using the helper script (recommended — logs to file automatically)
./scripts/sync.sh incremental
```

### Dry Run (Preview Mode)

Preview what would change without modifying the database:

```bash
npx tsx scripts/sync-incremental.ts --dry-run

# Or
./scripts/sync.sh incremental --dry-run
```

### Check Sync Status

```bash
npx tsx scripts/sync-status.ts

# Or
./scripts/sync.sh status
```

This displays:
- Last sync date and type.
- Total movies and TV series in the database.
- Top 5 titles by popularity.
- Staleness indicator (how many days since last sync).

### Handling Long Gaps

If the gap between the last sync and today exceeds 14 days (the TMDB Changes API maximum window), the script automatically splits the range into 14-day chunks and processes them sequentially. No special handling is needed.

### Idempotency and Safety

- All database writes use upsert (INSERT OR REPLACE), so running the same sync twice is safe.
- Date ranges overlap by one day to prevent gaps at boundaries.
- Per-record transactions ensure atomicity — a failure on one record does not affect others.

---

## 11. Sync Helper Script Reference

A wrapper script is provided at `scripts/sync.sh` for convenience. It handles prerequisite checks, `.env` loading, log rotation, and error reporting.

```
Usage: ./scripts/sync.sh <command> [options]

Commands:
  status                 Show sync state and database counts
  initial [--force]      Run initial full load from TMDB
  incremental [--dry-run] Run daily incremental sync
  seed [--clear]         Seed demo data (no TMDB key needed)
  backup                 Back up the SQLite database
```

Features:
- Automatically checks for Node.js 20+, installed dependencies, and TMDB key.
- Loads environment variables from `.env` if `TMDB_API_KEY` is not already set.
- Writes timestamped logs to `logs/` for each sync run.
- `backup` command copies the database to `backups/` with timestamp, retaining the last 10 backups.

---

## 12. Automated Daily Sync with systemd

Three systemd unit files are provided in `scripts/systemd/`:

| File | Purpose |
|---|---|
| `scifionly.service` | Runs the web application as a daemon |
| `scifionly-sync.service` | One-shot service that runs the incremental sync |
| `scifionly-sync.timer` | Triggers the sync service daily at 09:00 UTC |

### Install the Timer

```bash
# Copy the unit files
sudo cp /opt/scifionly/scripts/systemd/scifionly-sync.service /etc/systemd/system/
sudo cp /opt/scifionly/scripts/systemd/scifionly-sync.timer /etc/systemd/system/

# Reload, enable, and start
sudo systemctl daemon-reload
sudo systemctl enable scifionly-sync.timer
sudo systemctl start scifionly-sync.timer
```

### Verify the Timer

```bash
# Check timer status
sudo systemctl list-timers | grep scifionly

# View next scheduled run
sudo systemctl status scifionly-sync.timer
```

### View Sync Logs

```bash
# Live log output
sudo journalctl -u scifionly-sync -f

# Last sync run
sudo journalctl -u scifionly-sync --since today
```

### Run the Sync Manually via systemd

```bash
sudo systemctl start scifionly-sync.service
```

### Alternative: cron

If you prefer cron over systemd timers:

```bash
# Edit crontab for the scifionly user
sudo crontab -u scifionly -e
```

Add this line:

```cron
0 9 * * * cd /opt/scifionly && /opt/scifionly/scripts/sync.sh incremental >> /opt/scifionly/logs/cron.log 2>&1
```

This runs the incremental sync daily at 09:00 UTC (after TMDB daily exports are available at ~08:00 UTC).

---

## 13. Backups

### Manual Backup

```bash
./scripts/sync.sh backup
```

This copies the SQLite database to `backups/scifionly_YYYYMMDD_HHMMSS.db` and automatically prunes backups older than the most recent 10.

### Pre-Sync Backup

A good practice is to back up before each sync:

```bash
./scripts/sync.sh backup && ./scripts/sync.sh incremental
```

### Restore from Backup

```bash
# Stop the service first
sudo systemctl stop scifionly

# Replace the database
cp backups/scifionly_20260330_090000.db data/scifionly.db

# Restart
sudo systemctl start scifionly
```

---

## 14. Reverse Proxy with Nginx

For production, place Nginx in front of the Node.js server:

```bash
sudo apt-get install -y nginx
```

Create `/etc/nginx/sites-available/scifionly`:

```nginx
server {
    listen 80;
    server_name scifion.ly www.scifion.ly;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and start:

```bash
sudo ln -s /etc/nginx/sites-available/scifionly /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

For HTTPS, add a certificate with Certbot:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d scifion.ly -d www.scifion.ly
```

---

## 15. Monitoring and Troubleshooting

### Check Application Health

```bash
# Is the server running?
curl -s http://localhost:5000/api/stats | python3 -m json.tool

# Check systemd service
sudo systemctl status scifionly
```

### Check Sync Health

```bash
./scripts/sync.sh status
```

Look for the staleness indicator at the bottom:
- `✓ Sync is up to date (synced today)` — healthy.
- `⚠ Sync may be stale (N days since last change date)` — run an incremental sync.
- `✗ Sync is outdated!` — run an incremental sync immediately.

### View Logs

```bash
# Application logs (systemd)
sudo journalctl -u scifionly -f

# Sync logs (file-based)
ls -lt logs/
cat logs/sync-incremental_*.log | tail -50

# Sync logs (systemd timer)
sudo journalctl -u scifionly-sync --since "24 hours ago"
```

### Common Issues

| Problem | Cause | Solution |
|---|---|---|
| `TMDB_API_KEY is not set` | Missing API key | Set `TMDB_API_KEY` in `.env` or environment |
| `npm install` fails with compiler errors | Missing build tools | Run `sudo apt-get install -y build-essential python3` |
| `No last_change_date found` when running incremental sync | Initial sync not completed | Run `./scripts/sync.sh initial` first |
| `Already up to date` from incremental sync | Sync was already run today | This is normal; no changes needed |
| Sync takes very long | TMDB rate limiting | Normal for initial load (2–4 hours). The script backs off automatically. |
| Database locked errors | Concurrent write access | Ensure only one sync process runs at a time. The systemd timer handles this. |
| Port 5000 already in use | Another process on the port | Change `PORT` in `.env` or stop the conflicting process |

### Database Inspection

You can query the database directly with the SQLite CLI:

```bash
sudo apt-get install -y sqlite3

sqlite3 data/scifionly.db "SELECT COUNT(*) FROM movies;"
sqlite3 data/scifionly.db "SELECT COUNT(*) FROM tv_series;"
sqlite3 data/scifionly.db "SELECT * FROM sync_state;"
sqlite3 data/scifionly.db "SELECT title, release_date, vote_average FROM movies ORDER BY popularity DESC LIMIT 10;"
```

---

## Quick Reference

| Task | Command |
|---|---|
| Install dependencies | `npm install` |
| Seed demo data | `./scripts/sync.sh seed` |
| Run initial TMDB load | `./scripts/sync.sh initial` |
| Run incremental sync | `./scripts/sync.sh incremental` |
| Preview sync (dry run) | `./scripts/sync.sh incremental --dry-run` |
| Check sync status | `./scripts/sync.sh status` |
| Back up database | `./scripts/sync.sh backup` |
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Start production server | `npm start` |
| Run tests | `npm test` |
