/**
 * Demo data seeder.
 * Populates the database with realistic sci-fi movies and TV series
 * so the app works without a live TMDB API key.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *   npx tsx scripts/seed-demo.ts --clear   # clear existing data first
 */

import sqlite from "./db.js";

const clearFirst = process.argv.includes("--clear");

// ─────────────────────────────────────────────
// Reference data
// ─────────────────────────────────────────────

const GENRES = [
  { id: 878, name: "Science Fiction" },
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 18, name: "Drama" },
  { id: 53, name: "Thriller" },
  { id: 27, name: "Horror" },
  { id: 35, name: "Comedy" },
  { id: 9648, name: "Mystery" },
  { id: 10765, name: "Sci-Fi & Fantasy" }, // TV genre
  { id: 10759, name: "Action & Adventure" }, // TV genre
  { id: 18, name: "Drama" },
];

const KEYWORDS = [
  { id: 1, name: "dystopia" },
  { id: 2, name: "space" },
  { id: 3, name: "alien" },
  { id: 4, name: "time travel" },
  { id: 5, name: "robot" },
  { id: 6, name: "artificial intelligence" },
  { id: 7, name: "post-apocalyptic" },
  { id: 8, name: "cyberpunk" },
  { id: 9, name: "virtual reality" },
  { id: 10, name: "space exploration" },
  { id: 11, name: "genetic engineering" },
  { id: 12, name: "parallel universe" },
  { id: 13, name: "mind control" },
  { id: 14, name: "surveillance" },
  { id: 15, name: "androids" },
  { id: 16, name: "interstellar travel" },
  { id: 17, name: "wormhole" },
  { id: 18, name: "mars" },
  { id: 19, name: "asteroid" },
  { id: 20, name: "nanotechnology" },
  { id: 21, name: "cloning" },
  { id: 22, name: "teleportation" },
  { id: 23, name: "superhuman" },
  { id: 24, name: "invasion" },
  { id: 25, name: "survival" },
  { id: 26, name: "consciousness" },
  { id: 27, name: "simulation" },
  { id: 28, name: "mutation" },
  { id: 29, name: "galactic empire" },
  { id: 30, name: "rebellion" },
  { id: 31, name: "memory" },
  { id: 32, name: "future society" },
];

const PRODUCTION_COMPANIES = [
  { id: 1, name: "Warner Bros. Pictures", logo_path: null, origin_country: "US" },
  { id: 2, name: "Universal Pictures", logo_path: null, origin_country: "US" },
  { id: 3, name: "Paramount Pictures", logo_path: null, origin_country: "US" },
  { id: 4, name: "Columbia Pictures", logo_path: null, origin_country: "US" },
  { id: 5, name: "20th Century Studios", logo_path: null, origin_country: "US" },
  { id: 6, name: "Walt Disney Pictures", logo_path: null, origin_country: "US" },
  { id: 7, name: "Legendary Entertainment", logo_path: null, origin_country: "US" },
  { id: 8, name: "Syncopy", logo_path: null, origin_country: "GB" },
  { id: 9, name: "Alcon Entertainment", logo_path: null, origin_country: "US" },
  { id: 10, name: "Scott Free Productions", logo_path: null, origin_country: "GB" },
  { id: 11, name: "DNA Films", logo_path: null, origin_country: "GB" },
  { id: 12, name: "Amblin Entertainment", logo_path: null, origin_country: "US" },
  { id: 13, name: "Bad Robot Productions", logo_path: null, origin_country: "US" },
  { id: 14, name: "A24", logo_path: null, origin_country: "US" },
  { id: 15, name: "Netflix", logo_path: null, origin_country: "US" },
  { id: 16, name: "Amazon Studios", logo_path: null, origin_country: "US" },
  { id: 17, name: "Apple TV+", logo_path: null, origin_country: "US" },
  { id: 18, name: "HBO", logo_path: null, origin_country: "US" },
];

// ─────────────────────────────────────────────
// Known sci-fi films with realistic data
// ─────────────────────────────────────────────

interface MovieData {
  tmdb_id: number;
  title: string;
  original_title?: string;
  overview: string;
  release_date: string;
  status: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  popularity: number;
  budget: number;
  revenue: number;
  original_language: string;
  tagline: string;
  imdb_id?: string;
  genre_ids: number[];
  cast: string[];
  director: string;
  keyword_ids: number[];
  company_ids: number[];
}

interface TvData {
  tmdb_id: number;
  name: string;
  original_name?: string;
  overview: string;
  first_air_date: string;
  last_air_date?: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  networks: string[];
  tagline: string;
  genre_ids: number[];
  cast: string[];
  creator: string;
  keyword_ids: number[];
}

