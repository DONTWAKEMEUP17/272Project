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
