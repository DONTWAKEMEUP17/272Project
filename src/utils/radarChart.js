import * as d3 from 'd3';

/**
 * Radar Chart - Genre Bias Through Radar Profiles
 * Implements Component Contract: init(), update(), resize(), destroy()
 * 
 * Story Point 4: Genre-level cross-platform behavior analysis
 * 
 * Each radar glyph represents one anime genre with 3 axes:
 * - MyAnimeList percentile mean
 * - IMDb percentile mean
 * - Bangumi percentile mean
 * 
 * Shape interpretation:
 * - Circular: strong agreement across platforms
 * - Skewed: platform-specific preference bias
 * - Compressed axis: potential undervaluation in that ecosystem
 * 
 * Arranged as small multiples (genre portrait gallery)
 */
export class RadarChart {
  constructor(config = {}) {
    this.config = {
      width: config.width || 1600,
      height: config.height || 700,
      margin: config.margin || { top: 40, right: 40, bottom: 80, left: 120 }
    };
    this.container = null;
    this.svg = null;
    this.dataset = null;
    this.rawData = null;
    this.sharedState = null;
    
    this.platformLabels = {
      mal: 'MyAnimeList',
      imdb: 'IMDb',
      bgm: 'Bangumi'
    };
    
    this.platformColors = {
      mal: '#2563eb',   // blue
      imdb: '#f59e0b',  // amber
      bgm: '#8b5cf6'    // violet
    };
    
    this.tooltip = null;
    this.hoveredGenre = null;
  }

  /**
   * Initialize visualization
   * @param {DOM Element} container - where chart will render
   * @param {Array} rawData - raw anime dataset
   * @param {Object} sharedState - global state
   */
  init(container, rawData, sharedState) {
    this.container = container;
    this.rawData = rawData;
    this.sharedState = sharedState || {};
    
    // Aggregate data by genre
    this.dataset = this.aggregateByGenre(rawData);

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

    // Main group for all content
    this.g = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create tooltip
    this.createTooltip();
    
    // Render radar charts as small multiples
    this.renderRadarGallery();
  }

  /**
   * Aggregate data by genre
   * Calculate mean percentile for each platform per genre
   */
  aggregateByGenre(rawData) {
    const genreData = {};
    
    rawData.forEach(anime => {
      if (!anime.genre) return;
      
      // Handle multi-label genres (split by |)
      const genres = anime.genre.split('|').map(g => g.trim());
      
      genres.forEach(genre => {
        if (!genreData[genre]) {
          genreData[genre] = {
            genre: genre,
            mal_percentiles: [],
            imdb_percentiles: [],
            bgm_percentiles: [],
            count: 0
          };
        }
        
        // Collect percentiles for each platform
        if (anime.mal_percentile) {
          genreData[genre].mal_percentiles.push(parseFloat(anime.mal_percentile));
        }
        if (anime.imdb_percentile) {
          genreData[genre].imdb_percentiles.push(parseFloat(anime.imdb_percentile));
        }
        if (anime.bgm_percentile) {
          genreData[genre].bgm_percentiles.push(parseFloat(anime.bgm_percentile));
        }
        
        genreData[genre].count += 1;
      });
    });
    
    // Calculate mean percentiles and variability
    return Object.values(genreData)
      .map(g => ({
        genre: g.genre,
        mal_mean: g.mal_percentiles.length > 0 
          ? g.mal_percentiles.reduce((a, b) => a + b, 0) / g.mal_percentiles.length 
          : 50,
        imdb_mean: g.imdb_percentiles.length > 0 
          ? g.imdb_percentiles.reduce((a, b) => a + b, 0) / g.imdb_percentiles.length 
          : 50,
        bgm_mean: g.bgm_percentiles.length > 0 
          ? g.bgm_percentiles.reduce((a, b) => a + b, 0) / g.bgm_percentiles.length 
          : 50,
        mal_iqr: this.calculateIQR(g.mal_percentiles),
        imdb_iqr: this.calculateIQR(g.imdb_percentiles),
        bgm_iqr: this.calculateIQR(g.bgm_percentiles),
        count: g.count
      }))
      .sort((a, b) => b.count - a.count); // Sort by number of anime in genre
  }

  /**
   * Calculate interquartile range for a dataset
   */
  calculateIQR(data) {
    if (data.length < 2) return 0;
    const sorted = data.sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    return sorted[q3Index] - sorted[q1Index];
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    let tooltip = d3.select(this.container).select('.radar-tooltip');
    if (tooltip.empty()) {
      this.tooltip = d3.select(this.container)
        .append('div')
        .attr('class', 'radar-tooltip')
        .style('position', 'absolute')
        .style('padding', '10px 12px')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('z-index', '1000')
        .style('line-height', '1.5');
    } else {
      this.tooltip = tooltip;
    }
  }

  /**
   * Render gallery of radar charts (small multiples)
   */
  renderRadarGallery(dataToRender = this.dataset) {
    if (!this.g) return;

    // Clear previous content
    this.g.selectAll('.radar-group').remove();

    const radarSize = 120; // Size of each radar circle
    const padding = 40;    // Padding between radars
    const cols = Math.floor(this.innerWidth / (radarSize + padding));
    const rows = Math.ceil(dataToRender.length / cols);

    dataToRender.forEach((genreData, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * (radarSize + padding) + radarSize / 2;
      const y = row * (radarSize + padding) + radarSize / 2;

      // Create group for each radar
      const radarGroup = this.g.append('g')
        .attr('class', 'radar-group')
        .attr('transform', `translate(${x}, ${y})`);

      this.drawSingleRadar(radarGroup, genreData, radarSize);
    });
  }

