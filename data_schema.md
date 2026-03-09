# Anime Rating Project – Data Schema

## 1. Dataset Overview

This project compares anime rating behavior across three platforms:

- MyAnimeList (MAL)
- IMDb
- Bangumi

The goal is to analyze how platform communities differ in their evaluation of anime, with a particular focus on **genre-driven disagreement**.

---

## 2. Unit of Analysis

Each row represents **one anime title**.

If a title appears on multiple platforms, the records are merged into a single row using a unified internal `id`.

---

## 3. Core Fields

### Identity Fields

- `id` (string)  
  Unique internal identifier for each anime.

- `title_en` (string)  
  English title.

- `title_jp` (string)  
  Japanese title.

- `year` (number)  
  Release year.

- `type` (string)  
  Anime type, e.g. `TV`, `Movie`, `OVA`.  
  For this project, we primarily focus on `TV`.

---

## 4. Genre Fields

- `genres` (array of strings)  
  All assigned genres for this title.


Anime titles may belong to **multiple genres**, and the dataset therefore supports **multi-label genre membership**.

Genres will be used for filtering, grouping, and aggregation in visualizations.

### Genre Aggregation Rule

When aggregating statistics by genre:

- If an anime belongs to multiple genres, it contributes to **each genre's statistics**.

This anime will be included in both:

- Sci-Fi group
- Drama group

This **multi-membership rule** ensures that genre analysis preserves the multi-dimensional nature of anime classification.

---

## 5. Platform-Specific Rating Fields

### MyAnimeList

- `mal_score` (number | null)  
  Raw average rating on MAL.

- `mal_votes` (number | null)  
  Number of users who rated this anime on MAL.

- `mal_rank` (number | null)  
  Rank position on MAL.

- `mal_percentile` (number | null)  
  Normalized percentile score within MAL.

---

### IMDb

- `imdb_score` (number | null)  
  Raw average rating on IMDb.

- `imdb_votes` (number | null)  
  Number of users who rated this anime on IMDb.

- `imdb_rank` (number | null)  
  Rank position on IMDb.

- `imdb_percentile` (number | null)  
  Normalized percentile score within IMDb.

---

### Bangumi

- `bangumi_score` (number | null)  
  Raw average rating on Bangumi.

- `bangumi_votes` (number | null)  
  Number of users who rated this anime on Bangumi.

- `bangumi_rank` (number | null)  
  Rank position on Bangumi.

- `bangumi_percentile` (number | null)  
  Normalized percentile score within Bangumi.

---

## 6. Derived Fields

These fields are computed during preprocessing.

- `avg_score_across_platforms` (number | null)  
  Mean of available raw scores across MAL / IMDb / Bangumi.

- `avg_percentile_across_platforms` (number | null)  
  Mean of available percentile scores.

- `score_variance` (number | null)  
  Variance of ratings across platforms for the same title.

- `vote_total` (number | null)  
  Sum of all available vote counts.

- `rating_gap_max` (number | null)  
  Maximum difference between any two platform scores.

---

## 7. Missing Value Rules

If a title does not exist on a platform or data is unavailable:

- score fields → `null`
- vote fields → `null`
- rank fields → `null`
- percentile fields → `null`

Do **not** use `0` to represent missing data.

---

## 8. Normalization Rules

Because rating scales and distributions may differ across platforms, cross-platform comparison should primarily use:

- `mal_percentile`
- `imdb_percentile`
- `bangumi_percentile`

### Why Percentile?

Percentiles reduce the effect of different platform rating cultures and make scores more comparable.

### Raw vs Normalized Usage

**Raw scores**

Used for:

- title-level comparison
- tooltip display

**Percentile scores**

Used for:

- cross-platform comparisons
- heatmap summaries
- radar charts
- aggregated genre statistics

---

## 9. Aggregation Rules

### Heatmap

Group by:

- `genre`
- platform

Metric:

Mean percentile score within each **genre-platform** group.

---

### Radar Charts

Group by:

- `genre`

Metrics:

- mean percentile score per platform
- optional IQR or variance to represent rating stability

---

### Parallel Coordinates

Filter by:

Selected `genre`.

Include titles whose `genres` array contains the selected genre.

Use:

- `mal_rank`
- `imdb_rank`
- `bangumi_rank`

for titles ranked on **at least two platforms**.

---

## 10. Interaction Fields Required by Front-End

The following fields must be available to all visualization components:

- `id`
- `title_en`
- `year`
- `genres`
- `mal_score`
- `imdb_score`
- `bangumi_score`
- `mal_votes`
- `imdb_votes`
- `bangumi_votes`
- `mal_rank`
- `imdb_rank`
- `bangumi_rank`
- `mal_percentile`
- `imdb_percentile`
- `bangumi_percentile`

---

## 11. Example Record

```json
{
  "id": "001",
  "title_en": "Steins;Gate",
  "title_jp": "シュタインズ・ゲート",
  "year": 2011,
  "type": "TV",
  "genres": ["Sci-Fi", "Thriller", "Drama"],
  "mal_score": 9.07,
  "mal_votes": 2500000,
  "mal_rank": 2,
  "mal_percentile": 0.995,
  "imdb_score": 8.8,
  "imdb_votes": 75000,
  "imdb_rank": 12,
  "imdb_percentile": 0.982,
  "bangumi_score": 8.9,
  "bangumi_votes": 180000,
  "bangumi_rank": 5,
  "bangumi_percentile": 0.988
}

