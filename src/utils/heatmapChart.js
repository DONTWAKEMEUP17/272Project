import * as d3 from 'd3';

/**
 * Heatmap visualization following Component Contract
 * Implements: init(), update(), resize(), destroy()
 * 
 * Follows data_schema.md multi-label genre rule:
 * Each anime contributes to all its genres
 */
export class HeatmapChart {
  constructor(config = {}) {
    this.config = {
      width: config.width || 1200,
      height: config.height || 500,
      margin: config.margin || { top: 20, right: 120, bottom: 180, left: 100 }
    };
    this.container = null;
    this.svg = null;
    this.dataset = null;
    this.platformLabels = { mal: 'MyAnimeList', imdb: 'IMDb', bgm: 'Bangumi' };
  }

  /**
   * Initialize visualization
   * @param {DOM Element} container - where chart will render
   * @param {Array} data - heatmap data with {genre, platform, value, count}
   * @param {Object} sharedState - global state
   */
  init(container, data, sharedState) {
    this.container = container;
    this.dataset = data;

    const width = this.config.width;
    const height = this.config.height;
    const margin = this.config.margin;

    d3.select(container).selectAll('*').remove();

    this.svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%');

    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    this.g = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Setup scales
    this.genres = [...new Set(data.map(d => d.genre))].sort();
    this.platforms = ['mal', 'imdb', 'bgm'];

    this.xScale = d3.scaleBand()
      .domain(this.genres)
      .range([0, this.innerWidth])
      .padding(0.05);

    this.yScale = d3.scaleBand()
      .domain(this.platforms)
      .range([0, this.innerHeight])
      .padding(0.05);

    this.colorScale = d3.scaleLinear()
      .domain([0, 50, 100])
      .range(['#ef5350', '#fdd835', '#66bb6a'])
      .clamp(true);

    // Render
    this.render();
  }

  /**
   * Update based on step state and shared state
   * @param {Object} stepState - current step configuration
   * @param {Object} sharedState - shared global state
   */
  update(stepState, sharedState) {
    if (!this.g || !this.dataset) return;

    const { highlightGenre } = stepState;

    // Update rect colors and emphasis based on highlight
    this.g.selectAll('rect.heatmap-cell')
      .attr('opacity', d => {
        if (!highlightGenre) return 1;
        return d.genre === highlightGenre ? 1 : 0.3;
      })
      .attr('stroke-width', d => {
        return d.genre === highlightGenre ? 2 : 1;
      })
      .attr('stroke', d => {
        return d.genre === highlightGenre ? '#000' : '#fff';
      });
  }

  /**
   * Recalculate layout on window resize
   */
  resize() {
    if (!this.svg || !this.container) return;
    
    const newWidth = this.container.clientWidth || this.config.width;
    const newHeight = this.container.clientHeight || this.config.height;

    this.svg
      .attr('viewBox', `0 0 ${newWidth} ${newHeight}`);
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.svg) {
      this.svg.remove();
    }
    // Also remove tooltip
    if (this.container) {
      d3.select(this.container).select('.heatmap-tooltip').remove();
    }
    this.svg = null;
    this.g = null;
    this.dataset = null;
  }

  /**
   * Internal render method
   */
  render() {
    if (!this.g) return;

    // Clear existing elements
    this.g.selectAll('rect.heatmap-cell').remove();
    this.g.selectAll('.x-axis').remove();
    this.g.selectAll('.y-axis').remove();
    this.g.selectAll('.legend').remove();
    
    // Create tooltip div if not exists
    let tooltip = d3.select(this.container).select('.heatmap-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select(this.container)
        .append('div')
        .attr('class', 'heatmap-tooltip')
        .style('position', 'absolute')
        .style('padding', '8px 12px')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('z-index', '1000')
        .style('white-space', 'nowrap');
    }

    // Draw heatmap cells
    this.g.selectAll('rect.heatmap-cell')
      .data(this.dataset)
      .join('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => this.xScale(d.genre))
      .attr('y', d => this.yScale(d.platform))
      .attr('width', this.xScale.bandwidth())
      .attr('height', this.yScale.bandwidth())
      .attr('fill', d => this.colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        // Hover in: increase stroke width and brightness
        d3.select(event.currentTarget)
          .attr('stroke', '#333')
          .attr('stroke-width', 3)
          .attr('opacity', 1);
        
        // Show tooltip
        const tooltipText = `${d.genre} - ${this.platformLabels[d.platform]}\nAvg Percentile: ${d.value.toFixed(1)}\nTitles: ${d.count || 'N/A'}`;
        const containerRect = this.container.getBoundingClientRect();
        tooltip
          .style('display', 'block')
          .html(tooltipText.replace(/\n/g, '<br/>'))
          .style('left', (event.clientX - containerRect.left + 10) + 'px')
          .style('top', (event.clientY - containerRect.top + 10) + 'px');
      })
      .on('mousemove', (event) => {
        // Update tooltip position
        const containerRect = this.container.getBoundingClientRect();
        tooltip
          .style('left', (event.clientX - containerRect.left + 10) + 'px')
          .style('top', (event.clientY - containerRect.top + 10) + 'px');
      })
      .on('mouseleave', function(event, d) {
        // Hover out: reset
        d3.select(this)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('opacity', 1);
        
        // Hide tooltip
        tooltip.style('display', 'none');
      });

    // X-axis (Genre)
    this.g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.innerHeight})`)
      .call(d3.axisBottom(this.xScale))
      .selectAll('text')
      .attr('font-size', 12)
      .attr('transform', 'rotate(-60)')
      .style('text-anchor', 'end')
      .style('dominant-baseline', 'middle');

    // Y-axis (Platform)
    this.g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale))
      .selectAll('text')
      .attr('font-size', 13);

    // Color legend
    const legendX = this.innerWidth + 20;
    const legendHeight = 20;
    const legendData = d3.range(0, 101, 10);

    const legend = this.g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, 0)`);

    legend.selectAll('rect')
      .data(legendData)
      .join('rect')
      .attr('y', (d, i) => i * (legendHeight / 10))
      .attr('width', 15)
      .attr('height', legendHeight / 10)
      .attr('fill', d => this.colorScale(d));

    legend.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .attr('font-size', 10)
      .text('Percentile');
  }
}
