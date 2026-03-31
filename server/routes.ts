import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, type SearchParams } from "./storage";
import { makeImageKey, isInFlight, fetchAndCacheImage } from "./image-fetcher";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Search ───────────────────────────────────────────────────────────────

  app.get("/api/search", (req: Request, res: Response) => {
    try {
      const params: SearchParams = {
        query:      req.query.query     ? String(req.query.query)     : undefined,
        type:       req.query.type      ? (String(req.query.type) as "movie" | "tv" | "both") : "both",
        cast_id:    req.query.cast      ? parseInt(String(req.query.cast), 10) : undefined,
        crew_id:    req.query.crew      ? parseInt(String(req.query.crew), 10) : undefined,
        year_min:   req.query.year_min  ? parseInt(String(req.query.year_min), 10)  : undefined,
        year_max:   req.query.year_max  ? parseInt(String(req.query.year_max), 10)  : undefined,
        status:     req.query.status    ? String(req.query.status)    : undefined,
        language:   req.query.language  ? String(req.query.language)  : undefined,
        rating_min: req.query.rating_min ? parseFloat(String(req.query.rating_min)) : undefined,
        rating_max: req.query.rating_max ? parseFloat(String(req.query.rating_max)) : undefined,
        min_votes:  req.query.min_votes  ? parseInt(String(req.query.min_votes), 10)  : undefined,
        keyword_id: req.query.keyword   ? parseInt(String(req.query.keyword), 10)   : undefined,
        sort_by:    req.query.sort_by   ? (String(req.query.sort_by) as SearchParams["sort_by"])   : undefined,
        sort_order: req.query.sort_order ? (String(req.query.sort_order) as "asc" | "desc") : undefined,
        page:       req.query.page      ? parseInt(String(req.query.page), 10)      : 1,
        per_page:   req.query.per_page  ? parseInt(String(req.query.per_page), 10)  : 20,
      };

      // Validate type
      if (params.type && !["movie", "tv", "both"].includes(params.type)) {
        params.type = "both";
      }

      const result = storage.searchContent(params);
      res.json(result);
    } catch (err) {
      console.error("Search error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Movies — named routes BEFORE :id ─────────────────────────────────────

  app.get("/api/movies/trending", (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const results = storage.getTrending("movie", Math.min(limit, 100));
      res.json({ results });
    } catch (err) {
      console.error("Trending movies error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/movies/top-rated", (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const results = storage.getTopRated("movie", Math.min(limit, 100));
      res.json({ results });
    } catch (err) {
      console.error("Top-rated movies error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/movies/recent", (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const results = storage.getRecent("movie", Math.min(limit, 100));
      res.json({ results });
    } catch (err) {
      console.error("Recent movies error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/movies/upcoming", (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const results = storage.getUpcoming("movie", Math.min(limit, 100));
      res.json({ results });
    } catch (err) {
      console.error("Upcoming movies error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Movies — detail by ID ─────────────────────────────────────────────────

  app.get("/api/movies/:id", (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid movie ID" });
      }
      const movie = storage.getMovieById(id);
      if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
      }
      res.json(movie);
    } catch (err) {
      console.error("Movie detail error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── TV Series — named routes BEFORE :id ──────────────────────────────────

  app.get("/api/tv/trending", (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const results = storage.getTrending("tv", Math.min(limit, 100));
      res.json({ results });
    } catch (err) {
      console.error("Trending TV error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/tv/top-rated", (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const results = storage.getTopRated("tv", Math.min(limit, 100));
      res.json({ results });
    } catch (err) {
      console.error("Top-rated TV error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── TV Series — detail by ID ──────────────────────────────────────────────

  app.get("/api/tv/:id", (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid TV series ID" });
      }
      const series = storage.getTvSeriesById(id);
      if (!series) {
        return res.status(404).json({ error: "TV series not found" });
      }
      res.json(series);
    } catch (err) {
      console.error("TV series detail error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── People ───────────────────────────────────────────────────────────────

  app.get("/api/people/:id", (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid person ID" });
      }
      const person = storage.getPersonById(id);
      if (!person) {
        return res.status(404).json({ error: "Person not found" });
      }
      res.json(person);
    } catch (err) {
      console.error("Person detail error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Autocomplete ─────────────────────────────────────────────────────────

  app.get("/api/autocomplete/people", (req: Request, res: Response) => {
    try {
      const q = req.query.q ? String(req.query.q).trim() : "";
      if (!q) {
        return res.json({ results: [] });
      }
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const results = storage.autocompletePeople(q, Math.min(limit, 50));
      res.json({ results });
    } catch (err) {
      console.error("Autocomplete people error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/autocomplete/keywords", (req: Request, res: Response) => {
    try {
      const q = req.query.q ? String(req.query.q).trim() : "";
      if (!q) {
        return res.json({ results: [] });
      }
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const results = storage.autocompleteKeywords(q, Math.min(limit, 50));
      res.json({ results });
    } catch (err) {
      console.error("Autocomplete keywords error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Image cache ──────────────────────────────────────────────────────────

  app.get("/api/images/:mediaType/:id/:imageType", (req: Request, res: Response) => {
    try {
      const { mediaType, id: idStr, imageType } = req.params;

      if (mediaType !== "movie" && mediaType !== "tv") {
        return res.status(400).json({ error: "Invalid mediaType (must be 'movie' or 'tv')" });
      }
      if (imageType !== "poster" && imageType !== "backdrop") {
        return res.status(400).json({ error: "Invalid imageType (must be 'poster' or 'backdrop')" });
      }

      const id = parseInt(idStr, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const size = req.query.size
        ? String(req.query.size)
        : imageType === "poster"
          ? "w342"
          : "w780";

      // Check cache
      const cached = storage.getCachedImage(mediaType, id, imageType, size);
      if (cached) {
        res.set("Content-Type", cached.content_type);
        res.set("Cache-Control", "public, max-age=86400");
        res.set("Content-Length", String(cached.image_data.length));
        return res.status(200).send(cached.image_data);
      }

      // Cache miss — look up TMDB path
      const tmdbPath = storage.getTmdbImagePath(mediaType, id, imageType);
      if (!tmdbPath) {
        return res.status(404).json({ error: "No image path available" });
      }

      // Trigger async fetch if not already in-flight
      const key = makeImageKey(mediaType, id, imageType, size);
      if (!isInFlight(key)) {
        fetchAndCacheImage(key, tmdbPath, size, (data, contentType) => {
          storage.cacheImage(mediaType, id, imageType, size, tmdbPath, data, contentType, data.length);
        });
      }

      return res.status(202).json({ status: "fetching" });
    } catch (err) {
      console.error("Image cache error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Stats ────────────────────────────────────────────────────────────────

  app.get("/api/stats", (_req: Request, res: Response) => {
    try {
      const stats = storage.getStats();
      res.json(stats);
    } catch (err) {
      console.error("Stats error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
