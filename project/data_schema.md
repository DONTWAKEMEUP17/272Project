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
  每个anime的Unique internal identifier.

- `title_en` (string)  
  英文名

- `title_jp` (string)  
  日文名

- `year` (number)  
  发布年份

- `type` (string)  
  Anime type, e.g. `TV`, `Movie`, `OVA`.  
  For this project, we primarily focus on `TV`.

---

### Genre Fields

- `genres` (array of strings)  
  All assigned genres for this title. Example:
  `["Sci-Fi", "Drama", "Psychological"]`
  

- `primary_genre` (string)  
  The main genre used for aggregation and filtering in visualizations.
  涉及Genre元素时，选择最靠前的那一个代表动画类别的genre标签。例如：
  [奇幻，冒险]，则该anime的primary_genre为奇幻。

#### Genre Rule
Because one anime can belong to multiple genres, we define:

- `genres`: used for detailed filtering and tooltip display
- `primary_genre`: used for heatmap, radar, and ranking aggregation

Primary genre assignment should follow one agreed rule across the team, such as:
1. the first listed genre from the source, or
2. a manually cleaned dominant genre

This rule must remain consistent across all views.

---

## 4. Platform-Specific Rating Fields

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

## 5. Derived Fields

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

## 6. Missing Value Rules

If a title does not exist on a platform or data is unavailable:

- score fields → `null`
- vote fields → `null`
- rank fields → `null`
- percentile fields → `null`

Do **not** use `0` to represent missing data.

---

## 7. Normalization Rules

Because rating scales and distributions may differ across platforms, cross-platform comparison should primarily use:

- `mal_percentile`
- `imdb_percentile`
- `bangumi_percentile`

### Why percentile?
Percentiles reduce the effect of different platform rating cultures and make scores more comparable.

### Raw vs Normalized Usage
- Raw scores: used in title-level display and tooltip
- Percentile scores: used in cross-platform comparisons, heatmap summaries, and radar charts

---

## 8. Aggregation Rules

### For Heatmap
Group by:

- `primary_genre`
- platform

Metric:
- mean percentile score within each genre-platform group

---

### For Radar Charts
Group by:

- `primary_genre`

Metrics:
- platform mean percentile
- optional IQR / variance for stability

---

### For Parallel Coordinates
Filter by:

- selected `primary_genre`

Use:
- `mal_rank`
- `imdb_rank`
- `bangumi_rank`

for titles that have rankings on at least two platforms.

---

## 9. Interaction Fields Required by Front-End

The following fields must always be available to all visualization components:

- `id`
- `title_en`
- `year`
- `primary_genre`
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

## 10. Example Record

```json
{
  "id": "anime_001",
  "title_en": "Steins;Gate",
  "title_jp": "シュタインズ・ゲート",
  "year": 2011,
  "type": "TV",
  "genres": ["Sci-Fi", "Thriller", "Drama"],
  "primary_genre": "Sci-Fi",
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