const KNOWN_MOVIES: MovieData[] = [
  {
    tmdb_id: 1000,
    title: "Blade Runner 2049",
    overview: "Thirty years after the events of Blade Runner, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for 30 years.",
    release_date: "2017-10-06",
    status: "Released",
    runtime: 164,
    vote_average: 7.9,
    vote_count: 12841,
    popularity: 48.5,
    budget: 150000000,
    revenue: 259239658,
    original_language: "en",
    tagline: "The key to the future is finally unearthed.",
    imdb_id: "tt1856101",
    genre_ids: [878, 18, 53],
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Sylvia Hoeks", "Robin Wright"],
    director: "Denis Villeneuve",
    keyword_ids: [1, 8, 15, 14, 26],
    company_ids: [9, 1],
  },
  {
    tmdb_id: 1001,
    title: "Dune",
    original_title: "Dune: Part One",
    overview: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.",
    release_date: "2021-10-22",
    status: "Released",
    runtime: 155,
    vote_average: 7.8,
    vote_count: 10956,
    popularity: 156.3,
    budget: 165000000,
    revenue: 401779560,
    original_language: "en",
    tagline: "Beyond fear, destiny awaits.",
    imdb_id: "tt1160419",
    genre_ids: [878, 12, 18],
    cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac", "Zendaya", "Josh Brolin"],
    director: "Denis Villeneuve",
    keyword_ids: [2, 29, 30, 25, 32],
    company_ids: [1, 7],
  },
  {
    tmdb_id: 1002,
    title: "Interstellar",
    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. With time running out for life on Earth, former NASA pilot Cooper leads a crew of astronauts through a wormhole that could lead to a new home for humanity.",
    release_date: "2014-11-07",
    status: "Released",
    runtime: 169,
    vote_average: 8.4,
    vote_count: 32154,
    popularity: 89.7,
    budget: 165000000,
    revenue: 701795482,
    original_language: "en",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    imdb_id: "tt0816692",
    genre_ids: [878, 18, 12],
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine", "Matt Damon"],
    director: "Christopher Nolan",
    keyword_ids: [16, 17, 4, 2, 10],
    company_ids: [8, 7],
  },
  {
    tmdb_id: 1003,
    title: "The Matrix",
    overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.",
    release_date: "1999-03-31",
    status: "Released",
    runtime: 136,
    vote_average: 8.2,
    vote_count: 24583,
    popularity: 72.4,
    budget: 63000000,
    revenue: 467222728,
    original_language: "en",
    tagline: "Welcome to the Real World.",
    imdb_id: "tt0133093",
    genre_ids: [878, 28, 12],
    cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss", "Hugo Weaving", "Joe Pantoliano"],
    director: "The Wachowskis",
    keyword_ids: [6, 9, 5, 8, 27],
    company_ids: [1],
  },
  {
    tmdb_id: 1004,
    title: "Alien",
    overview: "During its return to the earth, commercial spaceship Nostromo intercepts a distress signal from a distant planet. When a three-member team goes to investigate, they find a deadly lifeform that sets off a terrifying chain of events.",
    release_date: "1979-05-25",
    status: "Released",
    runtime: 117,
    vote_average: 8.1,
    vote_count: 14237,
    popularity: 45.2,
    budget: 11000000,
    revenue: 185370032,
    original_language: "en",
    tagline: "In space no one can hear you scream.",
    imdb_id: "tt0078748",
    genre_ids: [878, 27, 53],
    cast: ["Sigourney Weaver", "Tom Skerritt", "John Hurt", "Ian Holm", "Harry Dean Stanton"],
    director: "Ridley Scott",
    keyword_ids: [3, 2, 25, 15],
    company_ids: [5],
  },
  {
    tmdb_id: 1005,
    title: "Arrival",
    overview: "Taking place after mysterious spacecraft touch down across the globe, an elite team is put together to investigate, including language expert Louise Banks who has to race against time to find a way to communicate with the alien visitors before a clueless world is thrust into a global war.",
    release_date: "2016-11-11",
    status: "Released",
    runtime: 116,
    vote_average: 7.9,
    vote_count: 16892,
    popularity: 52.1,
    budget: 47000000,
    revenue: 203388186,
    original_language: "en",
    tagline: "Why are they here?",
    imdb_id: "tt2543164",
    genre_ids: [878, 18, 9648],
    cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker", "Michael Stuhlbarg", "Mark O'Brien"],
    director: "Denis Villeneuve",
    keyword_ids: [3, 4, 24, 26, 31],
    company_ids: [13],
  },
  {
    tmdb_id: 1006,
    title: "Ex Machina",
    overview: "A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence by evaluating the human qualities of a breathtaking female A.I. The experience creates a philosophical and moral crisis for the programmer.",
    release_date: "2015-01-21",
    status: "Released",
    runtime: 108,
    vote_average: 7.7,
    vote_count: 15432,
    popularity: 39.8,
    budget: 15000000,
    revenue: 36869414,
    original_language: "en",
    tagline: "What happens to me if I fail your test?",
    imdb_id: "tt0470752",
    genre_ids: [878, 18, 53],
    cast: ["Domhnall Gleeson", "Oscar Isaac", "Alicia Vikander", "Sonoya Mizuno"],
    director: "Alex Garland",
    keyword_ids: [6, 5, 15, 26, 21],
    company_ids: [11],
  },
  {
    tmdb_id: 1007,
    title: "Inception",
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: inception, the implantation of another person's idea into a target's subconscious.",
    release_date: "2010-07-16",
    status: "Released",
    runtime: 148,
    vote_average: 8.4,
    vote_count: 35197,
    popularity: 96.4,
    budget: 160000000,
    revenue: 836836967,
    original_language: "en",
    tagline: "Your mind is the scene of the crime.",
    imdb_id: "tt1375666",
    genre_ids: [878, 28, 12],
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy", "Ken Watanabe"],
    director: "Christopher Nolan",
    keyword_ids: [9, 13, 27, 12, 26],
    company_ids: [8, 1],
  },
  {
    tmdb_id: 1008,
    title: "The Martian",
    overview: "During a manned mission to Mars, astronaut Mark Watney is presumed dead after a fierce storm and left behind by his crew. With only meager supplies, he must utilize his ingenuity, wit and spirit to subsist and find a way to signal to Earth that he is alive.",
    release_date: "2015-10-02",
    status: "Released",
    runtime: 144,
    vote_average: 7.7,
    vote_count: 20147,
    popularity: 58.3,
    budget: 108000000,
    revenue: 630161890,
    original_language: "en",
    tagline: "Help is only 140 million miles away.",
    imdb_id: "tt3659388",
    genre_ids: [878, 12, 18],
    cast: ["Matt Damon", "Jessica Chastain", "Kristen Wiig", "Jeff Daniels", "Michael Peña"],
    director: "Ridley Scott",
    keyword_ids: [18, 10, 2, 25],
    company_ids: [5, 10],
  },
  {
    tmdb_id: 1009,
    title: "2001: A Space Odyssey",
    overview: "Humanity finds a mysterious object buried beneath the lunar surface and sets off to find its origins with the help of HAL 9000, the world's most advanced super computer. A journey through space that awakens mankind's deepest aspirations and greatest fears.",
    release_date: "1968-04-06",
    status: "Released",
    runtime: 149,
    vote_average: 8.1,
    vote_count: 11823,
    popularity: 35.6,
    budget: 10500000,
    revenue: 68732864,
    original_language: "en",
    tagline: "The ultimate trip.",
    imdb_id: "tt0062622",
    genre_ids: [878, 12],
    cast: ["Keir Dullea", "Gary Lockwood", "William Sylvester", "Douglas Rain"],
    director: "Stanley Kubrick",
    keyword_ids: [6, 2, 10, 16, 26],
    company_ids: [1],
  },
  {
    tmdb_id: 1010,
    title: "Star Wars",
    original_title: "Star Wars: Episode IV – A New Hope",
    overview: "Luke Skywalker joins forces with a Jedi Knight, a cocky pilot, a Wookiee and two droids to save the galaxy from the Empire's world-destroying battle station, while also attempting to rescue Princess Leia from the mysterious Darth Vader.",
    release_date: "1977-05-25",
    status: "Released",
    runtime: 121,
    vote_average: 8.2,
    vote_count: 19876,
    popularity: 92.7,
    budget: 11000000,
    revenue: 775398007,
    original_language: "en",
    tagline: "A long time ago in a galaxy far, far away....",
    imdb_id: "tt0076759",
    genre_ids: [878, 12, 28],
    cast: ["Mark Hamill", "Harrison Ford", "Carrie Fisher", "Alec Guinness", "Peter Cushing"],
    director: "George Lucas",
    keyword_ids: [29, 30, 5, 2, 3],
    company_ids: [5],
  },
  {
    tmdb_id: 1011,
    title: "Terminator 2: Judgment Day",
    overview: "In 1995, John Connor, the key figure in the future resistance to the machine uprising, is a young boy. The machines send back a second Terminator to kill John. However, a more advanced Terminator has also been sent back to protect him.",
    release_date: "1991-07-03",
    status: "Released",
    runtime: 137,
    vote_average: 8.1,
    vote_count: 17234,
    popularity: 67.4,
    budget: 102000000,
    revenue: 519843567,
    original_language: "en",
    tagline: "It's nothing personal.",
    imdb_id: "tt0103064",
    genre_ids: [878, 28, 12],
    cast: ["Arnold Schwarzenegger", "Linda Hamilton", "Edward Furlong", "Robert Patrick"],
    director: "James Cameron",
    keyword_ids: [5, 4, 7, 6, 25],
    company_ids: [3],
  },
  {
    tmdb_id: 1012,
    title: "Jurassic Park",
    overview: "A pragmatic paleontologist visiting an almost complete theme park is tasked with protecting a couple of kids after a power failure causes the park's cloned dinosaurs to run loose.",
    release_date: "1993-06-11",
    status: "Released",
    runtime: 127,
    vote_average: 7.9,
    vote_count: 16432,
    popularity: 78.5,
    budget: 63000000,
    revenue: 1046202292,
    original_language: "en",
    tagline: "An adventure 65 million years in the making.",
    imdb_id: "tt0107290",
    genre_ids: [878, 12, 28],
    cast: ["Sam Neill", "Laura Dern", "Jeff Goldblum", "Richard Attenborough", "Samuel L. Jackson"],
    director: "Steven Spielberg",
    keyword_ids: [11, 21, 25, 28],
    company_ids: [2, 12],
  },
  {
    tmdb_id: 1013,
    title: "Avatar",
    overview: "In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission, but becomes torn between following orders and protecting an alien civilization.",
    release_date: "2009-12-18",
    status: "Released",
    runtime: 162,
    vote_average: 7.5,
    vote_count: 29107,
    popularity: 185.3,
    budget: 237000000,
    revenue: 2923706026,
    original_language: "en",
    tagline: "Enter the world of Pandora.",
    imdb_id: "tt0499549",
    genre_ids: [878, 28, 12],
    cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Stephen Lang", "Michelle Rodriguez"],
    director: "James Cameron",
    keyword_ids: [3, 24, 2, 23, 30],
    company_ids: [5, 7],
  },
  {
    tmdb_id: 1014,
    title: "E.T. the Extra-Terrestrial",
    overview: "A troubled child summons the courage to help a friendly alien escape Earth and return to his home world. During the journey, Elliott and the alien form a deep friendship.",
    release_date: "1982-06-11",
    status: "Released",
    runtime: 115,
    vote_average: 7.9,
    vote_count: 13254,
    popularity: 42.8,
    budget: 10500000,
    revenue: 792910554,
    original_language: "en",
    tagline: "He is afraid. He is alone. He is three million light years from home.",
    imdb_id: "tt0083866",
    genre_ids: [878, 12, 35],
    cast: ["Henry Thomas", "Drew Barrymore", "Peter Coyote", "Dee Wallace", "Robert MacNaughton"],
    director: "Steven Spielberg",
    keyword_ids: [3, 2, 25, 24],
    company_ids: [2, 12],
  },
  {
    tmdb_id: 1015,
    title: "WALL-E",
    overview: "WALL-E is the last robot left on an abandoned, trash-covered Earth. When he falls in love with EVE, a sleek robot sent back to Earth on a scanning mission, he follows her across the galaxy on an epic adventure.",
    release_date: "2008-06-27",
    status: "Released",
    runtime: 98,
    vote_average: 8.1,
    vote_count: 17592,
    popularity: 55.7,
    budget: 180000000,
    revenue: 533345069,
    original_language: "en",
    tagline: "An adventure beyond the ordinary.",
    imdb_id: "tt0910970",
    genre_ids: [878, 12, 35],
    cast: ["Ben Burtt", "Elissa Knight", "Jeff Garlin", "Fred Willard", "Sigourney Weaver"],
    director: "Andrew Stanton",
    keyword_ids: [5, 7, 2, 6, 1],
    company_ids: [6],
  },
  {
    tmdb_id: 1016,
    title: "Back to the Future",
    overview: "In 1985, Doc Brown invents time travel; in 1955, Marty McFly accidentally prevents his parents from meeting — and must cause them to meet to make his own existence possible.",
    release_date: "1985-07-03",
    status: "Released",
    runtime: 116,
    vote_average: 8.3,
    vote_count: 18743,
    popularity: 71.4,
    budget: 19000000,
    revenue: 381109762,
    original_language: "en",
    tagline: "He's the only kid ever to get into trouble before he was born.",
    imdb_id: "tt0088763",
    genre_ids: [878, 12, 35],
    cast: ["Michael J. Fox", "Christopher Lloyd", "Lea Thompson", "Crispin Glover", "Thomas F. Wilson"],
    director: "Robert Zemeckis",
    keyword_ids: [4, 12, 31],
    company_ids: [2],
  },
  {
    tmdb_id: 1017,
    title: "Gravity",
    overview: "Dr. Ryan Stone, a brilliant medical engineer on her first Shuttle mission, is working alongside veteran astronaut Matt Kowalsky when disaster strikes — the shuttle is destroyed, leaving them completely alone in the vast blackness of space.",
    release_date: "2013-10-04",
    status: "Released",
    runtime: 91,
    vote_average: 7.7,
    vote_count: 16289,
    popularity: 45.9,
    budget: 100000000,
    revenue: 716392705,
    original_language: "en",
    tagline: "Don't let go.",
    imdb_id: "tt1454468",
    genre_ids: [878, 18, 53],
    cast: ["Sandra Bullock", "George Clooney", "Ed Harris"],
    director: "Alfonso Cuarón",
    keyword_ids: [2, 10, 25],
    company_ids: [1],
  },
  {
    tmdb_id: 1018,
    title: "Mad Max: Fury Road",
    overview: "An apocalyptic story set in the furthest reaches of our planet, in a stark desert landscape where humanity is broken, and most everyone is crazed fighting for the necessities of life.",
    release_date: "2015-05-15",
    status: "Released",
    runtime: 120,
    vote_average: 7.8,
    vote_count: 21456,
    popularity: 62.8,
    budget: 185000000,
    revenue: 375436354,
    original_language: "en",
    tagline: "What a lovely day.",
    imdb_id: "tt1392190",
    genre_ids: [878, 28, 12],
    cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult", "Hugh Keays-Byrne", "Rosie Huntington-Whiteley"],
    director: "George Miller",
    keyword_ids: [7, 1, 25, 30],
    company_ids: [1],
  },
  {
    tmdb_id: 1019,
    title: "District 9",
    overview: "Aliens land on Earth and, to the surprise of everyone, do not come in peace. Confined to a slum-like area called District 9, they face government agencies, gangsters, and a corporate firm seeking to harness their advanced weaponry.",
    release_date: "2009-08-14",
    status: "Released",
    runtime: 112,
    vote_average: 7.9,
    vote_count: 15782,
    popularity: 44.3,
    budget: 30000000,
    revenue: 210819611,
    original_language: "en",
    tagline: "You are not welcome here.",
    imdb_id: "tt1136608",
    genre_ids: [878, 28, 53],
    cast: ["Sharlto Copley", "Jason Cope", "David James", "Vanessa Haywood"],
    director: "Neill Blomkamp",
    keyword_ids: [3, 24, 1, 14, 30],
    company_ids: [4],
  },
  {
    tmdb_id: 1020,
    title: "Edge of Tomorrow",
    overview: "An officer finds himself caught in a time loop in a war with an alien race. His mission is to defeat them in a single day. He must live, die, and repeat until he learns to fight back.",
    release_date: "2014-06-06",
    status: "Released",
    runtime: 113,
    vote_average: 7.6,
    vote_count: 18234,
    popularity: 55.1,
    budget: 178000000,
    revenue: 370541256,
    original_language: "en",
    tagline: "Live. Die. Repeat.",
    imdb_id: "tt1631867",
    genre_ids: [878, 28, 12],
    cast: ["Tom Cruise", "Emily Blunt", "Bill Paxton", "Brendan Gleeson"],
    director: "Doug Liman",
    keyword_ids: [3, 4, 24, 25],
    company_ids: [1],
  },
  {
    tmdb_id: 1021,
    title: "Pacific Rim",
    overview: "As a war between humankind and monstrous sea creatures wages on, a former pilot and a trainee are paired up to drive a seemingly obsolete special weapon in a desperate effort to save the world.",
    release_date: "2013-07-12",
    status: "Released",
    runtime: 131,
    vote_average: 6.9,
    vote_count: 12543,
    popularity: 38.7,
    budget: 190000000,
    revenue: 411002798,
    original_language: "en",
    tagline: "To fight monsters, we created monsters.",
    imdb_id: "tt1663662",
    genre_ids: [878, 28, 12],
    cast: ["Charlie Hunnam", "Idris Elba", "Rinko Kikuchi", "Charlie Day", "Ron Perlman"],
    director: "Guillermo del Toro",
    keyword_ids: [3, 24, 5, 25, 30],
    company_ids: [1, 7],
  },
  {
    tmdb_id: 1022,
    title: "Tenet",
    overview: "Armed with only one word — Tenet — and fighting for the survival of the entire world, a Protagonist journeys through a twilight world of international espionage on a mission that will unfold in something beyond real time.",
    release_date: "2020-08-26",
    status: "Released",
    runtime: 150,
    vote_average: 7.3,
    vote_count: 14678,
    popularity: 41.9,
    budget: 200000000,
    revenue: 363700764,
    original_language: "en",
    tagline: "Time runs out.",
    imdb_id: "tt6723592",
    genre_ids: [878, 28, 12],
    cast: ["John David Washington", "Robert Pattinson", "Elizabeth Debicki", "Kenneth Branagh", "Dimple Kapadia"],
    director: "Christopher Nolan",
    keyword_ids: [4, 12, 22, 2],
    company_ids: [8, 1],
  },
  {
    tmdb_id: 1023,
    title: "Annihilation",
    overview: "A biologist signs up for a dangerous, secret expedition where the laws of nature don't apply. Her team explores a mysterious quarantined zone — Area X — where they encounter altered wildlife, an abandoned lighthouse, and psychological terrors.",
    release_date: "2018-02-23",
    status: "Released",
    runtime: 115,
    vote_average: 7.5,
    vote_count: 11234,
    popularity: 36.2,
    budget: 40000000,
    revenue: 43078754,
    original_language: "en",
    tagline: "Fear what's inside.",
    imdb_id: "tt2798920",
    genre_ids: [878, 27, 18],
    cast: ["Natalie Portman", "Jennifer Jason Leigh", "Gina Rodriguez", "Tessa Thompson", "Oscar Isaac"],
    director: "Alex Garland",
    keyword_ids: [3, 11, 28, 26, 25],
    company_ids: [3, 14],
  },
  {
    tmdb_id: 1024,
    title: "Under the Skin",
    overview: "An alien, in the guise of a beautiful woman, travels through Scotland, luring men to their doom. As she drives through cities and countrysides, she begins to feel the pull of human emotion.",
    release_date: "2014-04-04",
    status: "Released",
    runtime: 108,
    vote_average: 6.3,
    vote_count: 7894,
    popularity: 22.1,
    budget: 13300000,
    revenue: 7486000,
    original_language: "en",
    tagline: "",
    imdb_id: "tt1441395",
    genre_ids: [878, 27, 18],
    cast: ["Scarlett Johansson", "Jeremy McWilliams", "Lynsey Taylor Mackay"],
    director: "Jonathan Glazer",
    keyword_ids: [3, 26, 24],
    company_ids: [11],
  },
];

