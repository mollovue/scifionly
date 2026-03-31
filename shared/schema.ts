import { sqliteTable, text, integer, real, primaryKey, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─────────────────────────────────────────────
// Core reference tables
// ─────────────────────────────────────────────

export const genres = sqliteTable("genres", {
  id: integer("id").primaryKey(), // TMDB genre ID used directly as PK
  name: text("name").notNull(),
});

export const people = sqliteTable("people", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tmdb_id: integer("tmdb_id").notNull().unique(),
  name: text("name").notNull(),
  profile_path: text("profile_path"),
  known_for_department: text("known_for_department"),
});

export const keywords = sqliteTable("keywords", {
  id: integer("id").primaryKey(), // TMDB keyword ID used directly as PK
  name: text("name").notNull(),
});

export const productionCompanies = sqliteTable("production_companies", {
  id: integer("id").primaryKey(), // TMDB company ID used directly as PK
  name: text("name").notNull(),
  logo_path: text("logo_path"),
  origin_country: text("origin_country"),
});

// ─────────────────────────────────────────────
// Main content tables
// ─────────────────────────────────────────────

export const movies = sqliteTable("movies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tmdb_id: integer("tmdb_id").notNull().unique(),
  title: text("title").notNull(),
  original_title: text("original_title"),
  overview: text("overview"),
  poster_path: text("poster_path"),
  backdrop_path: text("backdrop_path"),
  release_date: text("release_date"),
  status: text("status"),
  runtime: integer("runtime"),
  vote_average: real("vote_average"),
  vote_count: integer("vote_count"),
  popularity: real("popularity"),
  budget: integer("budget"),
  revenue: integer("revenue"),
  original_language: text("original_language"),
  spoken_languages: text("spoken_languages"), // JSON array
  tagline: text("tagline"),
  homepage: text("homepage"),
  imdb_id: text("imdb_id"),
  // Denormalized FTS helper columns
  cast_names: text("cast_names"),
  crew_names: text("crew_names"),
  keyword_names: text("keyword_names"),
  tmdb_updated_at: text("tmdb_updated_at"),
  created_at: text("created_at").default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const tvSeries = sqliteTable("tv_series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tmdb_id: integer("tmdb_id").notNull().unique(),
  name: text("name").notNull(),
  original_name: text("original_name"),
  overview: text("overview"),
  poster_path: text("poster_path"),
  backdrop_path: text("backdrop_path"),
  first_air_date: text("first_air_date"),
  last_air_date: text("last_air_date"),
  status: text("status"),
  number_of_seasons: integer("number_of_seasons"),
  number_of_episodes: integer("number_of_episodes"),
  episode_run_time: text("episode_run_time"), // JSON array
  vote_average: real("vote_average"),
  vote_count: integer("vote_count"),
  popularity: real("popularity"),
  original_language: text("original_language"),
  spoken_languages: text("spoken_languages"), // JSON array
  tagline: text("tagline"),
  homepage: text("homepage"),
  networks: text("networks"), // JSON array
  // Denormalized FTS helper columns
  cast_names: text("cast_names"),
  crew_names: text("crew_names"),
  keyword_names: text("keyword_names"),
  tmdb_updated_at: text("tmdb_updated_at"),
  created_at: text("created_at").default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// ─────────────────────────────────────────────
// Junction tables — movies
// ─────────────────────────────────────────────

export const movieGenres = sqliteTable(
  "movie_genres",
  {
    movie_id: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genre_id: integer("genre_id")
      .notNull()
      .references(() => genres.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.movie_id, t.genre_id] }),
  })
);

export const movieCast = sqliteTable(
  "movie_cast",
  {
    movie_id: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    person_id: integer("person_id")
      .notNull()
      .references(() => people.id),
    character: text("character"),
    display_order: integer("display_order"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.movie_id, t.person_id, t.character] }),
  })
);

export const movieCrew = sqliteTable(
  "movie_crew",
  {
    movie_id: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    person_id: integer("person_id")
      .notNull()
      .references(() => people.id),
    job: text("job"),
    department: text("department"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.movie_id, t.person_id, t.job] }),
  })
);

