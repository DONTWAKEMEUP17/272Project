import * as d3 from 'd3';

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
    .attr('fill', '#3b82f6');

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 2 === 0)))
    .selectAll('text')
    .attr('font-size', 10)
    .attr('transform', 'rotate(-25)')
    .style('text-anchor', 'end');

  g.append('g').call(d3.axisLeft(y).ticks(5));
}