// 75 more generated sci-fi movies
const GENERATED_MOVIES: MovieData[] = [
  { tmdb_id: 1025, title: "Elysium", overview: "In 2154, the very wealthy live on a perfect man-made space station called Elysium, while the rest of the population resides on a ruined Earth. A man takes on a dangerous mission that could bring equality to the polarized worlds.", release_date: "2013-08-09", status: "Released", runtime: 109, vote_average: 6.6, vote_count: 9823, popularity: 32.4, budget: 115000000, revenue: 286137505, original_language: "en", tagline: "He has to break out. They have to keep him in.", genre_ids: [878, 28, 18], cast: ["Matt Damon", "Jodie Foster", "Sharlto Copley", "Alice Braga"], director: "Neill Blomkamp", keyword_ids: [1, 2, 14, 30, 23], company_ids: [4] },
  { tmdb_id: 1026, title: "Contact", overview: "Dr. Ellie Arroway, after years of searching, finds conclusive radio proof of intelligent aliens, who send plans for a mysterious machine. A scientist's journey to meet the builders of the cosmos.", release_date: "1997-07-11", status: "Released", runtime: 150, vote_average: 7.5, vote_count: 10234, popularity: 28.9, budget: 90000000, revenue: 171119271, original_language: "en", tagline: "If it's just us, it seems like an awful waste of space.", genre_ids: [878, 18, 9648], cast: ["Jodie Foster", "Matthew McConaughey", "James Woods", "John Hurt"], director: "Robert Zemeckis", keyword_ids: [3, 10, 2, 26, 16], company_ids: [1] },
  { tmdb_id: 1027, title: "The Day the Earth Stood Still", overview: "An alien lands and tells the people of Earth that they must live peacefully or be destroyed as a danger to other planets. A government agent is called upon to deal with the crisis.", release_date: "1951-11-18", status: "Released", runtime: 92, vote_average: 7.6, vote_count: 4521, popularity: 18.3, budget: 996000, revenue: 1900000, original_language: "en", tagline: "From out of space… A warning and an ultimatum!", genre_ids: [878, 18], cast: ["Michael Rennie", "Patricia Neal", "Hugh Marlowe", "Sam Jaffe"], director: "Robert Wise", keyword_ids: [3, 24, 32], company_ids: [5] },
  { tmdb_id: 1028, title: "Moon", overview: "Astronaut Sam Bell has a quintessentially personal encounter toward the end of his three-year stint on the Moon, where he has been working alone, and is due to return home.", release_date: "2009-07-17", status: "Released", runtime: 97, vote_average: 7.9, vote_count: 8934, popularity: 25.7, budget: 5000000, revenue: 9733882, original_language: "en", tagline: "The last place you'd ever expect to find yourself.", genre_ids: [878, 18, 9648], cast: ["Sam Rockwell", "Kevin Spacey", "Dominique McElligott", "Kaya Scodelario"], director: "Duncan Jones", keyword_ids: [6, 2, 21, 26, 31], company_ids: [11] },
  { tmdb_id: 1029, title: "Solaris", overview: "A psychologist is sent to investigate the crew of an isolated research station orbiting a mysterious planet, where visitors from the crew's pasts have inexplicably appeared.", release_date: "1972-03-20", status: "Released", runtime: 167, vote_average: 8.0, vote_count: 5234, popularity: 16.8, budget: 0, revenue: 0, original_language: "ru", tagline: "", genre_ids: [878, 18, 9648], cast: ["Natalya Bondarchuk", "Donatas Banionis", "Jüri Järvet"], director: "Andrei Tarkovsky", keyword_ids: [2, 26, 3, 12, 31], company_ids: [] },
  { tmdb_id: 1030, title: "Sunshine", overview: "A team of astronauts must reignite the dying sun using a thermonuclear bomb. Their mission is humanity's last hope.", release_date: "2007-04-06", status: "Released", runtime: 107, vote_average: 7.2, vote_count: 9123, popularity: 27.4, budget: 40000000, revenue: 32021753, original_language: "en", tagline: "If the sun dies, so do we.", genre_ids: [878, 18, 53], cast: ["Cillian Murphy", "Rose Byrne", "Cliff Curtis", "Chris Evans", "Michelle Yeoh"], director: "Danny Boyle", keyword_ids: [2, 10, 25, 30], company_ids: [11] },
  { tmdb_id: 1031, title: "Children of Men", overview: "In 2027, in a chaotic world in which humans can no longer procreate, a former activist agrees to help transport a miraculously pregnant woman to a sanctuary at sea.", release_date: "2006-09-22", status: "Released", runtime: 109, vote_average: 7.9, vote_count: 11234, popularity: 35.8, budget: 76000000, revenue: 35356867, original_language: "en", tagline: "The future is a thing of the past.", genre_ids: [878, 28, 18], cast: ["Clive Owen", "Julianne Moore", "Michael Caine", "Chiwetel Ejiofor", "Clare-Hope Ashitey"], director: "Alfonso Cuarón", keyword_ids: [1, 7, 25, 32, 30], company_ids: [2] },
  { tmdb_id: 1032, title: "Her", overview: "In a near future, a lonely writer develops an unlikely relationship with an operating system designed to meet his every need.", release_date: "2014-01-10", status: "Released", runtime: 126, vote_average: 8.0, vote_count: 14587, popularity: 38.2, budget: 23000000, revenue: 47353978, original_language: "en", tagline: "A love story for the future.", genre_ids: [878, 18, 35], cast: ["Joaquin Phoenix", "Scarlett Johansson", "Amy Adams", "Rooney Mara", "Olivia Wilde"], director: "Spike Jonze", keyword_ids: [6, 9, 32, 26], company_ids: [1] },
  { tmdb_id: 1033, title: "Looper", overview: "In 2074, when the mob wants to get rid of someone, the target is sent 30 years into the past, where a hired gun known as a looper awaits to take care of the job.", release_date: "2012-09-28", status: "Released", runtime: 119, vote_average: 7.4, vote_count: 12356, popularity: 33.7, budget: 30000000, revenue: 176510318, original_language: "en", tagline: "Hunted by your future. Haunted by your past.", genre_ids: [878, 28, 53], cast: ["Joseph Gordon-Levitt", "Bruce Willis", "Emily Blunt", "Jeff Daniels", "Paul Dano"], director: "Rian Johnson", keyword_ids: [4, 1, 8, 25], company_ids: [4] },
  { tmdb_id: 1034, title: "The Truman Show", overview: "An insurance salesman discovers that his whole life is actually a reality TV show. He has lived in a completely constructed world his entire life without knowing it.", release_date: "1998-06-05", status: "Released", runtime: 103, vote_average: 8.1, vote_count: 19847, popularity: 48.6, budget: 60000000, revenue: 264118534, original_language: "en", tagline: "On the air. Unaware.", genre_ids: [878, 18, 35], cast: ["Jim Carrey", "Laura Linney", "Ed Harris", "Natascha McElhone", "Noah Emmerich"], director: "Peter Weir", keyword_ids: [27, 9, 14, 32, 26], company_ids: [3] },
  { tmdb_id: 1035, title: "Minority Report", overview: "In a future where a special police unit can arrest murderers before they commit their crimes, an officer from that unit is himself accused of a future murder.", release_date: "2002-06-21", status: "Released", runtime: 145, vote_average: 7.5, vote_count: 13234, popularity: 41.2, budget: 102000000, revenue: 358372926, original_language: "en", tagline: "Everybody runs.", genre_ids: [878, 28, 53], cast: ["Tom Cruise", "Max von Sydow", "Colin Farrell", "Samantha Morton", "Kathryn Morris"], director: "Steven Spielberg", keyword_ids: [4, 14, 1, 6, 32], company_ids: [3, 12] },
  { tmdb_id: 1036, title: "Predator", overview: "During a covert rescue mission in a Central American jungle, an elite mercenary squad is hunted by a mysterious extraterrestrial creature with advanced weaponry.", release_date: "1987-06-12", status: "Released", runtime: 107, vote_average: 7.8, vote_count: 10843, popularity: 43.1, budget: 15000000, revenue: 98267558, original_language: "en", tagline: "Nothing like it has ever been on earth before.", genre_ids: [878, 28, 12], cast: ["Arnold Schwarzenegger", "Carl Weathers", "Bill Duke", "Jesse Ventura", "Sonny Landham"], director: "John McTiernan", keyword_ids: [3, 25, 24], company_ids: [5] },
  { tmdb_id: 1037, title: "Close Encounters of the Third Kind", overview: "After an encounter with UFOs, a line worker feels undeniably drawn to an isolated area in the wilderness where something spectacular is about to happen.", release_date: "1977-11-16", status: "Released", runtime: 137, vote_average: 7.6, vote_count: 8934, popularity: 24.5, budget: 20000000, revenue: 337701267, original_language: "en", tagline: "We are not alone.", genre_ids: [878, 18, 9648], cast: ["Richard Dreyfuss", "François Truffaut", "Teri Garr", "Melinda Dillon"], director: "Steven Spielberg", keyword_ids: [3, 24, 26, 2], company_ids: [4, 12] },
  { tmdb_id: 1038, title: "Planet of the Apes", overview: "An astronaut crew crash-lands on a planet in the distant future where intelligent talking apes are the dominant species and humans are the oppressed and enslaved.", release_date: "1968-04-03", status: "Released", runtime: 112, vote_average: 7.6, vote_count: 8123, popularity: 26.8, budget: 5800000, revenue: 32589482, original_language: "en", tagline: "Somewhere in the universe, there must be something better than man!", genre_ids: [878, 18, 12], cast: ["Charlton Heston", "Roddy McDowall", "Kim Hunter", "Maurice Evans"], director: "Franklin J. Schaffner", keyword_ids: [4, 1, 28, 25], company_ids: [5] },
  { tmdb_id: 1039, title: "RoboCop", overview: "In a dystopic and crime-ridden Detroit, a terminally wounded cop returns to the force as a powerful cyborg haunted by submerged memories.", release_date: "1987-07-17", status: "Released", runtime: 102, vote_average: 7.5, vote_count: 8734, popularity: 35.2, budget: 13000000, revenue: 53424681, original_language: "en", tagline: "Part man. Part machine. All cop.", genre_ids: [878, 28, 18], cast: ["Peter Weller", "Nancy Allen", "Dan O'Herlihy", "Kurtwood Smith", "Miguel Ferrer"], director: "Paul Verhoeven", keyword_ids: [5, 8, 1, 6, 14], company_ids: [5] },
  { tmdb_id: 1040, title: "Total Recall", overview: "When a man goes to a company called Rekall to have vacation memories implanted, something goes wrong, and he discovers he might be a secret agent.", release_date: "1990-06-01", status: "Released", runtime: 113, vote_average: 7.5, vote_count: 10234, popularity: 33.9, budget: 65000000, revenue: 261317921, original_language: "en", tagline: "Get your ass to Mars.", genre_ids: [878, 28, 12], cast: ["Arnold Schwarzenegger", "Sharon Stone", "Michael Ironside", "Rachel Ticotin"], director: "Paul Verhoeven", keyword_ids: [18, 9, 31, 4, 6], company_ids: [3] },
  { tmdb_id: 1041, title: "The Fifth Element", overview: "In the colorful future, a cab driver unwittingly becomes the central figure in the search for a legendary cosmic weapon to keep Evil and Mr. Zorg at bay.", release_date: "1997-05-09", status: "Released", runtime: 126, vote_average: 7.7, vote_count: 14532, popularity: 50.3, budget: 90000000, revenue: 263920180, original_language: "fr", tagline: "The fate of the universe is in his hands.", genre_ids: [878, 28, 12], cast: ["Bruce Willis", "Milla Jovovich", "Gary Oldman", "Ian Holm", "Chris Tucker"], director: "Luc Besson", keyword_ids: [2, 3, 29, 25], company_ids: [4] },
  { tmdb_id: 1042, title: "Equilibrium", overview: "In an oppressive future where all forms of feeling are illegal, a man in charge of enforcing the law rises to overthrow the system and fight for his right to feel.", release_date: "2002-12-06", status: "Released", runtime: 107, vote_average: 7.4, vote_count: 9231, popularity: 27.8, budget: 20000000, revenue: 5370104, original_language: "en", tagline: "In a future where freedom is outlawed, outlaws will become heroes.", genre_ids: [878, 28, 18], cast: ["Christian Bale", "Taye Diggs", "Emily Watson", "Sean Bean", "Angus Macfadyen"], director: "Kurt Wimmer", keyword_ids: [1, 14, 7, 30, 32], company_ids: [7] },
  { tmdb_id: 1043, title: "V for Vendetta", overview: "A masked vigilante frees a young woman from secret police, then co-opts her into his campaign of political insurgency against the totalitarian government of a dystopian Britain.", release_date: "2006-03-17", status: "Released", runtime: 132, vote_average: 8.2, vote_count: 15234, popularity: 52.1, budget: 54000000, revenue: 132511035, original_language: "en", tagline: "Freedom! Forever!", genre_ids: [878, 28, 53], cast: ["Hugo Weaving", "Natalie Portman", "Stephen Rea", "John Hurt", "Stephen Fry"], director: "James McTeigue", keyword_ids: [1, 14, 30, 32, 8], company_ids: [1] },
  { tmdb_id: 1044, title: "The Island", overview: "Lincoln Six-Echo discovers that he is actually a clone and that the Island he has been promised as an escape from the sterile confines of his home is part of a massive deception.", release_date: "2005-07-22", status: "Released", runtime: 136, vote_average: 6.9, vote_count: 8745, popularity: 26.4, budget: 126000000, revenue: 162859564, original_language: "en", tagline: "Your time is running out.", genre_ids: [878, 28, 12], cast: ["Ewan McGregor", "Scarlett Johansson", "Djimon Hounsou", "Sean Bean", "Michael Clarke Duncan"], director: "Michael Bay", keyword_ids: [21, 6, 1, 14, 27], company_ids: [1] },
  { tmdb_id: 1045, title: "I, Robot", overview: "In 2035, a techno-phobic cop investigates a crime that may have been perpetrated by a robot, which leads to a larger threat to humanity.", release_date: "2004-07-16", status: "Released", runtime: 115, vote_average: 7.1, vote_count: 11453, popularity: 36.9, budget: 120000000, revenue: 347234916, original_language: "en", tagline: "One man saw it coming.", genre_ids: [878, 28, 12], cast: ["Will Smith", "Bridget Moynahan", "Alan Tudyk", "James Cromwell", "Chi McBride"], director: "Alex Proyas", keyword_ids: [5, 6, 1, 15, 32], company_ids: [5] },
  { tmdb_id: 1046, title: "Waterworld", overview: "In a future where the polar ice caps have melted and Earth is almost entirely underwater, a mutated mariner fights starvation and outlaw 'smokers', and reluctantly helps a woman and a young girl try to find dry land.", release_date: "1995-07-28", status: "Released", runtime: 135, vote_average: 6.1, vote_count: 7234, popularity: 24.8, budget: 175000000, revenue: 264218220, original_language: "en", tagline: "Beyond the horizon lies the secret to a new beginning.", genre_ids: [878, 28, 12], cast: ["Kevin Costner", "Dennis Hopper", "Jeanne Tripplehorn", "Tina Majorino"], director: "Kevin Reynolds", keyword_ids: [7, 1, 25, 32], company_ids: [2] },
  { tmdb_id: 1047, title: "The War of the Worlds", overview: "Earth is invaded by aliens from Mars who prove nearly invulnerable to any attack. One man tries to survive and find his family amid the onslaught.", release_date: "2005-06-29", status: "Released", runtime: 116, vote_average: 6.6, vote_count: 13456, popularity: 33.5, budget: 132000000, revenue: 603873119, original_language: "en", tagline: "They're already here.", genre_ids: [878, 28, 18], cast: ["Tom Cruise", "Dakota Fanning", "Justin Chatwin", "Tim Robbins", "Miranda Otto"], director: "Steven Spielberg", keyword_ids: [3, 24, 7, 25], company_ids: [3, 12] },
  { tmdb_id: 1048, title: "Oblivion", overview: "A veteran assigned to extract Earth's remaining resources begins to question what he knows about his mission and himself after discovering a crashed spacecraft with an unexpected occupant.", release_date: "2013-04-19", status: "Released", runtime: 124, vote_average: 7.0, vote_count: 11234, popularity: 31.7, budget: 120000000, revenue: 286168572, original_language: "en", tagline: "Earth is a memory worth fighting for.", genre_ids: [878, 28, 12], cast: ["Tom Cruise", "Morgan Freeman", "Olga Kurylenko", "Andrea Riseborough", "Melissa Leo"], director: "Joseph Kosinski", keyword_ids: [3, 24, 7, 10, 31], company_ids: [2] },
  { tmdb_id: 1049, title: "Prometheus", overview: "A team of explorers discover a clue to the origins of mankind on Earth, leading them on a thrilling journey to the darkest corners of the universe.", release_date: "2012-06-08", status: "Released", runtime: 124, vote_average: 7.0, vote_count: 14234, popularity: 38.4, budget: 130000000, revenue: 403354469, original_language: "en", tagline: "The search for our beginning could lead to our end.", genre_ids: [878, 27, 12], cast: ["Noomi Rapace", "Michael Fassbender", "Charlize Theron", "Idris Elba", "Guy Pearce"], director: "Ridley Scott", keyword_ids: [3, 10, 11, 2, 26], company_ids: [5, 10] },
  { tmdb_id: 1050, title: "The Abyss", overview: "A civilian diving team is enlisted to search for a lost nuclear submarine and encounters something totally unexpected deep in the ocean.", release_date: "1989-08-09", status: "Released", runtime: 140, vote_average: 7.5, vote_count: 7832, popularity: 22.9, budget: 69500000, revenue: 90000000, original_language: "en", tagline: "A place on earth more awesome than outer space.", genre_ids: [878, 12, 18], cast: ["Ed Harris", "Mary Elizabeth Mastrantonio", "Michael Biehn", "Leo Burmester"], director: "James Cameron", keyword_ids: [3, 2, 25, 10], company_ids: [5] },
  { tmdb_id: 1051, title: "Snowpiercer", overview: "In a future where a failed climate-change experiment kills all life on the planet except for a lucky few who boarded the Snowpiercer, a train that travels around the globe, a class system emerges.", release_date: "2013-10-30", status: "Released", runtime: 126, vote_average: 7.1, vote_count: 11234, popularity: 33.6, budget: 40000000, revenue: 86846906, original_language: "ko", tagline: "Mankind was born on the ground. The remnants of mankind are living on a train.", genre_ids: [878, 28, 18], cast: ["Chris Evans", "Song Kang-ho", "Tilda Swinton", "Jamie Bell", "Octavia Spencer"], director: "Bong Joon-ho", keyword_ids: [1, 7, 25, 30, 32], company_ids: [14] },
  { tmdb_id: 1052, title: "Never Let Me Go", overview: "As children, Kathy, Ruth, and Tommy are students at a seemingly idyllic English boarding school. As they grow into young adults, they find that they have to come to terms with the disturbing reality of their lives and their futures.", release_date: "2010-10-01", status: "Released", runtime: 103, vote_average: 7.0, vote_count: 5234, popularity: 18.4, budget: 15000000, revenue: 9388254, original_language: "en", tagline: "How do you spend the time you have?", genre_ids: [878, 18, 35], cast: ["Carey Mulligan", "Andrew Garfield", "Keira Knightley", "Sally Hawkins", "Nathalie Richard"], director: "Mark Romanek", keyword_ids: [21, 1, 26, 32, 31], company_ids: [11] },
  { tmdb_id: 1053, title: "Starship Troopers", overview: "Humans in a fascistic, militaristic future do battle with giant alien bugs in a fight for survival.", release_date: "1997-11-07", status: "Released", runtime: 129, vote_average: 7.3, vote_count: 12345, popularity: 40.8, budget: 105000000, revenue: 121214159, original_language: "en", tagline: "The only good bug is a dead bug.", genre_ids: [878, 28, 12], cast: ["Casper Van Dien", "Dina Meyer", "Denise Richards", "Neil Patrick Harris", "Jake Busey"], director: "Paul Verhoeven", keyword_ids: [3, 24, 30, 32, 25], company_ids: [4] },
  { tmdb_id: 1054, title: "Source Code", overview: "A soldier wakes up in someone else's body and discovers he's part of an experimental government program to find the bomber of a Chicago commuter train. He has 8 minutes to find the bomber.", release_date: "2011-04-01", status: "Released", runtime: 93, vote_average: 7.5, vote_count: 13456, popularity: 35.6, budget: 32000000, revenue: 147337062, original_language: "en", tagline: "Make every second count.", genre_ids: [878, 12, 53], cast: ["Jake Gyllenhaal", "Michelle Monaghan", "Vera Farmiga", "Jeffrey Wright", "Michael Arden"], director: "Duncan Jones", keyword_ids: [4, 31, 12, 9], company_ids: [4] },
  { tmdb_id: 1055, title: "Eternal Sunshine of the Spotless Mind", overview: "When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories. But it is only through the process of loss that they discover what they had to begin with.", release_date: "2004-03-19", status: "Released", runtime: 108, vote_average: 8.1, vote_count: 17234, popularity: 41.8, budget: 20000000, revenue: 72258126, original_language: "en", tagline: "You can erase someone from your mind. Getting them out of your heart is another story.", genre_ids: [878, 18, 35], cast: ["Jim Carrey", "Kate Winslet", "Kirsten Dunst", "Mark Ruffalo", "Elijah Wood"], director: "Michel Gondry", keyword_ids: [31, 6, 26, 21], company_ids: [2] },
  { tmdb_id: 1056, title: "Dark City", overview: "A man struggles with memories of his past, including a wife he cannot remember, in a nightmarish world with no sun and run by beings with telekinetic powers who seek the souls of humans.", release_date: "1998-02-27", status: "Released", runtime: 100, vote_average: 7.7, vote_count: 7234, popularity: 23.4, budget: 27000000, revenue: 14373879, original_language: "en", tagline: "They built the city to see what makes us tick. Last night one of us went off.", genre_ids: [878, 53, 9648], cast: ["Rufus Sewell", "Kiefer Sutherland", "Jennifer Connelly", "Richard O'Brien"], director: "Alex Proyas", keyword_ids: [27, 8, 31, 3, 9], company_ids: [2] },
  { tmdb_id: 1057, title: "Gattaca", overview: "A genetically inferior man assumes the identity of a superior one in order to pursue his lifelong dream of space travel.", release_date: "1997-09-26", status: "Released", runtime: 112, vote_average: 7.8, vote_count: 9834, popularity: 27.3, budget: 36000000, revenue: 12534340, original_language: "en", tagline: "There is no gene for the human spirit.", genre_ids: [878, 18, 53], cast: ["Ethan Hawke", "Uma Thurman", "Jude Law", "Alan Arkin", "Loren Dean"], director: "Andrew Niccol", keyword_ids: [11, 1, 2, 14, 32], company_ids: [4] },
  { tmdb_id: 1058, title: "Upgrade", overview: "Set in the near-future, technology controls nearly all aspects of life. But when Grey, a low-tech mechanic, has his body taken over by a self-aware computer chip called STEM, he becomes a human weapon.", release_date: "2018-06-01", status: "Released", runtime: 100, vote_average: 7.5, vote_count: 7893, popularity: 29.4, budget: 5000000, revenue: 15873453, original_language: "en", tagline: "The future has a glitch.", genre_ids: [878, 28, 53], cast: ["Logan Marshall-Green", "Melanie Vallejo", "Steve Danielsen", "Abby Craden"], director: "Leigh Whannell", keyword_ids: [6, 8, 5, 14], company_ids: [2] },
  { tmdb_id: 1059, title: "Europa Report", overview: "An international crew of astronauts undertakes a privately funded mission to search for life on Jupiter's fourth largest moon. What they discover is beyond what they could have expected.", release_date: "2013-08-02", status: "Released", runtime: 90, vote_average: 6.5, vote_count: 5231, popularity: 16.7, budget: 10000000, revenue: 126648, original_language: "en", tagline: "Go for it.", genre_ids: [878, 27, 53], cast: ["Christian Camargo", "Anamaria Marinca", "Michael Nyqvist", "Daniel Wu", "Karolina Wydra"], director: "Sebastián Cordero", keyword_ids: [2, 3, 10, 25], company_ids: [] },
  { tmdb_id: 1060, title: "The Time Machine", overview: "Based on the classic novel, a man builds a time machine and travels to the far future, only to discover what has become of humanity.", release_date: "1960-08-17", status: "Released", runtime: 103, vote_average: 7.5, vote_count: 4231, popularity: 17.8, budget: 750000, revenue: 0, original_language: "en", tagline: "Imagine being able to travel at will through time.", genre_ids: [878, 12], cast: ["Rod Taylor", "Yvette Mimieux", "Alan Young", "Sebastian Cabot"], director: "George Pal", keyword_ids: [4, 32, 1], company_ids: [1] },
  { tmdb_id: 1061, title: "Coherence", overview: "On the night of an astronomical anomaly, eight friends at a dinner party experience a troubling chain of reality-bending events.", release_date: "2013-09-22", status: "Released", runtime: 89, vote_average: 7.2, vote_count: 7234, popularity: 18.4, budget: 50000, revenue: 178736, original_language: "en", tagline: "", genre_ids: [878, 18, 53], cast: ["Emily Baldoni", "Maury Sterling", "Nicholas Brendon", "Lorene Scafaria", "Hugo Armstrong"], director: "James Ward Byrkit", keyword_ids: [12, 4, 27, 26], company_ids: [] },
  { tmdb_id: 1062, title: "Predestination", overview: "For his final assignment, a top temporal agent must pursue the one criminal that has eluded him throughout time. The chase culminates in a unique mission — a mission he thinks he alone can fulfill.", release_date: "2015-01-09", status: "Released", runtime: 97, vote_average: 7.5, vote_count: 8234, popularity: 22.6, budget: 5000000, revenue: 4213180, original_language: "en", tagline: "The fate of the world is in his hands.", genre_ids: [878, 53, 18], cast: ["Ethan Hawke", "Sarah Snook", "Noah Taylor", "Madeleine West"], director: "Michael Spierig", keyword_ids: [4, 12, 31, 26], company_ids: [] },
  { tmdb_id: 1063, title: "The Adjustment Bureau", overview: "The affair between a politician and a dancer is affected by mysterious forces keeping them apart.", release_date: "2011-03-04", status: "Released", runtime: 106, vote_average: 7.1, vote_count: 10234, popularity: 28.5, budget: 50000000, revenue: 62484750, original_language: "en", tagline: "Fate: You can only push it so far.", genre_ids: [878, 53, 35], cast: ["Matt Damon", "Emily Blunt", "Anthony Mackie", "John Slattery", "Michael Kelly"], director: "George Nolfi", keyword_ids: [12, 4, 27, 26], company_ids: [2] },
  { tmdb_id: 1064, title: "Pandorum", overview: "Two crew members of a spaceship wake up from hypersleep to discover they are alone on board. Soon they discover unsettling secrets about the mission.", release_date: "2009-09-25", status: "Released", runtime: 108, vote_average: 6.8, vote_count: 7234, popularity: 19.4, budget: 33000000, revenue: 20648900, original_language: "en", tagline: "Don't fear the end of the world. Fear what happens next.", genre_ids: [878, 27, 28], cast: ["Dennis Quaid", "Ben Foster", "Cam Gigandet", "Antje Traue", "Cung Le"], director: "Christian Alvart", keyword_ids: [2, 3, 25, 10, 31], company_ids: [4] },
  { tmdb_id: 1065, title: "In Time", overview: "In a future where time has replaced money as the world currency, Will Salas, a young man from the ghetto, discovers he has been framed for murder and must partner with a wealthy woman to bring down a system where time is the ultimate currency.", release_date: "2011-10-28", status: "Released", runtime: 109, vote_average: 6.6, vote_count: 9872, popularity: 27.8, budget: 40000000, revenue: 174002052, original_language: "en", tagline: "Live Forever or Die Trying.", genre_ids: [878, 28, 12], cast: ["Justin Timberlake", "Amanda Seyfried", "Cillian Murphy", "Alex Pettyfer", "Vincent Kartheiser"], director: "Andrew Niccol", keyword_ids: [1, 32, 14, 30], company_ids: [5] },
  { tmdb_id: 1066, title: "Altered States", overview: "A Harvard scientist conducts experiments on himself with a hallucinatory drug and an isolation chamber that begins to transform him, both physically and mentally, into a primitive state.", release_date: "1980-12-25", status: "Released", runtime: 102, vote_average: 6.9, vote_count: 4234, popularity: 14.6, budget: 15000000, revenue: 19628870, original_language: "en", tagline: "He altered his mind, changed his body.", genre_ids: [878, 27, 18], cast: ["William Hurt", "Blair Brown", "Bob Balaban", "Charles Haid"], director: "Ken Russell", keyword_ids: [28, 26, 11], company_ids: [1] },
  { tmdb_id: 1067, title: "Event Horizon", overview: "A rescue crew investigates a spaceship that disappeared into a black hole and has now returned with something far more sinister onboard.", release_date: "1997-08-15", status: "Released", runtime: 96, vote_average: 6.7, vote_count: 7834, popularity: 23.8, budget: 60000000, revenue: 26673988, original_language: "en", tagline: "Infinite space, infinite terror.", genre_ids: [878, 27, 53], cast: ["Laurence Fishburne", "Sam Neill", "Kathleen Quinlan", "Joely Richardson", "Jack Noseworthy"], director: "Paul W.S. Anderson", keyword_ids: [2, 3, 17, 25, 26], company_ids: [3] },
  { tmdb_id: 1068, title: "Sphere", overview: "After a spaceship is found at the bottom of the Pacific Ocean, a team of scientists is deployed to investigate. They discover a sphere of mysterious origin inside the vessel.", release_date: "1998-02-13", status: "Released", runtime: 133, vote_average: 6.2, vote_count: 6534, popularity: 19.3, budget: 80000000, revenue: 37020491, original_language: "en", tagline: "Earth scientists make contact.", genre_ids: [878, 18, 53], cast: ["Dustin Hoffman", "Sharon Stone", "Samuel L. Jackson", "Peter Coyote"], director: "Barry Levinson", keyword_ids: [2, 3, 9, 26], company_ids: [1] },
  { tmdb_id: 1069, title: "Ender's Game", overview: "Based on the classic science fiction novel, Andrew 'Ender' Wiggin is trained at an advanced military school in space to lead the fight against the Formics.", release_date: "2013-11-01", status: "Released", runtime: 114, vote_average: 6.6, vote_count: 8734, popularity: 26.4, budget: 110000000, revenue: 125529500, original_language: "en", tagline: "This is not a game.", genre_ids: [878, 28, 12], cast: ["Asa Butterfield", "Harrison Ford", "Hailee Steinfeld", "Abigail Breslin", "Ben Kingsley"], director: "Gavin Hood", keyword_ids: [3, 2, 6, 24, 30], company_ids: [3] },
  { tmdb_id: 1070, title: "Lucy", overview: "A woman, accidentally caught in a dark deal, turns the tables on her captors and transforms into a merciless warrior evolved beyond human logic.", release_date: "2014-08-08", status: "Released", runtime: 89, vote_average: 6.4, vote_count: 16234, popularity: 41.5, budget: 40000000, revenue: 458863600, original_language: "fr", tagline: "The average person uses 10% of their brain capacity. Imagine what she could do with 100%.", genre_ids: [878, 28, 12], cast: ["Scarlett Johansson", "Morgan Freeman", "Choi Min-sik", "Amr Waked"], director: "Luc Besson", keyword_ids: [23, 6, 26, 13], company_ids: [2] },
  { tmdb_id: 1071, title: "Zathura", overview: "Two young boys are transported to outer space after they discover and begin playing a mysterious alien board game.", release_date: "2005-11-11", status: "Released", runtime: 101, vote_average: 6.3, vote_count: 5123, popularity: 17.8, budget: 65000000, revenue: 64026120, original_language: "en", tagline: "A new adventure for those who dare to play.", genre_ids: [878, 12, 35], cast: ["Josh Hutcherson", "Jonah Bobo", "Dax Shepard", "Tim Robbins", "Kristen Stewart"], director: "Jon Favreau", keyword_ids: [2, 3, 12], company_ids: [4] },
  { tmdb_id: 1072, title: "A.I. Artificial Intelligence", overview: "A highly advanced robotic boy longs to become 'real' so that he can regain the love of his human mother. Set in a futuristic society, the story follows a mecha child on a journey to find his place in the world.", release_date: "2001-06-29", status: "Released", runtime: 146, vote_average: 7.1, vote_count: 10234, popularity: 30.5, budget: 100000000, revenue: 235926552, original_language: "en", tagline: "His love is real. He is not.", genre_ids: [878, 18, 9648], cast: ["Haley Joel Osment", "Jude Law", "Frances O'Connor", "Sam Robards", "Jake Thomas"], director: "Steven Spielberg", keyword_ids: [6, 5, 15, 32, 1], company_ids: [1, 12] },
  { tmdb_id: 1073, title: "Dredd", overview: "In a dystopic and crime-ridden Detroit, Judge Dredd is assigned to escort a victim through a mega-city locked down by a drug lord.", release_date: "2012-09-21", status: "Released", runtime: 95, vote_average: 7.1, vote_count: 8932, popularity: 27.6, budget: 45000000, revenue: 41596649, original_language: "en", tagline: "Judgment is coming.", genre_ids: [878, 28, 18], cast: ["Karl Urban", "Olivia Thirlby", "Lena Headey", "Wood Harris"], director: "Pete Travis", keyword_ids: [1, 14, 8, 30], company_ids: [] },
  { tmdb_id: 1074, title: "Monsters", overview: "Six years after Earth has suffered an alien invasion, a cynical journalist agrees to escort a shaken American tourist through an infected zone in Mexico to the safety of the US border.", release_date: "2010-12-03", status: "Released", runtime: 94, vote_average: 5.8, vote_count: 5231, popularity: 15.3, budget: 500000, revenue: 4219514, original_language: "en", tagline: "", genre_ids: [878, 18, 12], cast: ["Scoot McNairy", "Whitney Able", "Mario Zuniga Benavides"], director: "Gareth Edwards", keyword_ids: [3, 24, 25], company_ids: [] },
  { tmdb_id: 1075, title: "Another Earth", overview: "On the eve of the discovery of a duplicate Earth, 17-year-old Rhoda, aspiring to be an astronaut, makes a mistake that will change her life forever.", release_date: "2011-07-22", status: "Released", runtime: 92, vote_average: 7.0, vote_count: 5834, popularity: 16.9, budget: 100000, revenue: 2142133, original_language: "en", tagline: "Which of all my important moments are the ones I must go back to?", genre_ids: [878, 18, 9648], cast: ["Brit Marling", "William Mapother", "Matthew-Lee Erlbach"], director: "Mike Cahill", keyword_ids: [2, 12, 26, 31], company_ids: [] },
  { tmdb_id: 1076, title: "Cube", overview: "Six complete strangers with widely varying personalities are involuntarily placed in an endless maze containing deadly traps.", release_date: "1998-09-09", status: "Released", runtime: 90, vote_average: 7.2, vote_count: 8123, popularity: 22.4, budget: 365000, revenue: 8253383, original_language: "en", tagline: "Don't look for a reason. Look for a way out.", genre_ids: [878, 18, 53], cast: ["Nicole de Boer", "Nicky Guadagni", "David Hewlett", "Andrew Miller", "Julian Richings"], director: "Vincenzo Natali", keyword_ids: [27, 9, 14, 25], company_ids: [] },
  { tmdb_id: 1077, title: "Melancholia", overview: "Two sisters find their relationship challenged as a nearby depression-laden planet threatens to collide with Earth. An intimate look at how people handle the end of the world.", release_date: "2011-09-01", status: "Released", runtime: 135, vote_average: 7.1, vote_count: 6234, popularity: 18.9, budget: 7900000, revenue: 3450000, original_language: "da", tagline: "A film about the end of the world.", genre_ids: [878, 18, 9648], cast: ["Kirsten Dunst", "Charlotte Gainsbourg", "Alexander Skarsgård", "Kiefer Sutherland"], director: "Lars von Trier", keyword_ids: [2, 19, 26], company_ids: [] },
  { tmdb_id: 1078, title: "Primer", overview: "Two engineers accidentally discover they have invented a device capable of time travel, and use it for stock market gains before it gets complicated.", release_date: "2004-10-08", status: "Released", runtime: 77, vote_average: 6.9, vote_count: 8234, popularity: 19.3, budget: 7000, revenue: 1030095, original_language: "en", tagline: "What are they building in there?", genre_ids: [878, 18, 53], cast: ["Shane Carruth", "David Sullivan", "Casey Gooden", "Anand Upadhyaya"], director: "Shane Carruth", keyword_ids: [4, 6, 31, 26], company_ids: [] },
  { tmdb_id: 1079, title: "Possessor", overview: "Tasya Vos, an elite corporate assassin, uses brain-implant technology to inhabit other people's bodies, carrying out hits for the agency. She is losing control of her mind and identity.", release_date: "2020-10-02", status: "Released", runtime: 103, vote_average: 6.8, vote_count: 4532, popularity: 15.2, budget: 6000000, revenue: 1926272, original_language: "en", tagline: "A fantasy of violence and control.", genre_ids: [878, 53, 27], cast: ["Andrea Riseborough", "Christopher Abbott", "Rossif Sutherland", "Jennifer Jason Leigh", "Sean Bean"], director: "Brandon Cronenberg", keyword_ids: [9, 6, 26, 21, 13], company_ids: [] },
  { tmdb_id: 1080, title: "Dune: Part Two", overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. He faces a choice between the love of his life and the fate of the universe.", release_date: "2024-03-01", status: "Released", runtime: 166, vote_average: 8.3, vote_count: 7823, popularity: 221.5, budget: 190000000, revenue: 711826830, original_language: "en", tagline: "Long live the fighters.", genre_ids: [878, 12, 28], cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler", "Florence Pugh"], director: "Denis Villeneuve", keyword_ids: [29, 30, 25, 32, 2], company_ids: [1, 7] },
  { tmdb_id: 1081, title: "Strange Days", overview: "Set in the final days of 1999, a black market dealer of virtual-reality experiences who deals in recorded memories gets in over his head when he receives a recording involving murder.", release_date: "1995-10-13", status: "Released", runtime: 145, vote_average: 7.2, vote_count: 6123, popularity: 18.4, budget: 42000000, revenue: 7923508, original_language: "en", tagline: "The most dangerous thing in the world is seeing it through someone else's eyes.", genre_ids: [878, 28, 53], cast: ["Ralph Fiennes", "Angela Bassett", "Juliette Lewis", "Tom Sizemore", "Vincent D'Onofrio"], director: "Kathryn Bigelow", keyword_ids: [9, 8, 14, 31, 4], company_ids: [5] },
  { tmdb_id: 1082, title: "They Live", overview: "A drifter discovers a pair of sunglasses that allow him to see the world as it really is: people being ruled and manipulated by aliens.", release_date: "1988-11-04", status: "Released", runtime: 94, vote_average: 7.2, vote_count: 7234, popularity: 24.3, budget: 4000000, revenue: 13008928, original_language: "en", tagline: "You see them on the street. You watch them on TV. You might even vote for one this fall. You think they're people just like you. You're wrong. Dead wrong.", genre_ids: [878, 28, 27], cast: ["Roddy Piper", "Keith David", "Meg Foster", "George 'Buck' Flower"], director: "John Carpenter", keyword_ids: [3, 14, 27, 24], company_ids: [] },
  { tmdb_id: 1083, title: "Alita: Battle Angel", overview: "An idealistic and compassionate robot girl, Alita, is reactivated and finds herself in a future world she knows nothing about. She sets out on a quest to discover the truth about who she is.", release_date: "2019-02-14", status: "Released", runtime: 122, vote_average: 7.3, vote_count: 11234, popularity: 38.7, budget: 170000000, revenue: 404852543, original_language: "en", tagline: "Know who you are.", genre_ids: [878, 28, 12], cast: ["Rosa Salazar", "Christoph Waltz", "Jennifer Connelly", "Mahershala Ali", "Ed Skrein"], director: "Robert Rodriguez", keyword_ids: [5, 8, 15, 1, 2], company_ids: [5, 7] },
  { tmdb_id: 1084, title: "Midnight Special", overview: "A boy with special powers is on the run from the government and a group of religious fanatics, with only his father and a state trooper to protect him.", release_date: "2016-03-18", status: "Released", runtime: 112, vote_average: 6.8, vote_count: 5834, popularity: 20.3, budget: 18000000, revenue: 3682827, original_language: "en", tagline: "This is not of this world.", genre_ids: [878, 18, 12], cast: ["Michael Shannon", "Joel Edgerton", "Kirsten Dunst", "Adam Driver", "Jaeden Martell"], director: "Jeff Nichols", keyword_ids: [3, 23, 25], company_ids: [1] },
  { tmdb_id: 1085, title: "Upgrade", overview: "In a near-future, technology controls nearly all aspects of life. But when the government murders Grey's wife and paralyzes him, he's offered a chance to walk again — and take revenge — via an experimental implant.", release_date: "2018-06-01", status: "Released", runtime: 100, vote_average: 7.5, vote_count: 8934, popularity: 26.8, budget: 5000000, revenue: 15783000, original_language: "en", tagline: "The future has a glitch.", genre_ids: [878, 28, 53], cast: ["Logan Marshall-Green", "Betty Gabriel", "Harrison Gilbertson"], director: "Leigh Whannell", keyword_ids: [6, 5, 8, 15], company_ids: [2] },
  { tmdb_id: 1086, title: "The Creator", overview: "Amid a future war between the human race and the forces of artificial intelligence, a hardened ex-special forces agent grieving the disappearance of his wife is recruited to hunt down and kill the Creator.", release_date: "2023-09-29", status: "Released", runtime: 133, vote_average: 6.9, vote_count: 6234, popularity: 49.7, budget: 80000000, revenue: 103041116, original_language: "en", tagline: "To protect what we love, we destroy what we love.", genre_ids: [878, 28, 18], cast: ["John David Washington", "Gemma Chan", "Ken Watanabe", "Madeleine Yuna Voyles", "Allison Janney"], director: "Gareth Edwards", keyword_ids: [6, 5, 15, 25, 30], company_ids: [5] },
  { tmdb_id: 1087, title: "Nope", overview: "The residents of an isolated California valley encounter a mysterious and extraordinary phenomena after making a grim discovery near their isolated horse ranch.", release_date: "2022-07-22", status: "Released", runtime: 130, vote_average: 7.0, vote_count: 9234, popularity: 38.2, budget: 68000000, revenue: 172507659, original_language: "en", tagline: "We want it.", genre_ids: [878, 27, 53], cast: ["Daniel Kaluuya", "Keke Palmer", "Steven Yeun", "Michael Wincott", "Brandon Perea"], director: "Jordan Peele", keyword_ids: [3, 24, 2, 25], company_ids: [2] },
  { tmdb_id: 1088, title: "Everything Everywhere All at Once", overview: "An aging Chinese immigrant is swept up in an insane adventure, in which she alone can save what's important to her by connecting with the lives she could have led in other universes.", release_date: "2022-03-25", status: "Released", runtime: 139, vote_average: 7.9, vote_count: 11234, popularity: 61.4, budget: 14300000, revenue: 73561555, original_language: "en", tagline: "The fate of the universe rests on one immigrant woman.", genre_ids: [878, 12, 35], cast: ["Michelle Yeoh", "Stephanie Hsu", "Ke Huy Quan", "Jamie Lee Curtis", "James Hong"], director: "Daniel Kwan", keyword_ids: [12, 4, 22, 26], company_ids: [14] },
  { tmdb_id: 1089, title: "After Yang", overview: "In a near future, after Yang, a robotic assistant they consider part of their family, inexplicably shuts down, a father searches for a way to repair him and, along the way, discovers a life his family's A.I. was living outside of their knowledge.", release_date: "2021-09-12", status: "Released", runtime: 96, vote_average: 6.9, vote_count: 3234, popularity: 14.8, budget: 0, revenue: 1050000, original_language: "en", tagline: "What memories would you save?", genre_ids: [878, 18], cast: ["Colin Farrell", "Jodie Turner-Smith", "Justin H. Min", "Malea Emma Tjandrawidjaja", "Haley Lu Richardson"], director: "Kogonada", keyword_ids: [5, 6, 31, 26, 15], company_ids: [14] },
  { tmdb_id: 1090, title: "Prospect", overview: "A teenage girl and her father travel to a remote alien moon, aiming to strike it rich. They have a contract to harvest a large deposit of the elusive gems hidden in a large deposit deep in the forest of this alien world.", release_date: "2018-11-02", status: "Released", runtime: 98, vote_average: 6.7, vote_count: 4123, popularity: 16.2, budget: 4000000, revenue: 0, original_language: "en", tagline: "A Western. On a distant moon.", genre_ids: [878, 12], cast: ["Sophie Thatcher", "Jay Duplass", "Pedro Pascal", "Andre Royo", "Sheila Vand"], director: "Christopher Caldwell", keyword_ids: [2, 3, 25, 10], company_ids: [] },
  { tmdb_id: 1091, title: "High Life", overview: "Monte and his daughter Willow live in isolation on a spacecraft hurtling toward a black hole. A convicted murderer and sex offender, Monte is the sole survivor of a crew of prisoners who were sent on a mission to harvest the energy of a black hole.", release_date: "2018-09-06", status: "Released", runtime: 110, vote_average: 6.4, vote_count: 3523, popularity: 13.8, budget: 10000000, revenue: 1505879, original_language: "en", tagline: "Love, life, the universe.", genre_ids: [878, 18], cast: ["Robert Pattinson", "Juliette Binoche", "André Benjamin", "Mia Goth", "Agata Buzek"], director: "Claire Denis", keyword_ids: [2, 17, 25, 10], company_ids: [] },
  { tmdb_id: 1092, title: "Stowaway", overview: "A three-person crew on a mission to Mars faces an unforeseen life-threatening situation after an unintended stowaway is discovered shortly after launch.", release_date: "2021-04-22", status: "Released", runtime: 116, vote_average: 6.3, vote_count: 5834, popularity: 18.4, budget: 0, revenue: 0, original_language: "en", tagline: "", genre_ids: [878, 18, 53], cast: ["Anna Kendrick", "Daniel Dae Kim", "Shamier Anderson", "Toni Collette"], director: "Joe Penna", keyword_ids: [2, 18, 10, 25], company_ids: [15] },
  { tmdb_id: 1093, title: "io", overview: "As a young scientist searches for a way to save a dying Earth, she finds a connection with a man who's preparing to leave the planet forever.", release_date: "2019-01-18", status: "Released", runtime: 96, vote_average: 5.3, vote_count: 4234, popularity: 13.5, budget: 0, revenue: 0, original_language: "en", tagline: "Somewhere between life and death, fight for both.", genre_ids: [878, 18], cast: ["Margaret Qualley", "Anthony Mackie", "Danny Huston", "Tom Payne"], director: "Jonathan Helpert", keyword_ids: [7, 2, 25], company_ids: [15] },
  { tmdb_id: 1094, title: "The Platform", overview: "A man finds himself in a peculiar vertical prison in which inmates on upper floors eat lavish feasts and those below starve, and he must find a way to rectify the injustice.", release_date: "2019-11-08", status: "Released", runtime: 98, vote_average: 7.0, vote_count: 8234, popularity: 27.4, budget: 2000000, revenue: 0, original_language: "es", tagline: "Food for thought.", genre_ids: [878, 18, 53], cast: ["Iván Massagué", "Zorion Eguileor", "Antonia San Juan", "Emilio Buale", "Alexandra Masangkay"], director: "Galder Gaztelu-Urrutia", keyword_ids: [1, 27, 25, 30], company_ids: [15] },
  { tmdb_id: 1095, title: "Archive", overview: "2038. George Almore is working on a true human-equivalent AI. His latest prototype is almost complete, but this sensitive work is jeopardised by local soldiers, his corporation and a mysterious hacker.", release_date: "2020-07-10", status: "Released", runtime: 109, vote_average: 6.5, vote_count: 3523, popularity: 14.2, budget: 0, revenue: 0, original_language: "en", tagline: "The line between human and machine has never been so fragile.", genre_ids: [878, 53, 18], cast: ["Theo James", "Stacy Martin", "Rhys Ifans", "Peter Ferdinando", "Toby Jones"], director: "Gavin Rothery", keyword_ids: [6, 5, 15, 31, 21], company_ids: [] },
  { tmdb_id: 1096, title: "Vesper", overview: "After the collapse of Earth's ecosystem, a 13-year-old girl and her comatose father try to survive in a dark and dangerous world after she saves a young woman who's linked to the privileged Citadels.", release_date: "2022-09-30", status: "Released", runtime: 114, vote_average: 6.8, vote_count: 3231, popularity: 14.9, budget: 10000000, revenue: 0, original_language: "en", tagline: "The future is a weed.", genre_ids: [878, 12, 18], cast: ["Raffiella Chapman", "Eddie Marsan", "Rosy McEwen", "Richard Brake", "Edmund Dehn"], director: "Kristina Buožytė", keyword_ids: [11, 7, 1, 25], company_ids: [] },
  { tmdb_id: 1097, title: "3 Body Problem", overview: "A young woman named Ye Wenjie joins a secret government project in the Cultural Revolution to broadcast to alien civilizations, setting off a chain of events that spans decades and threatens humanity's future.", release_date: "2024-01-11", status: "Released", runtime: 169, vote_average: 7.0, vote_count: 2341, popularity: 18.7, budget: 0, revenue: 0, original_language: "en", tagline: "What lives in the dark of the universe?", genre_ids: [878, 18, 53], cast: ["Zine Tseng", "Yu Hewei", "Rosalind Chao", "Jovan Adepo", "John Bradley"], director: "Rian Johnson", keyword_ids: [3, 2, 26, 4, 24], company_ids: [15] },
  { tmdb_id: 1098, title: "Jung_E", overview: "In a 22nd-century Earth ravaged by climate change, the fate of humanity rests on the outcome of a civil war in a colonized shelter. A scientist at an AI research lab leads a project to end the war by cloning the brain of a legendary warrior.", release_date: "2023-01-20", status: "Released", runtime: 99, vote_average: 5.7, vote_count: 3231, popularity: 16.4, budget: 0, revenue: 0, original_language: "ko", tagline: "", genre_ids: [878, 28, 18], cast: ["Kang Soo-yeon", "Kim Hyun-joo", "Ryu Kyung-soo"], director: "Yeon Sang-ho", keyword_ids: [5, 6, 21, 1, 7], company_ids: [15] },
];