export const movieKeywords = sqliteTable(
  "movie_keywords",
  {
    movie_id: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    keyword_id: integer("keyword_id")
      .notNull()
      .references(() => keywords.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.movie_id, t.keyword_id] }),
  })
);

export const movieProductionCompanies = sqliteTable(
  "movie_production_companies",
  {
    movie_id: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    company_id: integer("company_id")
      .notNull()
      .references(() => productionCompanies.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.movie_id, t.company_id] }),
  })
);

// ─────────────────────────────────────────────
// Junction tables — TV series
// ─────────────────────────────────────────────

export const tvSeriesGenres = sqliteTable(
  "tv_series_genres",
  {
    tv_series_id: integer("tv_series_id")
      .notNull()
      .references(() => tvSeries.id, { onDelete: "cascade" }),
    genre_id: integer("genre_id")
      .notNull()
      .references(() => genres.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tv_series_id, t.genre_id] }),
  })
);

export const tvSeriesCast = sqliteTable(
  "tv_series_cast",
  {
    tv_series_id: integer("tv_series_id")
      .notNull()
      .references(() => tvSeries.id, { onDelete: "cascade" }),
    person_id: integer("person_id")
      .notNull()
      .references(() => people.id),
    character: text("character"),
    display_order: integer("display_order"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tv_series_id, t.person_id, t.character] }),
  })
);

export const tvSeriesCrew = sqliteTable(
  "tv_series_crew",
  {
    tv_series_id: integer("tv_series_id")
      .notNull()
      .references(() => tvSeries.id, { onDelete: "cascade" }),
    person_id: integer("person_id")
      .notNull()
      .references(() => people.id),
    job: text("job"),
    department: text("department"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tv_series_id, t.person_id, t.job] }),
  })
);

// ─────────────────────────────────────────────
// Sync state (singleton)
// ─────────────────────────────────────────────

export const syncState = sqliteTable("sync_state", {
  id: integer("id").primaryKey().default(1),
  last_sync_date: text("last_sync_date"),
  last_sync_type: text("last_sync_type"),
  total_movies: integer("total_movies").default(0),
  total_tv_series: integer("total_tv_series").default(0),
  last_change_date: text("last_change_date"),
  updated_at: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// ─────────────────────────────────────────────
// Image cache
// ─────────────────────────────────────────────

export const imageCache = sqliteTable("image_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  media_type: text("media_type").notNull(),
  media_id: integer("media_id").notNull(),
  image_type: text("image_type").notNull(),
  size: text("size").notNull(),
  tmdb_path: text("tmdb_path"),
  image_data: blob("image_data", { mode: "buffer" }).notNull(),
  content_type: text("content_type").notNull(),
  file_size: integer("file_size").notNull().default(0),
  fetched_at: text("fetched_at").default("CURRENT_TIMESTAMP"),
});

export type ImageCache = typeof imageCache.$inferSelect;

// ─────────────────────────────────────────────
// Insert schemas and types
// ─────────────────────────────────────────────

export const insertMovieSchema = createInsertSchema(movies).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof movies.$inferSelect;

export const insertTvSeriesSchema = createInsertSchema(tvSeries).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertTvSeries = z.infer<typeof insertTvSeriesSchema>;
export type TvSeries = typeof tvSeries.$inferSelect;

export const insertPersonSchema = createInsertSchema(people).omit({
  id: true,
});
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof people.$inferSelect;

export const insertGenreSchema = createInsertSchema(genres);
export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type Genre = typeof genres.$inferSelect;

export const insertKeywordSchema = createInsertSchema(keywords);
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywords.$inferSelect;

export const insertProductionCompanySchema = createInsertSchema(productionCompanies);
export type InsertProductionCompany = z.infer<typeof insertProductionCompanySchema>;
export type ProductionCompany = typeof productionCompanies.$inferSelect;

export const insertSyncStateSchema = createInsertSchema(syncState);
export type InsertSyncState = z.infer<typeof insertSyncStateSchema>;
export type SyncState = typeof syncState.$inferSelect;
