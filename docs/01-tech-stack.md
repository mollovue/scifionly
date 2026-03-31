# SciFi Only — Tech Stack Specification

## Overview

SciFi Only is a modern web application for searching and browsing sci-fi content sourced from TMDB (The Movie Database). The tech stack is selected for clean separation of concerns, minimal moving parts, and the ability to build an elegant, modern UI.

## Selected Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework — component-based, rich ecosystem |
| Vite | 5.x | Build tool — fast HMR, ES module native |
| Tailwind CSS | 3.x | Utility-first CSS — consistent design system |
| shadcn/ui | latest | Pre-built accessible component library (Radix primitives) |
| TanStack Query | 5.x | Server state management, caching, pagination |
| wouter | latest | Lightweight client-side routing (hash-based) |
| lucide-react | latest | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | Runtime |
| Express | 4.x | HTTP server — minimal, proven, extensible |
| Drizzle ORM | latest | Type-safe SQL query builder |
| better-sqlite3 | latest | Embedded database — zero config, fast, reliable |
| Zod | latest | Runtime schema validation |
| TypeScript | 5.x | Type safety across the entire stack |

### Integration Tool
| Technology | Version | Purpose |
|---|---|---|
| Node.js scripts | — | TMDB data sync (initial load + daily incremental) |
| node-cron | latest | Scheduling daily incremental syncs |
| gzip / zlib | built-in | Decompressing TMDB daily export files |

### Database
| Technology | Purpose |
|---|---|
| SQLite | Embedded relational database — zero deployment overhead, single file, excellent read performance for search workloads |

### Testing
| Technology | Purpose |
|---|---|
| Vitest | Unit and integration testing (Vite-native) |
| Playwright | End-to-end browser testing |
| supertest | HTTP API testing |

## Architecture Decisions

### Why SQLite (not PostgreSQL)?
- **Zero deployment complexity** — no separate database server to install, configure, or maintain
- **Excellent read performance** — sci-fi search is read-heavy; SQLite handles concurrent reads efficiently with WAL mode
- **Single-file portability** — easy backup, easy migration
- **Full-text search** — SQLite FTS5 provides powerful text search without external dependencies (Elasticsearch, etc.)
- **Sufficient scale** — TMDB sci-fi catalog is ~50,000–100,000 entries. SQLite handles millions of rows comfortably.

### Why Express + Vite (not Next.js)?
- **Clean separation** — backend API and frontend are distinct layers with a clear boundary
- **Fewer abstractions** — no server components, no SSR complexity, no framework-specific routing conventions
- **Simpler deployment** — static frontend + Express API server
- **Proven stability** — Express is battle-tested with minimal churn

### Why Drizzle ORM (not Prisma)?
- **Synchronous SQLite support** — better-sqlite3 is synchronous, which Drizzle supports natively
- **Lightweight** — no query engine binary, no generation step
- **SQL-like API** — closer to raw SQL, easier to optimize

### Why FTS5 for Search?
- The primary feature is multi-criteria search across text fields (title, description, cast, etc.)
- SQLite FTS5 supports phrase queries, prefix matching, boolean operators, and ranking
- No external search service needed (Elasticsearch, Meilisearch, etc.)
- FTS5 index auto-updates with data changes

## Project Structure

```
scifionly/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── pages/             # Page-level components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities (API client, query config)
│   │   ├── App.tsx            # Root component with routing
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles + Tailwind
│   └── index.html
├── server/                    # Backend (Express)
│   ├── index.ts               # Server entry
│   ├── routes.ts              # API route definitions
│   ├── storage.ts             # Database access layer (Drizzle)
│   ├── vite.ts                # Vite dev middleware
│   └── static.ts              # Static file serving (production)
├── shared/                    # Shared between client and server
│   └── schema.ts              # Drizzle schema + Zod validation
├── scripts/                   # Integration tools
│   ├── sync-initial.ts        # Initial bulk load from TMDB exports
│   ├── sync-incremental.ts    # Daily incremental sync via TMDB API
│   └── sync-state.json        # Tracks last sync position
├── tests/                     # Test suite
│   ├── unit/                  # Unit tests
│   ├── integration/           # API integration tests
│   └── e2e/                   # Playwright end-to-end tests
├── docs/                      # Specifications
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── drizzle.config.ts
└── README.md
```

## Separation of Concerns

| Layer | Responsibility | Dependencies |
|---|---|---|
| Frontend (client/) | UI rendering, user interaction, client-side state | React, Tailwind, shadcn/ui |
| Backend (server/) | API endpoints, business logic, data validation | Express, Zod |
| Data Layer (shared/schema.ts + server/storage.ts) | Schema definition, database queries | Drizzle, SQLite |
| Integration (scripts/) | TMDB data extraction and loading | TMDB API, Node.js |
| Tests (tests/) | Automated verification | Vitest, Playwright, supertest |

Each layer communicates only through well-defined interfaces:
- Frontend ↔ Backend: REST API (`/api/*` endpoints)
- Backend ↔ Database: Drizzle query builder
- Integration ↔ Database: Same Drizzle schema and storage layer
- Integration ↔ TMDB: HTTP API calls and file downloads
