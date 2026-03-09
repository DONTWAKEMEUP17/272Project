export function buildRandomBarData(rawData = [], size = 8) {
  const fallback = Array.from({ length: size }, (_, i) => ({
    label: `item-${i + 1}`,
    value: Math.round(Math.random() * 100)
  }));

  if (!rawData.length) {
    return fallback;
  }

  return Array.from({ length: size }, (_, i) => {
    const row = rawData[Math.floor(Math.random() * rawData.length)] || {};
    const label = row.title || row.name || row.anime_title || `row-${i + 1}`;
    return {
      label,
      value: Math.round(Math.random() * 100)
    };
  });
}

export function buildGenreHeatmapData(rawData) {
  const heatmapData = {};
  const platforms = ['mal', 'imdb', 'bgm'];
  
  rawData.forEach(anime => {
    if (!anime.genre) return;
    
    // 处理多个 genre（用 | 分隔）
    const genres = anime.genre.split('|').map(g => g.trim());
    
    // 遵循 data_schema.md：多标签规则
    // 每个 anime 对所有它的 genre 都有贡献
    genres.forEach(genre => {
      if (!heatmapData[genre]) {
        heatmapData[genre] = {
          mal: [],
          imdb: [],
          bgm: []
        };
      }
      
      // 每个 anime 对该 genre 的每个 platform 都贡献一个 percentile 值
      if (anime.mal_percentile) heatmapData[genre].mal.push(parseFloat(anime.mal_percentile));
      if (anime.imdb_percentile) heatmapData[genre].imdb.push(parseFloat(anime.imdb_percentile));
      if (anime.bgm_percentile) heatmapData[genre].bgm.push(parseFloat(anime.bgm_percentile));
    });
  });
  
  // 转换为热力图格式
  const result = [];
  Object.entries(heatmapData).forEach(([genre, platformData]) => {
    platforms.forEach(platform => {
      const scores = platformData[platform];
      const avgPercentile = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      
      result.push({
        genre: genre,
        platform: platform,
        value: avgPercentile,
        count: scores.length
      });
    });
  });
  
  return result;
}