// ─────────────────────────────────────────────
// TV Series data
// ─────────────────────────────────────────────

const TV_SERIES: TvData[] = [
  {
    tmdb_id: 5000,
    name: "The Expanse",
    overview: "A thriller set two hundred years in the future following the case of a missing young woman who leads a hardened detective and a rogue ship's captain on a race across the solar system to expose the biggest conspiracy in human history.",
    first_air_date: "2015-12-14",
    last_air_date: "2022-01-14",
    status: "Ended",
    number_of_seasons: 6,
    number_of_episodes: 62,
    episode_run_time: [60],
    vote_average: 8.4,
    vote_count: 5234,
    popularity: 98.7,
    original_language: "en",
    networks: ["Syfy", "Prime Video"],
    tagline: "Leave the gun. Take the coffee.",
    genre_ids: [10765, 10759, 18],
    cast: ["Steven Strait", "Dominique Tipper", "Cas Anvar", "Wes Chatham", "Shohreh Aghdashloo"],
    creator: "Mark Fergus",
    keyword_ids: [2, 16, 10, 30, 1],
  },
  {
    tmdb_id: 5001,
    name: "Stranger Things",
    overview: "When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces in order to get him back.",
    first_air_date: "2016-07-15",
    last_air_date: "2025-11-26",
    status: "Returning Series",
    number_of_seasons: 5,
    number_of_episodes: 42,
    episode_run_time: [51],
    vote_average: 8.7,
    vote_count: 16234,
    popularity: 342.5,
    original_language: "en",
    networks: ["Netflix"],
    tagline: "The world is turning upside down.",
    genre_ids: [10765, 27, 18],
    cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder", "David Harbour", "Gaten Matarazzo"],
    creator: "Matt Duffer",
    keyword_ids: [9, 12, 31, 24],
  },
  {
    tmdb_id: 5002,
    name: "Black Mirror",
    overview: "An anthology series exploring a twisted, high-tech near-future where humanity's greatest innovations and darkest instincts collide.",
    first_air_date: "2011-12-04",
    last_air_date: "2023-06-15",
    status: "Returning Series",
    number_of_seasons: 6,
    number_of_episodes: 27,
    episode_run_time: [42, 89],
    vote_average: 8.3,
    vote_count: 8934,
    popularity: 156.4,
    original_language: "en",
    networks: ["Channel 4", "Netflix"],
    tagline: "You've never seen anything like it.",
    genre_ids: [10765, 18, 53],
    cast: ["Daniel Kaluuya", "Toby Kebbell", "Jodie Whittaker", "Jon Hamm", "Mackenzie Davis"],
    creator: "Charlie Brooker",
    keyword_ids: [8, 9, 14, 6, 1],
  },
  {
    tmdb_id: 5003,
    name: "Westworld",
    overview: "Set at the intersection of the near future and the reimagined past, Westworld explores a world in which every human appetite can be indulged without consequence — or can it?",
    first_air_date: "2016-10-02",
    last_air_date: "2022-08-14",
    status: "Canceled",
    number_of_seasons: 4,
    number_of_episodes: 36,
    episode_run_time: [60],
    vote_average: 8.1,
    vote_count: 9234,
    popularity: 128.6,
    original_language: "en",
    networks: ["HBO"],
    tagline: "These violent delights have violent ends.",
    genre_ids: [10765, 18, 53],
    cast: ["Evan Rachel Wood", "Anthony Hopkins", "Ed Harris", "Jeffrey Wright", "Thandiwe Newton"],
    creator: "Jonathan Nolan",
    keyword_ids: [9, 15, 5, 1, 27],
  },
  {
    tmdb_id: 5004,
    name: "Altered Carbon",
    overview: "Set in a future where consciousness is digitized and stored, a prisoner returns to life in a new body and must solve a mind-bending murder to win his freedom.",
    first_air_date: "2018-02-02",
    last_air_date: "2020-03-05",
    status: "Canceled",
    number_of_seasons: 2,
    number_of_episodes: 18,
    episode_run_time: [60],
    vote_average: 7.9,
    vote_count: 5834,
    popularity: 65.3,
    original_language: "en",
    networks: ["Netflix"],
    tagline: "Outer shell, same old you.",
    genre_ids: [10765, 18, 53],
    cast: ["Joel Kinnaman", "James Purefoy", "Martha Higareda", "Chris Conner", "Renée Elise Goldsberry"],
    creator: "Laeta Kalogridis",
    keyword_ids: [8, 26, 1, 9, 14],
  },
  {
    tmdb_id: 5005,
    name: "Dark",
    overview: "A missing child causes four estranged families to uncover a time-traveling conspiracy spanning several generations in the fictional German town of Winden.",
    first_air_date: "2017-12-01",
    last_air_date: "2020-06-27",
    status: "Ended",
    number_of_seasons: 3,
    number_of_episodes: 26,
    episode_run_time: [60],
    vote_average: 8.8,
    vote_count: 7234,
    popularity: 89.2,
    original_language: "de",
    networks: ["Netflix"],
    tagline: "The beginning is the end and the end is the beginning.",
    genre_ids: [10765, 18, 9648],
    cast: ["Louis Hofmann", "Oliver Masucci", "Karoline Eichhorn", "Lisa Vicari", "Maja Schöne"],
    creator: "Baran bo Odar",
    keyword_ids: [4, 12, 31, 26],
  },
  {
    tmdb_id: 5006,
    name: "Severance",
    overview: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, Mark's understanding of his world is upended.",
    first_air_date: "2022-02-18",
    last_air_date: "2025-01-17",
    status: "Returning Series",
    number_of_seasons: 2,
    number_of_episodes: 19,
    episode_run_time: [56],
    vote_average: 8.7,
    vote_count: 5023,
    popularity: 187.4,
    original_language: "en",
    networks: ["Apple TV+"],
    tagline: "Work-life separation.",
    genre_ids: [10765, 18, 9648],
    cast: ["Adam Scott", "Zach Cherry", "Britt Lower", "Tramell Tillman", "Jen Tullock"],
    creator: "Dan Erickson",
    keyword_ids: [31, 13, 27, 14, 26],
  },
  {
    tmdb_id: 5007,
    name: "Foundation",
    overview: "Follow Hari Seldon and his extraordinary group of exiles on their monumental journey to preserve humanity's knowledge as the Galactic Empire crumbles around them.",
    first_air_date: "2021-09-24",
    last_air_date: "2023-07-28",
    status: "Returning Series",
    number_of_seasons: 2,
    number_of_episodes: 20,
    episode_run_time: [60],
    vote_average: 7.4,
    vote_count: 4234,
    popularity: 74.1,
    original_language: "en",
    networks: ["Apple TV+"],
    tagline: "Long live the Foundation.",
    genre_ids: [10765, 12, 18],
    cast: ["Jared Harris", "Lee Pace", "Lou Llobell", "Leah Harvey", "Laura Birn"],
    creator: "David S. Goyer",
    keyword_ids: [29, 30, 2, 32, 10],
  },
  {
    tmdb_id: 5008,
    name: "For All Mankind",
    overview: "An alternate history drama that explores what would have happened if the global space race had never ended. The story follows NASA astronauts and support staff while exploring the alternate history.",
    first_air_date: "2019-11-01",
    last_air_date: "2025-03-14",
    status: "Returning Series",
    number_of_seasons: 4,
    number_of_episodes: 40,
    episode_run_time: [60],
    vote_average: 8.1,
    vote_count: 3523,
    popularity: 55.4,
    original_language: "en",
    networks: ["Apple TV+"],
    tagline: "History's greatest competition is not over.",
    genre_ids: [10765, 18, 10759],
    cast: ["Joel Kinnaman", "Michael Dorman", "Sarah Jones", "Shantel VanSanten", "Wrenn Schmidt"],
    creator: "Ronald D. Moore",
    keyword_ids: [10, 2, 18, 12, 32],
  },
  {
    tmdb_id: 5009,
    name: "Love, Death & Robots",
    overview: "Animated anthology series spanning the science fiction, fantasy, horror and comedy genres. Each episode explores themes of the human condition through different animation styles and stories.",
    first_air_date: "2019-03-15",
    last_air_date: "2022-05-20",
    status: "Returning Series",
    number_of_seasons: 3,
    number_of_episodes: 35,
    episode_run_time: [6, 17],
    vote_average: 8.4,
    vote_count: 6234,
    popularity: 92.8,
    original_language: "en",
    networks: ["Netflix"],
    tagline: "Science fiction. Fantasy. Horror.",
    genre_ids: [10765, 35, 27],
    cast: ["Mary Elizabeth Winstead", "Michael B. Jordan", "Topher Grace"],
    creator: "Tim Miller",
    keyword_ids: [5, 3, 1, 7, 15],
  },
  {
    tmdb_id: 5010,
    name: "The Mandalorian",
    overview: "After the fall of the Galactic Empire, lawlessness has spread throughout the galaxy. A lone gunfighter makes his way through the outer reaches, earning his way as a bounty hunter.",
    first_air_date: "2019-11-12",
    last_air_date: "2023-04-19",
    status: "Returning Series",
    number_of_seasons: 3,
    number_of_episodes: 24,
    episode_run_time: [40],
    vote_average: 8.7,
    vote_count: 9234,
    popularity: 248.6,
    original_language: "en",
    networks: ["Disney+"],
    tagline: "This is the way.",
    genre_ids: [10765, 10759, 12],
    cast: ["Pedro Pascal", "Carl Weathers", "Giancarlo Esposito", "Werner Herzog", "Nick Nolte"],
    creator: "Jon Favreau",
    keyword_ids: [29, 2, 30, 3],
  },
  {
    tmdb_id: 5011,
    name: "Battlestar Galactica",
    overview: "When the Cylons, a robot race created by man, launch a devastating attack on the Twelve Colonies, the battlestar Galactica and its crew must lead the remnants of humanity to safety.",
    first_air_date: "2004-10-18",
    last_air_date: "2009-03-20",
    status: "Ended",
    number_of_seasons: 4,
    number_of_episodes: 73,
    episode_run_time: [44],
    vote_average: 8.7,
    vote_count: 5234,
    popularity: 62.8,
    original_language: "en",
    networks: ["Syfy"],
    tagline: "The cylons were created by man. They evolved. They rebelled. There are many copies.",
    genre_ids: [10765, 10759, 18],
    cast: ["Edward James Olmos", "Mary McDonnell", "Katee Sackhoff", "Jamie Bamber", "James Callis"],
    creator: "Ronald D. Moore",
    keyword_ids: [5, 2, 7, 3, 30],
  },
  {
    tmdb_id: 5012,
    name: "Star Trek: The Next Generation",
    overview: "Set in the 24th century and decades after the adventures of the original crew of the starship Enterprise, this new series is the long-awaited successor to the original Star Trek.",
    first_air_date: "1987-09-28",
    last_air_date: "1994-05-23",
    status: "Ended",
    number_of_seasons: 7,
    number_of_episodes: 176,
    episode_run_time: [44],
    vote_average: 8.5,
    vote_count: 5023,
    popularity: 76.4,
    original_language: "en",
    networks: ["NBC"],
    tagline: "To boldly go where no one has gone before.",
    genre_ids: [10765, 10759, 12],
    cast: ["Patrick Stewart", "Jonathan Frakes", "LeVar Burton", "Denise Crosby", "Michael Dorn"],
    creator: "Gene Roddenberry",
    keyword_ids: [2, 3, 10, 29, 32],
  },
  {
    tmdb_id: 5013,
    name: "Lost in Space",
    overview: "After crash landing on an alien planet, the Robinson family fight against all odds to survive and escape, but they're surrounded by hidden dangers.",
    first_air_date: "2018-04-13",
    last_air_date: "2021-12-01",
    status: "Ended",
    number_of_seasons: 3,
    number_of_episodes: 28,
    episode_run_time: [60],
    vote_average: 7.3,
    vote_count: 3534,
    popularity: 43.7,
    original_language: "en",
    networks: ["Netflix"],
    tagline: "",
    genre_ids: [10765, 10759, 12],
    cast: ["Molly Parker", "Toby Stephens", "Maxwell Jenkins", "Taylor Russell", "Mina Sundwall"],
    creator: "Matt Sazama",
    keyword_ids: [2, 3, 10, 25, 12],
  },
  {
    tmdb_id: 5014,
    name: "The Outer Limits",
    overview: "A revival of the classic 1960s anthology series exploring science-fiction themes and moral dilemmas. Each episode is a self-contained story exploring aspects of human nature through the lens of the fantastic.",
    first_air_date: "1995-04-01",
    last_air_date: "2002-01-19",
    status: "Ended",
    number_of_seasons: 7,
    number_of_episodes: 154,
    episode_run_time: [44],
    vote_average: 7.6,
    vote_count: 2234,
    popularity: 24.6,
    original_language: "en",
    networks: ["Showtime"],
    tagline: "There is nothing wrong with your television set.",
    genre_ids: [10765, 27, 18],
    cast: ["Robert Patrick", "Kevin Conway", "Alan Rachins", "Pam Hyatt"],
    creator: "Leslie Stevens",
    keyword_ids: [3, 9, 12, 27],
  },
  {
    tmdb_id: 5015,
    name: "Fringe",
    overview: "A television drama centered around a female FBI agent who is forced to work with an institutionalized scientist and his son in order to rationalize a brewing storm of unexplained phenomena.",
    first_air_date: "2008-09-09",
    last_air_date: "2013-01-18",
    status: "Ended",
    number_of_seasons: 5,
    number_of_episodes: 100,
    episode_run_time: [44],
    vote_average: 8.4,
    vote_count: 4523,
    popularity: 55.3,
    original_language: "en",
    networks: ["Fox"],
    tagline: "Questions will be answered.",
    genre_ids: [10765, 9648, 53],
    cast: ["Anna Torv", "Joshua Jackson", "John Noble", "Lance Reddick", "Blair Brown"],
    creator: "J.J. Abrams",
    keyword_ids: [11, 12, 6, 28, 3],
  },
  {
    tmdb_id: 5016,
    name: "Firefly",
    overview: "Five hundred years in the future, a renegade crew aboard a small spacecraft tries to survive as they travel the galaxy and evade warring factions as well as the allied forces of the authoritarian Alliance government.",
    first_air_date: "2002-09-20",
    last_air_date: "2002-12-20",
    status: "Ended",
    number_of_seasons: 1,
    number_of_episodes: 11,
    episode_run_time: [60],
    vote_average: 9.0,
    vote_count: 5834,
    popularity: 67.4,
    original_language: "en",
    networks: ["Fox"],
    tagline: "You can't take the sky from me.",
    genre_ids: [10765, 10759, 18],
    cast: ["Nathan Fillion", "Gina Torres", "Alan Tudyk", "Morena Baccarin", "Adam Baldwin"],
    creator: "Joss Whedon",
    keyword_ids: [2, 30, 29, 1, 25],
  },
  {
    tmdb_id: 5017,
    name: "The 100",
    overview: "Set 97 years after a nuclear war has destroyed civilization, a spaceship housing humanity's lone survivors sends 100 juvenile delinquents back to Earth in hopes of possibly re-populating the planet.",
    first_air_date: "2014-03-19",
    last_air_date: "2020-09-30",
    status: "Ended",
    number_of_seasons: 7,
    number_of_episodes: 100,
    episode_run_time: [43],
    vote_average: 7.7,
    vote_count: 5234,
    popularity: 62.1,
    original_language: "en",
    networks: ["The CW"],
    tagline: "Fight or die.",
    genre_ids: [10765, 10759, 18],
    cast: ["Eliza Taylor", "Bob Morley", "Marie Avgeropoulos", "Isaiah Washington", "Henry Ian Cusick"],
    creator: "Jason Rothenberg",
    keyword_ids: [7, 25, 1, 30, 2],
  },
  {
    tmdb_id: 5018,
    name: "Orphan Black",
    overview: "A streetwise woman discovers she's a clone, and gets pulled into a conspiracy of clones, corporations, and bioethical transgressions.",
    first_air_date: "2013-03-30",
    last_air_date: "2017-08-12",
    status: "Ended",
    number_of_seasons: 5,
    number_of_episodes: 50,
    episode_run_time: [44],
    vote_average: 8.3,
    vote_count: 4523,
    popularity: 49.8,
    original_language: "en",
    networks: ["Space", "BBC America"],
    tagline: "Clone club.",
    genre_ids: [10765, 53, 9648],
    cast: ["Tatiana Maslany", "Jordan Gavaris", "Maria Doyle Kennedy", "Dylan Bruce", "Kristian Bruun"],
    creator: "John Fawcett",
    keyword_ids: [21, 11, 14, 9, 30],
  },
  {
    tmdb_id: 5019,
    name: "3 Body Problem",
    overview: "Across continents and centuries, five brilliant friends make earth-shattering discoveries as the laws of nature unravel and an existential threat emerges.",
    first_air_date: "2024-03-21",
    last_air_date: "2024-03-21",
    status: "Returning Series",
    number_of_seasons: 1,
    number_of_episodes: 8,
    episode_run_time: [60],
    vote_average: 7.7,
    vote_count: 3234,
    popularity: 89.7,
    original_language: "en",
    networks: ["Netflix"],
    tagline: "The universe is a dark forest.",
    genre_ids: [10765, 18, 53],
    cast: ["Jovan Adepo", "John Bradley", "Rosalind Chao", "Liam Cunningham", "Eiza González"],
    creator: "David Benioff",
    keyword_ids: [3, 2, 24, 26, 16],
  },
  {
    tmdb_id: 5020,
    name: "Devs",
    overview: "A computer engineer investigates the secretive development division of her employer, a cutting-edge tech company based in San Francisco, which she believes is behind the murder of her boyfriend.",
    first_air_date: "2020-03-05",
    last_air_date: "2020-04-16",
    status: "Ended",
    number_of_seasons: 1,
    number_of_episodes: 8,
    episode_run_time: [52],
    vote_average: 7.7,
    vote_count: 2534,
    popularity: 35.6,
    original_language: "en",
    networks: ["Hulu", "BBC Two"],
    tagline: "The future has already been decided.",
    genre_ids: [10765, 53, 9648],
    cast: ["Sonoya Mizuno", "Nick Offerman", "Jin Ha", "Zach Grenier", "Cailee Spaeny"],
    creator: "Alex Garland",
    keyword_ids: [6, 27, 26, 14, 4],
  },
  {
    tmdb_id: 5021,
    name: "The Boys",
    overview: "A group of vigilantes known informally as 'The Boys' set out to take down corrupt superheroes with no more than raw nerve, humor, and a willingness to fight dirty.",
    first_air_date: "2019-07-26",
    last_air_date: "2024-06-13",
    status: "Ended",
    number_of_seasons: 4,
    number_of_episodes: 32,
    episode_run_time: [57],
    vote_average: 8.5,
    vote_count: 8234,
    popularity: 276.4,
    original_language: "en",
    networks: ["Prime Video"],
    tagline: "Never meet your heroes.",
    genre_ids: [10765, 10759, 35],
    cast: ["Karl Urban", "Jack Quaid", "Antony Starr", "Erin Moriarty", "Dominique McElligott"],
    creator: "Eric Kripke",
    keyword_ids: [23, 14, 30, 1],
  },
  {
    tmdb_id: 5022,
    name: "Invasion",
    overview: "Earth is visited by an alien species that threatens humanity's existence. Events unfold in real time through the eyes of five ordinary people across the globe as they struggle to make sense of the chaos unraveling around them.",
    first_air_date: "2021-10-22",
    last_air_date: "2023-10-25",
    status: "Returning Series",
    number_of_seasons: 2,
    number_of_episodes: 20,
    episode_run_time: [53],
    vote_average: 6.2,
    vote_count: 2534,
    popularity: 31.8,
    original_language: "en",
    networks: ["Apple TV+"],
    tagline: "",
    genre_ids: [10765, 10759, 18],
    cast: ["Sam Neill", "Shamier Anderson", "Golshifteh Farahani", "Billy Barratt", "Firas Nassar"],
    creator: "Simon Kinberg",
    keyword_ids: [3, 24, 25, 30],
  },
  {
    tmdb_id: 5023,
    name: "Raised by Wolves",
    overview: "Two androids are tasked with raising human children on a mysterious virgin planet. As the burgeoning colony of humans threatens to be torn apart by religious differences, the androids learn that controlling the beliefs of humans is a treacherous and difficult task.",
    first_air_date: "2020-09-03",
    last_air_date: "2022-03-17",
    status: "Canceled",
    number_of_seasons: 2,
    number_of_episodes: 18,
    episode_run_time: [60],
    vote_average: 7.5,
    vote_count: 3234,
    popularity: 41.2,
    original_language: "en",
    networks: ["HBO Max"],
    tagline: "Believe in science.",
    genre_ids: [10765, 18],
    cast: ["Amanda Collin", "Abubakar Salim", "Winta McGrath", "Travis Fimmel", "Niamh Algar"],
    creator: "Aaron Guzikowski",
    keyword_ids: [3, 5, 6, 15, 7],
  },
  {
    tmdb_id: 5024,
    name: "Dark Matter",
    overview: "A family man's life is upended when he's abducted and plunged into a world where the roads not taken have become just as real as the life he left behind.",
    first_air_date: "2024-05-08",
    last_air_date: "2024-06-26",
    status: "Ended",
    number_of_seasons: 1,
    number_of_episodes: 9,
    episode_run_time: [50],
    vote_average: 7.7,
    vote_count: 2123,
    popularity: 52.4,
    original_language: "en",
    networks: ["Apple TV+"],
    tagline: "Which life is truly yours?",
    genre_ids: [10765, 53, 9648],
    cast: ["Joel Edgerton", "Jennifer Connelly", "Alice Braga", "Oakes Fegley", "Jimmi Simpson"],
    creator: "Blake Crouch",
    keyword_ids: [12, 4, 26, 31],
  },
  {
    tmdb_id: 5025,
    name: "Pantheon",
    overview: "Maddie, a bullied teenager, receives mysterious messages from an unknown user online. Gradually she discovers that the messages are from her recently deceased father, who has become the world's first Uploaded Intelligence.",
    first_air_date: "2022-09-01",
    last_air_date: "2023-08-03",
    status: "Ended",
    number_of_seasons: 2,
    number_of_episodes: 16,
    episode_run_time: [30],
    vote_average: 8.2,
    vote_count: 1523,
    popularity: 28.4,
    original_language: "en",
    networks: ["AMC+"],
    tagline: "What does it mean to be human?",
    genre_ids: [10765, 18, 9648],
    cast: ["Rosemarie DeWitt", "Paul Dano", "Scoot McNairy", "Daniel Dae Kim", "Taylor Schilling"],
    creator: "Ken Liu",
    keyword_ids: [6, 9, 26, 15, 31],
  },
  {
    tmdb_id: 5026,
    name: "The Peripheral",
    overview: "Flynne Fisher lives in a small town in the future American South. When she discovers the dark world of future London is using her as a pawn in their schemes, she begins to fight back with the resources at her disposal.",
    first_air_date: "2022-10-21",
    last_air_date: "2022-12-09",
    status: "Canceled",
    number_of_seasons: 1,
    number_of_episodes: 8,
    episode_run_time: [60],
    vote_average: 7.6,
    vote_count: 2523,
    popularity: 39.8,
    original_language: "en",
    networks: ["Prime Video"],
    tagline: "Two futures. One timeline.",
    genre_ids: [10765, 53, 9648],
    cast: ["Chloë Grace Moretz", "Jack Reynor", "Gary Carr", "Eli Goree", "Alexandra Billings"],
    creator: "Scott B. Smith",
    keyword_ids: [4, 9, 8, 12, 26],
  },
  {
    tmdb_id: 5027,
    name: "Loki",
    overview: "After stealing the Tesseract during the events of Avengers: Endgame, an alternate version of Loki is brought to the mysterious Time Variance Authority, a bureaucratic organization that exists outside of time and space.",
    first_air_date: "2021-06-09",
    last_air_date: "2023-11-09",
    status: "Ended",
    number_of_seasons: 2,
    number_of_episodes: 12,
    episode_run_time: [52],
    vote_average: 8.2,
    vote_count: 7234,
    popularity: 198.6,
    original_language: "en",
    networks: ["Disney+"],
    tagline: "God of stories.",
    genre_ids: [10765, 10759, 12],
    cast: ["Tom Hiddleston", "Owen Wilson", "Sophia Di Martino", "Gugu Mbatha-Raw", "Jonathan Majors"],
    creator: "Michael Waldron",
    keyword_ids: [4, 12, 29, 30],
  },
  {
    tmdb_id: 5028,
    name: "Station Eleven",
    overview: "Set in the days before and after a devastating flu pandemic, the series tells the interconnected stories of survivors as they attempt to rebuild and reimagine the world anew.",
    first_air_date: "2021-12-16",
    last_air_date: "2022-01-13",
    status: "Ended",
    number_of_seasons: 1,
    number_of_episodes: 10,
    episode_run_time: [55],
    vote_average: 8.0,
    vote_count: 2534,
    popularity: 33.7,
    original_language: "en",
    networks: ["HBO Max"],
    tagline: "",
    genre_ids: [10765, 18, 9648],
    cast: ["Himesh Patel", "Mackenzie Davis", "Matilda Lawler", "David Wilmot", "Gael García Bernal"],
    creator: "Patrick Somerville",
    keyword_ids: [7, 25, 1, 31],
  },
  {
    tmdb_id: 5029,
    name: "Silo",
    overview: "In a ruined and toxic future, thousands of people live in a giant underground silo that plunges hundreds of stories below the surface of the earth. Sheriff Juliette uncovers secrets and lies in the silo.",
    first_air_date: "2023-05-05",
    last_air_date: "2023-06-30",
    status: "Returning Series",
    number_of_seasons: 1,
    number_of_episodes: 10,
    episode_run_time: [60],
    vote_average: 8.1,
    vote_count: 3234,
    popularity: 76.4,
    original_language: "en",
    networks: ["Apple TV+"],
    tagline: "The truth will surface.",
    genre_ids: [10765, 18, 9648],
    cast: ["Rebecca Ferguson", "Common", "Tim Robbins", "Harriet Walter", "David Oyelowo"],
    creator: "Graham Yost",
    keyword_ids: [1, 7, 27, 14, 25],
  },
];

