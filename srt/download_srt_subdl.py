#!/usr/bin/env python3
"""
Download SRT subtitle files for top 1000 sci-fi movies/TV series using Subdl API.

Subdl API: https://api.subdl.com/api/v1/subtitles
- Free API key with 2000 requests/day
- Search by IMDB ID, TMDB ID, or film name
- Downloads are ZIP files containing SRT files
- No download limit (only search rate limiting)
"""

import requests
import zipfile
import io
import csv
import os
import re
import time
import json
import sys
import unicodedata

# Configuration
API_KEY = "eau1xCS2IsI0gnb3snzmLHqHQLpfpyAD"
INPUT_FILE = '/home/user/workspace/top_1000_scifi.tsv'
OUTPUT_DIR = '/home/user/workspace/srt'
PROGRESS_FILE = '/home/user/workspace/download_progress_subdl.json'
API_BASE = 'https://api.subdl.com/api/v1/subtitles'
DL_BASE = 'https://dl.subdl.com'
SLEEP_BETWEEN_SEARCHES = 0.6  # ~1600 requests/day to stay under 2000 limit
SLEEP_BETWEEN_DOWNLOADS = 0.3

def sanitize_filename(name):
    """Create a safe filename from a title."""
    name = unicodedata.normalize('NFKD', name)
    name = name.encode('ascii', 'ignore').decode('ascii')
    name = re.sub(r'[^\w\s\-\.]', '', name)
    name = re.sub(r'\s+', '_', name.strip())
    name = name[:100]
    return name

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {'downloaded': {}, 'failed': {}, 'no_results': {}}

def save_progress(progress):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def search_subtitles(imdb_id, title_type='movie'):
    """Search for English subtitles by IMDB ID."""
    params = {
        'api_key': API_KEY,
        'imdb_id': imdb_id,
        'languages': 'EN',
        'subs_per_page': 30,
    }
    if title_type in ('tvSeries', 'tvMiniSeries'):
        params['type'] = 'tv'
    else:
        params['type'] = 'movie'
    
    try:
        resp = requests.get(API_BASE, params=params, timeout=30)
        if resp.status_code == 429:
            return None, "rate_limited"
        if resp.status_code != 200:
            return None, f"http_{resp.status_code}"
        
        data = resp.json()
        if data.get('status') and data.get('subtitles'):
            return data['subtitles'], None
        return None, "no_results"
    except Exception as e:
        return None, str(e)

def download_and_extract_srt(sub_url, output_path):
    """Download subtitle ZIP and extract the SRT file."""
    dl_url = f"{DL_BASE}{sub_url}"
    
    try:
        resp = requests.get(dl_url, timeout=60)
        if resp.status_code != 200:
            return False, f"download_http_{resp.status_code}"
        
        # Extract SRT from ZIP
        with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
            srt_files = [n for n in z.namelist() if n.lower().endswith('.srt')]
            
            if not srt_files:
                # Check for other subtitle formats
                all_files = z.namelist()
                return False, f"no_srt_in_zip: {all_files}"
            
            # If multiple SRTs, pick the largest one (most likely to be the full movie)
            if len(srt_files) > 1:
                srt_files.sort(key=lambda n: z.getinfo(n).file_size, reverse=True)
            
            srt_content = z.read(srt_files[0])
            
            # Try to decode
            for encoding in ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']:
                try:
                    text = srt_content.decode(encoding)
                    break
                except:
                    continue
            else:
                text = srt_content.decode('utf-8', errors='replace')
            
            # Validate it looks like an SRT
            if '-->' not in text:
                return False, "not_valid_srt"
            
            # Save
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(text)
            
            return True, f"{len(text)} chars"
    
    except zipfile.BadZipFile:
        return False, "bad_zip"
    except Exception as e:
        return False, str(e)

