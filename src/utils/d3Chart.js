import * as d3 from 'd3';\nimport { globalConfig } from '../config/globalConfig';

export function drawBarChart(container, dataset, config) {
  if (!container) {
    return;
  }

  const width = config.width;
  const height = config.height;
  const margin = config.margin;

  d3.select(container).selectAll('*').remove();

  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%');

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const x = d3
    .scaleBand()
    .domain(dataset.map((d) => d.label))
    .range([0, innerWidth])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(dataset, (d) => d.value) || 100])
    .nice()
    .range([innerHeight, 0]);

  const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  g.selectAll('rect')
    .data(dataset)
    .join('rect')
    .attr('x', (d) => x(d.label))
    .attr('y', (d) => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', (d) => innerHeight - y(d.value))
    .attr('fill', globalConfig.cyberpunkPalette.accent)
    .attr('stroke', globalConfig.cyberpunkPalette.primary)
    .attr('stroke-width', 2);

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 2 === 0)))
    .selectAll('text')
    .attr('font-size', 20)
    .attr('transform', 'rotate(-25)')
    .style('text-anchor', 'end');

  g.append('g').call(d3.axisLeft(y).ticks(5));
}

export function drawHeatmap(container, dataset, config) {
  if (!container) return;

  const width = config.width;
  const height = config.height;
  const margin = config.margin;

  d3.select(container).selectAll('*').remove();

  const genres = [...new Set(dataset.map(d => d.genre))].sort();
  const platforms = ['mal', 'imdb', 'bgm'];
  const platformLabels = { mal: 'MyAnimeList', imdb: 'IMDb', bgm: 'Bangumi' };

  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%');

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const x = d3.scaleBand()
    .domain(genres)
    .range([0, innerWidth])
    .padding(0.05);

  const y = d3.scaleBand()
    .domain(platforms)
    .range([0, innerHeight])
    .padding(0.05);

  const color = d3.scaleLinear()
    .domain([0, 50, 100])
    .range([globalConfig.cyberpunkPalette.heatmap.low, globalConfig.cyberpunkPalette.heatmap.mid, globalConfig.cyberpunkPalette.heatmap.high])
    .clamp(true);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);;

  g.selectAll('rect')
    .data(dataset)
    .join('rect')
    .attr('x', d => x(d.genre))
    .attr('y', d => y(d.platform))
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('fill', d => color(d.value))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .append('title')
    .text(d => `${d.genre} - ${platformLabels[d.platform]}\nAvg Percentile: ${d.value.toFixed(1)}`);

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('font-size', 24)
    .attr('transform', 'rotate(-60)')
    .style('text-anchor', 'end')
    .style('dominant-baseline', 'middle');

  g.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .attr('font-size', 26);

  const legendX = innerWidth + 20;
  const legendHeight = 20;
  const legendData = d3.range(0, 101, 10);

  g.append('g')
    .attr('transform', `translate(${legendX}, 0)`)
    .selectAll('rect')
    .data(legendData)
    .join('rect')
    .attr('y', (d, i) => i * legendHeight / 10)
    .attr('width', 15)
    .attr('height', legendHeight / 10)
    .attr('fill', d => color(d));

  g.append('text')
    .attr('x', legendX)
    .attr('y', -5)
    .attr('font-size', 20)
    .text('Percentile');
}