// ─────────────────────────────────────────────
// Seeding logic
// ─────────────────────────────────────────────

/**
 * Core seeding logic, exported for use by test setup.
 * Accepts an optional sqlite instance so tests can use an in-memory DB.
 */
export function runSeed(db: typeof sqlite) {
  // Clear existing data if requested
  if (clearFirst) {
    console.log("Clearing existing data...");
    db.exec(`
      DELETE FROM movie_production_companies;
      DELETE FROM movie_keywords;
      DELETE FROM movie_crew;
      DELETE FROM movie_cast;
      DELETE FROM movie_genres;
      DELETE FROM tv_series_crew;
      DELETE FROM tv_series_cast;
      DELETE FROM tv_series_genres;
      DELETE FROM movies;
      DELETE FROM tv_series;
      DELETE FROM people;
      DELETE FROM keywords;
      DELETE FROM production_companies;
      DELETE FROM genres;
      DELETE FROM sync_state;
    `);
  }

  const allMovies = [...KNOWN_MOVIES, ...GENERATED_MOVIES];

  // Build people registry (deduplicated across all titles)
  const personMap = new Map<string, number>();
  let personTmdbIdCounter = 9000;

  function getOrCreatePerson(name: string): number {
    if (personMap.has(name)) return personMap.get(name)!;
    const tmdbId = personTmdbIdCounter++;
    personMap.set(name, tmdbId);
    return tmdbId;
  }

  db.transaction(() => {
    // Insert genres
    for (const g of GENRES) {
      db.prepare("INSERT OR REPLACE INTO genres(id, name) VALUES (?, ?)").run(g.id, g.name);
    }

    // Insert keywords
    for (const k of KEYWORDS) {
      db.prepare("INSERT OR REPLACE INTO keywords(id, name) VALUES (?, ?)").run(k.id, k.name);
    }

    // Insert production companies
    for (const c of PRODUCTION_COMPANIES) {
      db.prepare("INSERT OR REPLACE INTO production_companies(id, name, logo_path, origin_country) VALUES (?, ?, ?, ?)")
        .run(c.id, c.name, c.logo_path, c.origin_country);
    }

    // Build people table from cast + directors
    const allPeople = new Set<string>();
    for (const m of allMovies) {
      m.cast.forEach((n) => allPeople.add(n));
      allPeople.add(m.director);
    }
    for (const tv of TV_SERIES) {
      tv.cast.forEach((n) => allPeople.add(n));
      allPeople.add(tv.creator);
    }
    for (const name of allPeople) {
      const tmdbId = getOrCreatePerson(name);
      db.prepare("INSERT OR IGNORE INTO people(tmdb_id, name, profile_path, known_for_department) VALUES (?, ?, ?, ?)")
        .run(tmdbId, name, null, "Acting");
    }

    // Insert movies
    for (const m of allMovies) {
      db.prepare(`
        INSERT OR REPLACE INTO movies(
          tmdb_id, title, original_title, overview, poster_path, backdrop_path,
          release_date, status, runtime, vote_average, vote_count, popularity,
          budget, revenue, original_language, spoken_languages, tagline,
          imdb_id, tmdb_updated_at
        ) VALUES (
          @tmdb_id, @title, @original_title, @overview, null, null,
          @release_date, @status, @runtime, @vote_average, @vote_count, @popularity,
          @budget, @revenue, @original_language, '["en"]', @tagline,
          @imdb_id, datetime('now')
        )
      `).run({
        tmdb_id: m.tmdb_id,
        title: m.title,
        original_title: m.original_title ?? m.title,
        overview: m.overview,
        release_date: m.release_date,
        status: m.status,
        runtime: m.runtime,
        vote_average: m.vote_average,
        vote_count: m.vote_count,
        popularity: m.popularity,
        budget: m.budget,
        revenue: m.revenue,
        original_language: m.original_language,
        tagline: m.tagline,
        imdb_id: m.imdb_id ?? null,
      });

      const row = db.prepare("SELECT id FROM movies WHERE tmdb_id = ?").get(m.tmdb_id) as { id: number };
      const movieId = row.id;

      // Genres
      for (const gid of m.genre_ids) {
        db.prepare("INSERT OR IGNORE INTO movie_genres(movie_id, genre_id) VALUES (?, ?)").run(movieId, gid);
      }

      // Cast
      for (let i = 0; i < m.cast.length; i++) {
        const name = m.cast[i];
        const tmdbId = getOrCreatePerson(name);
        const person = db.prepare("SELECT id FROM people WHERE tmdb_id = ?").get(tmdbId) as { id: number };
        db.prepare("INSERT OR IGNORE INTO movie_cast(movie_id, person_id, character, display_order) VALUES (?, ?, ?, ?)")
          .run(movieId, person.id, `Character of ${name.split(" ")[0]}`, i);
      }

      // Crew (Director)
      const directorTmdbId = getOrCreatePerson(m.director);
      const director = db.prepare("SELECT id FROM people WHERE tmdb_id = ?").get(directorTmdbId) as { id: number };
      db.prepare("INSERT OR IGNORE INTO movie_crew(movie_id, person_id, job, department) VALUES (?, ?, ?, ?)")
        .run(movieId, director.id, "Director", "Directing");

      // Keywords
      for (const kid of m.keyword_ids) {
        db.prepare("INSERT OR IGNORE INTO movie_keywords(movie_id, keyword_id) VALUES (?, ?)").run(movieId, kid);
      }

      // Production companies
      for (const cid of m.company_ids) {
        db.prepare("INSERT OR IGNORE INTO movie_production_companies(movie_id, company_id) VALUES (?, ?)").run(movieId, cid);
      }

      // Denormalized fields
      db.prepare(`
        UPDATE movies SET
          cast_names    = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_cast mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = movies.id),
          crew_names    = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_crew mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = movies.id),
          keyword_names = (SELECT GROUP_CONCAT(k.name, ', ') FROM movie_keywords mk JOIN keywords k ON mk.keyword_id = k.id WHERE mk.movie_id = movies.id)
        WHERE id = ?
      `).run(movieId);
    }

    // Insert TV series
    for (const tv of TV_SERIES) {
      db.prepare(`
        INSERT OR REPLACE INTO tv_series(
          tmdb_id, name, original_name, overview, poster_path, backdrop_path,
          first_air_date, last_air_date, status, number_of_seasons, number_of_episodes,
          episode_run_time, vote_average, vote_count, popularity, original_language,
          spoken_languages, tagline, networks, tmdb_updated_at
        ) VALUES (
          @tmdb_id, @name, @original_name, @overview, null, null,
          @first_air_date, @last_air_date, @status, @number_of_seasons, @number_of_episodes,
          @episode_run_time, @vote_average, @vote_count, @popularity, @original_language,
          '["en"]', @tagline, @networks, datetime('now')
        )
      `).run({
        tmdb_id: tv.tmdb_id,
        name: tv.name,
        original_name: tv.original_name ?? tv.name,
        overview: tv.overview,
        first_air_date: tv.first_air_date,
        last_air_date: tv.last_air_date ?? null,
        status: tv.status,
        number_of_seasons: tv.number_of_seasons,
        number_of_episodes: tv.number_of_episodes,
        episode_run_time: JSON.stringify(tv.episode_run_time),
        vote_average: tv.vote_average,
        vote_count: tv.vote_count,
        popularity: tv.popularity,
        original_language: tv.original_language,
        tagline: tv.tagline,
        networks: JSON.stringify(tv.networks),
      });

      const row = db.prepare("SELECT id FROM tv_series WHERE tmdb_id = ?").get(tv.tmdb_id) as { id: number };
      const tvId = row.id;

      // Genres
      for (const gid of tv.genre_ids) {
        // Make sure genre exists
        db.prepare("INSERT OR IGNORE INTO genres(id, name) VALUES (?, ?)").run(gid, `Genre ${gid}`);
        db.prepare("INSERT OR IGNORE INTO tv_series_genres(tv_series_id, genre_id) VALUES (?, ?)").run(tvId, gid);
      }

      // Cast
      for (let i = 0; i < tv.cast.length; i++) {
        const name = tv.cast[i];
        const tmdbId = getOrCreatePerson(name);
        const person = db.prepare("SELECT id FROM people WHERE tmdb_id = ?").get(tmdbId) as { id: number };
        db.prepare("INSERT OR IGNORE INTO tv_series_cast(tv_series_id, person_id, character, display_order) VALUES (?, ?, ?, ?)")
          .run(tvId, person.id, `Character of ${name.split(" ")[0]}`, i);
      }

      // Crew (Creator/Showrunner)
      const creatorTmdbId = getOrCreatePerson(tv.creator);
      const creator = db.prepare("SELECT id FROM people WHERE tmdb_id = ?").get(creatorTmdbId) as { id: number };
      db.prepare("INSERT OR IGNORE INTO tv_series_crew(tv_series_id, person_id, job, department) VALUES (?, ?, ?, ?)")
        .run(tvId, creator.id, "Creator", "Production");

      // Denormalized fields
      db.prepare(`
        UPDATE tv_series SET
          cast_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_cast tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = tv_series.id),
          crew_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_crew tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = tv_series.id)
        WHERE id = ?
      `).run(tvId);
    }

    // Insert sync state
    const movieCount = (db.prepare("SELECT COUNT(*) as c FROM movies").get() as { c: number }).c;
    const tvCount = (db.prepare("SELECT COUNT(*) as c FROM tv_series").get() as { c: number }).c;
    const today = new Date().toISOString().slice(0, 10);

    db.prepare(`
      INSERT INTO sync_state(id, last_sync_date, last_sync_type, total_movies, total_tv_series, last_change_date, updated_at)
      VALUES (1, @last_sync_date, 'initial', @total_movies, @total_tv_series, @last_change_date, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        last_sync_date = excluded.last_sync_date,
        last_sync_type = excluded.last_sync_type,
        total_movies = excluded.total_movies,
        total_tv_series = excluded.total_tv_series,
        last_change_date = excluded.last_change_date,
        updated_at = excluded.updated_at
    `).run({ last_sync_date: today, total_movies: movieCount, total_tv_series: tvCount, last_change_date: today });

  })();

  const movieCount = (db.prepare("SELECT COUNT(*) as c FROM movies").get() as { c: number }).c;
  const tvCount = (db.prepare("SELECT COUNT(*) as c FROM tv_series").get() as { c: number }).c;
  const peopleCount = (db.prepare("SELECT COUNT(*) as c FROM people").get() as { c: number }).c;

  return { movieCount, tvCount, peopleCount };
}

// ─────────────────────────────────────────────
// Entry point (when run directly)
// ─────────────────────────────────────────────

const { movieCount, tvCount, peopleCount } = runSeed(sqlite);
console.log(`✓ Seeded ${movieCount} movies, ${tvCount} TV series, ${peopleCount} people`);
