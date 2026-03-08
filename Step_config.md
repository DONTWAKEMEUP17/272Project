## 2. `step_config.json`

```json
[
  {
    "id": "intro",
    "scene": "intro",
    "text": "Anime ratings may look similar on the surface, but disagreement across platforms is often driven by genre and community taste.",
    "state": {
      "selectedGenre": null,
      "highlightGenre": null,
      "highlightTitle": null,
      "mode": "intro"
    }
  },
  {
    "id": "heatmap-overview",
    "scene": "heatmap",
    "text": "Different genres show different cross-platform rating patterns. The disagreement is not universal; it depends on what kind of anime we look at.",
    "state": {
      "selectedGenre": null,
      "highlightGenre": null,
      "highlightTitle": null,
      "metric": "percentile_mean",
      "showAnnotations": false
    }
  },
  {
    "id": "heatmap-genre-outlier",
    "scene": "heatmap",
    "text": "Some genres appear much more favored on one platform than on others, suggesting that audience preference is deeply community-specific.",
    "state": {
      "selectedGenre": null,
      "highlightGenre": "Isekai",
      "highlightTitle": null,
      "metric": "percentile_mean",
      "showAnnotations": true
    }
  },
  {
    "id": "beeswarm-overview",
    "scene": "beeswarm",
    "text": "Within a genre, individual titles still vary widely. Each point is an anime, positioned by rating and sized by vote count.",
    "state": {
      "selectedGenre": "Isekai",
      "highlightGenre": "Isekai",
      "highlightTitle": null,
      "mode": "distribution"
    }
  },
  {
    "id": "beeswarm-title-highlight",
    "scene": "beeswarm",
    "text": "Hovering or selecting one title reveals how the same anime is judged differently across communities.",
    "state": {
      "selectedGenre": "Isekai",
      "highlightGenre": "Isekai",
      "highlightTitle": "Mushoku Tensei",
      "mode": "distribution"
    }
  },
  {
    "id": "scatter-transition",
    "scene": "beeswarmScatter",
    "text": "The same titles can transition into a scatter plot, showing the relationship between popularity and rating.",
    "state": {
      "selectedGenre": "Isekai",
      "highlightGenre": "Isekai",
      "highlightTitle": null,
      "mode": "scatter"
    }
  },
  {
    "id": "scatter-popularity-pattern",
    "scene": "beeswarmScatter",
    "text": "Popular titles often receive more stable evaluations, while niche titles may show stronger disagreement across platforms.",
    "state": {
      "selectedGenre": "Isekai",
      "highlightGenre": "Isekai",
      "highlightTitle": null,
      "mode": "scatter",
      "showTrendLine": true
    }
  },
  {
    "id": "radar-overview",
    "scene": "radar",
    "text": "Looking across all genres, each radar glyph becomes a profile of platform preference. Similar shapes suggest agreement; skewed shapes suggest bias.",
    "state": {
      "selectedGenre": null,
      "highlightGenre": null,
      "highlightTitle": null,
      "metric": "mean"
    }
  },
  {
    "id": "radar-iqr-toggle",
    "scene": "radar",
    "text": "We can also switch from mean to IQR to compare not only average preference, but also stability and spread within each genre.",
    "state": {
      "selectedGenre": null,
      "highlightGenre": null,
      "highlightTitle": null,
      "metric": "iqr"
    }
  },
  {
    "id": "parallel-overview",
    "scene": "parallel",
    "text": "Finally, rankings reveal disagreement in the most intuitive way. Within the same genre, titles can rise or fall dramatically from one platform to another.",
    "state": {
      "selectedGenre": "Isekai",
      "highlightGenre": "Isekai",
      "highlightTitle": null,
      "topN": 30
    }
  },
  {
    "id": "parallel-highlight-title",
    "scene": "parallel",
    "text": "A steep line means strong ranking disagreement. A nearly flat line means the title is similarly valued across communities.",
    "state": {
      "selectedGenre": "Isekai",
      "highlightGenre": "Isekai",
      "highlightTitle": "Re:Zero",
      "topN": 30
    }
  },
  {
    "id": "takeaway",
    "scene": "outro",
    "text": "Cross-platform disagreement is not random noise. It reflects community taste, genre preference, and cultural context.",
    "state": {
      "selectedGenre": null,
      "highlightGenre": null,
      "highlightTitle": null,
      "mode": "takeaway"
    }
  }
]