def pick_best_subtitle(subtitles):
    """Pick the best subtitle from the list - prefer non-HI, regular SRT."""
    # Score each subtitle
    scored = []
    for s in subtitles:
        score = 0
        name = (s.get('release_name') or '').lower()
        
        # Prefer non-hearing-impaired
        if not s.get('hi'):
            score += 10
        
        # Prefer BluRay/WEB-DL/REMUX releases (higher quality)
        if 'bluray' in name or 'blu-ray' in name:
            score += 5
        if 'web-dl' in name or 'webdl' in name:
            score += 4
        if 'remux' in name:
            score += 3
        if '1080p' in name:
            score += 2
        if '2160p' in name or '4k' in name:
            score += 2
        
        # Penalize cam/screener/line
        if any(x in name for x in ['cam', 'screener', 'hdscr', 'line', 'r6']):
            score -= 5
        
        scored.append((score, s))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1] if scored else subtitles[0]

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, 'movies'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, 'tv'), exist_ok=True)
    
    progress = load_progress()
    
    # Also merge in any existing downloads from the old progress file
    old_progress_file = '/home/user/workspace/download_progress.json'
    if os.path.exists(old_progress_file):
        with open(old_progress_file, 'r') as f:
            old_progress = json.load(f)
        for imdb_id, info in old_progress.get('downloaded', {}).items():
            if imdb_id not in progress['downloaded']:
                progress['downloaded'][imdb_id] = info
                progress['downloaded'][imdb_id]['source'] = 'opensubtitles_legacy'
    
    # Load the title list
    titles = []
    with open(INPUT_FILE, 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            titles.append(row)
    
    print(f"Loaded {len(titles)} titles")
    
    # Filter out already downloaded
    remaining = []
    for t in titles:
        imdb_id = t['imdb_id']
        if imdb_id in progress['downloaded']:
            continue
        remaining.append(t)
    
    print(f"Already downloaded: {len(progress['downloaded'])}")
    print(f"Remaining: {len(remaining)}")
    
    if not remaining:
        print("All titles already processed!")
        return
    
    downloaded_count = 0
    failed_count = 0
    no_results_count = 0
    rate_limited = False
    
    try:
        for idx, title in enumerate(remaining):
            imdb_id = title['imdb_id']
            title_name = title['title']
            title_type = title['type']
            year = title['year']
            
            # Skip if previously failed with no_results (won't change)
            # But retry other failures
            if imdb_id in progress.get('no_results', {}):
                continue
            
            print(f"[{idx+1}/{len(remaining)}] {title_name} ({year}) [{imdb_id}]", end=' ', flush=True)
            
            # Search
            subs, error = search_subtitles(imdb_id, title_type)
            time.sleep(SLEEP_BETWEEN_SEARCHES)
            
            if error == "rate_limited":
                print("-> RATE LIMITED, stopping")
                rate_limited = True
                break
            
            if error or not subs:
                # Retry with film_name search
                if error == "no_results":
                    params = {
                        'api_key': API_KEY,
                        'film_name': title_name,
                        'year': year,
                        'languages': 'EN',
                        'subs_per_page': 10,
                    }
                    try:
                        resp = requests.get(API_BASE, params=params, timeout=30)
                        data = resp.json()
                        if data.get('status') and data.get('subtitles'):
                            subs = data['subtitles']
                            error = None
                        time.sleep(SLEEP_BETWEEN_SEARCHES)
                    except:
                        pass
                
                if not subs:
                    print(f"-> No results ({error})")
                    progress['no_results'][imdb_id] = {'title': title_name, 'reason': error or 'no_results'}
                    save_progress(progress)
                    no_results_count += 1
                    continue
            
            # Pick best subtitle
            best = pick_best_subtitle(subs)
            sub_url = best.get('url')
            
            if not sub_url:
                print("-> No download URL")
                progress['failed'][imdb_id] = {'title': title_name, 'reason': 'no_url'}
                save_progress(progress)
                failed_count += 1
                continue
            
            # Create output path
            safe_name = sanitize_filename(title_name)
            if title_type in ('tvSeries', 'tvMiniSeries'):
                output_path = os.path.join(OUTPUT_DIR, 'tv', f"{safe_name}_{year}_{imdb_id}.srt")
            else:
                output_path = os.path.join(OUTPUT_DIR, 'movies', f"{safe_name}_{year}_{imdb_id}.srt")
            
            # Download
            ok, msg = download_and_extract_srt(sub_url, output_path)
            time.sleep(SLEEP_BETWEEN_DOWNLOADS)
            
            if ok:
                print(f"-> OK ({msg})")
                progress['downloaded'][imdb_id] = {
                    'title': title_name,
                    'file': output_path,
                    'release': best.get('release_name', ''),
                    'source': 'subdl',
                }
                downloaded_count += 1
            else:
                # Try next subtitle
                success = False
                for alt in subs[1:5]:
                    alt_url = alt.get('url')
                    if not alt_url:
                        continue
                    ok2, msg2 = download_and_extract_srt(alt_url, output_path)
                    time.sleep(SLEEP_BETWEEN_DOWNLOADS)
                    if ok2:
                        print(f"-> OK (alt: {msg2})")
                        progress['downloaded'][imdb_id] = {
                            'title': title_name,
                            'file': output_path,
                            'release': alt.get('release_name', ''),
                            'source': 'subdl',
                        }
                        downloaded_count += 1
                        success = True
                        break
                
                if not success:
                    print(f"-> FAILED ({msg})")
                    progress['failed'][imdb_id] = {'title': title_name, 'reason': msg}
                    failed_count += 1
            
            save_progress(progress)
            
            # Progress update every 50 items
            if (idx + 1) % 50 == 0:
                total_dl = len(progress['downloaded'])
                print(f"\n  --- Progress: {total_dl} downloaded, {failed_count} failed, {no_results_count} no results ---\n")
    
    except KeyboardInterrupt:
        print("\n\nInterrupted! Saving progress...")
    except Exception as e:
        print(f"\n\nError: {e}")
    finally:
        save_progress(progress)
    
    total_downloaded = len(progress['downloaded'])
    total_failed = len(progress['failed'])
    total_no_results = len(progress['no_results'])
    
    print(f"\n{'='*60}")
    print(f"Session: Downloaded {downloaded_count}, Failed {failed_count}, No results {no_results_count}")
    print(f"Overall: {total_downloaded} downloaded, {total_failed} failed, {total_no_results} no results")
    print(f"{'='*60}")
    
    if rate_limited:
        print("\nHit rate limit. Run again later to continue.")

if __name__ == '__main__':
    main()
