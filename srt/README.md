# Sci-Fi Movie & TV Series Subtitles (SRT)

English subtitle files (.srt) for top sci-fi movies and TV series, ranked by IMDB popularity (number of votes).

## Structure

```
srt/
├── movies/          # Movie subtitle files
│   └── {Title}_{Year}_{IMDB_ID}.srt
├── tv/              # TV series subtitle files (pilot/first episode)
│   └── {Title}_{Year}_{IMDB_ID}.srt
├── top_1000_scifi.tsv  # Full list of top 1000 sci-fi titles from IMDB
├── download_srt_subdl.py  # Download script using Subdl API
└── README.md        # This file
```

## Sources

### Primary: Subdl API (https://subdl.com)
- Free REST API with IMDB/TMDB ID search
- Returns ZIP files containing SRT subtitles
- API endpoint: `https://api.subdl.com/api/v1/subtitles`
- Rate limit: ~2000 requests/day per API key
- Free API key available at: https://subdl.com/panel/api

### Secondary: OpenSubtitles.org XMLRPC API
- Legacy API at `https://api.opensubtitles.org/xml-rpc`
- Search works without authentication
- Downloads limited (VIP-only for most files as of 2026)
- User agent: `opensubtitles-download 5.0`

### Other Free Sources Researched
| Source | API | Auth Required | Notes |
|--------|-----|---------------|-------|
| OpenSubtitles.com | REST API | Yes (free account = 20 dl/day) | `api.opensubtitles.com/api/v1` |
| Subdl | REST API | Yes (free API key) | Best for bulk downloads |
| Wyzie Subs | REST API | Yes (free key) | `sub.wyzie.io`, uses TMDB/IMDB IDs |
| YIFY Subtitles | No API | No | Behind Cloudflare, movies only |
| Podnapisi | No public API | No | 2M+ subtitles, SRT format |
| OpenSubtitles.org | XMLRPC | No (limited) | Legacy, being shut down |

## Title Selection

Top 1000 sci-fi titles selected from IMDB datasets:
- Source: `https://datasets.imdbws.com/` (title.basics.tsv.gz + title.ratings.tsv.gz)
- Filter: Genre contains "Sci-Fi", type is movie/tvSeries/tvMiniSeries
- Minimum 1000 votes on IMDB
- Sorted by number of votes (popularity proxy)
- Result: 852 movies + 148 TV series

## Running the Download Script

```bash
# Install dependencies
pip install requests

# Set your Subdl API key
export SUBDL_API_KEY="your_api_key_here"

# Run download
python3 download_srt_subdl.py
```

The script supports resumable downloads via a progress file.
