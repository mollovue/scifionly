# SciFi Only

A modern web application for searching and browsing sci-fi movies and TV series, powered by [TMDB](https://www.themoviedb.org/) (The Movie Database).

**Website**: [scifion.ly](https://scifion.ly)

## Features

- **Multi-criteria search** with AND logic across all content dimensions
- Search by title, description, cast, crew, keywords, and more
- Advanced filters: year range, rating, status, language, content type
- Browse curated lists: Trending, Top Rated, Recent, Upcoming
- Detailed movie and TV series pages with cast, crew, and metadata
- Dark/light mode with a futuristic sci-fi aesthetic
- **107 automated tests** (unit + integration)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3, shadcn/ui, TanStack Query 5 |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite + Drizzle ORM + FTS5 full-text search |
| Testing | Vitest, Supertest, Playwright |

## Quick Start

```bash
# Install dependencies
npm install

# Seed demo data (99 movies + 30 TV series)
npx tsx scripts/seed-demo.ts

# Start development server
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

## TMDB Integration

SciFi Only uses a hybrid approach to sync data from TMDB:

1. **Initial load**: TMDB daily export files + API enrichment
2. **Incremental updates**: TMDB Changes API for daily sync

```bash
# Set your TMDB API key
export TMDB_API_KEY=your_bearer_token

# Run initial sync
npx tsx scripts/sync-initial.ts

# Run incremental sync
npx tsx scripts/sync-incremental.ts

# Check sync status
npx tsx scripts/sync-status.ts
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
scifionly/
├── client/          # React frontend
├── server/          # Express backend + API routes
├── shared/          # Shared schema (Drizzle ORM)
├── scripts/         # TMDB integration tools
├── tests/           # Unit + integration tests
├── docs/            # Specifications
└── data/            # SQLite database (gitignored)
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/search` | Multi-criteria search with filters |
| GET | `/api/movies/:id` | Movie details with cast/crew/genres |
| GET | `/api/movies/trending` | Trending movies |
| GET | `/api/movies/top-rated` | Top rated movies |
| GET | `/api/movies/recent` | Recently released |
| GET | `/api/movies/upcoming` | Upcoming movies |
| GET | `/api/tv/:id` | TV series details |
| GET | `/api/tv/trending` | Trending TV series |
| GET | `/api/tv/top-rated` | Top rated TV series |
| GET | `/api/autocomplete/people` | People name search |
| GET | `/api/autocomplete/keywords` | Keyword search |
| GET | `/api/stats` | Database statistics |

## Documentation

Detailed specifications are in the `docs/` directory:

- [Tech Stack](docs/01-tech-stack.md)
- [Database Schema](docs/02-database-schema.md)
- [Web Application Spec](docs/03-webapp-spec.md)
- [Integration Spec](docs/04-integration-spec.md)
- [Self-Review](docs/05-self-review.md)

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

MIT