  /**
   * Draw a single radar chart for one genre
   */
  drawSingleRadar(group, genreData, size) {
    const radius = size / 2 - 5;
    const radialScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    // Axes: mal, imdb, bgm
    const axes = ['mal', 'imdb', 'bgm'];
    const angleSlice = (Math.PI * 2) / axes.length;

    // Draw concentric circles (grid)
    for (let i = 1; i <= 5; i++) {
      const r = (radius / 5) * i;
      group.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.5);
    }

    // Draw axes
    axes.forEach((axis, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      // Axis line
      group.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 0.5);

      // Axis label
      const labelDist = radius + 15;
      const labelX = labelDist * Math.cos(angle);
      const labelY = labelDist * Math.sin(angle);

      group.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 9)
        .style('font-weight', 'bold')
        .style('fill', this.platformColors[axis])
        .text(axis.toUpperCase());
    });

    // Prepare data for polygon
    const data = [
      { axis: 'mal', value: genreData.mal_mean },
      { axis: 'imdb', value: genreData.imdb_mean },
      { axis: 'bgm', value: genreData.bgm_mean }
    ];

    // Draw polygon (mean line)
    const lineGenerator = d3.lineRadial()
      .angle((d, i) => angleSlice * i - Math.PI / 2)
      .radius(d => radialScale(d.value));

    // Close the path
    const pathData = data.concat([data[0]]);

    group.append('path')
      .datum(pathData)
      .attr('d', lineGenerator)
      .attr('fill', 'rgba(100, 150, 200, 0.2)')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        this.hoveredGenre = genreData.genre;
        this.highlightRadar(genreData.genre);
        this.showTooltip(event, genreData);
      })
      .on('mouseleave', () => {
        this.hoveredGenre = null;
        this.unhighlightRadar();
        this.hideTooltip();
      });

    // Draw data points
    group.selectAll('.radar-dot')
      .data(data)
      .join('circle')
      .attr('class', 'radar-dot')
      .attr('cx', (d, i) => radialScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => radialScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('r', 3)
      .attr('fill', d => this.platformColors[d.axis])
      .attr('opacity', 0.8);

    // Genre label at bottom
    group.append('text')
      .attr('class', 'radar-genre-label')
      .attr('x', 0)
      .attr('y', radius + 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text(genreData.genre);

    // Count label
    group.append('text')
      .attr('class', 'radar-count-label')
      .attr('x', 0)
      .attr('y', radius + 42)
      .attr('text-anchor', 'middle')
      .attr('font-size', 8)
      .style('fill', '#6b7280')
      .text(`(${genreData.count} anime)`);
  }

  /**
   * Highlight a specific genre radar
   */
  highlightRadar(genreName) {
    // Highlight the selected genre, dim others
    this.g.selectAll('.radar-group').each(function(d, i) {
      const text = d3.select(this).select('.radar-genre-label');
      if (text.text() === genreName) {
        d3.select(this).attr('opacity', 1);
      } else {
        d3.select(this).attr('opacity', 0.3);
      }
    });
  }

  /**
   * Remove genre highlight
   */
  unhighlightRadar() {
    this.g.selectAll('.radar-group').attr('opacity', 1);
  }

  /**
   * Show tooltip with genre information
   */
  showTooltip(event, genreData) {
    const tooltipText = `
      <strong>${genreData.genre}</strong>
      <br/>
      <strong>Mean Percentiles:</strong>
      <br/>MyAnimeList: ${genreData.mal_mean.toFixed(1)}
      <br/>IMDb: ${genreData.imdb_mean.toFixed(1)}
      <br/>Bangumi: ${genreData.bgm_mean.toFixed(1)}
      <br/>
      <strong>Variability (IQR):</strong>
      <br/>MAL: ${genreData.mal_iqr.toFixed(1)}
      <br/>IMDb: ${genreData.imdb_iqr.toFixed(1)}
      <br/>Bangumi: ${genreData.bgm_iqr.toFixed(1)}
      <br/>
      <span style="font-size: 11px; opacity: 0.8;">
        Anime count: ${genreData.count}
      </span>
    `;

    const containerRect = this.container.getBoundingClientRect();
    this.tooltip
      .style('display', 'block')
      .html(tooltipText)
      .style('left', (event.clientX - containerRect.left + 50) + 'px')
      .style('top', (event.clientY - containerRect.top + 85) + 'px');
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style('display', 'none');
    }
  }

  /**
   * Update based on step state and shared state
   * @param {Object} stepState - current step configuration
   * @param {Object} sharedState - shared global state
   */
  update(stepState, sharedState) {
    if (!this.g || !this.dataset) return;

    this.sharedState = sharedState || {};
    const highlightGenre = stepState?.highlightGenre || sharedState?.highlightGenre;

    // Update highlighting based on highlighted genre
    if (highlightGenre) {
      this.highlightRadar(highlightGenre);
    } else {
      this.unhighlightRadar();
    }
  }

  /**
   * Handle window resize
   */
  resize() {
    if (!this.svg || !this.container) return;

    const width = this.container.clientWidth || this.config.width;
    const height = this.container.clientHeight || this.config.height;

    this.svg
      .attr('viewBox', `0 0 ${width} ${height}`);
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.svg) {
      this.svg.remove();
    }
    if (this.tooltip) {
      this.tooltip.remove();
    }
    this.svg = null;
    this.g = null;
    this.dataset = null;
    this.tooltip = null;
  }
}
