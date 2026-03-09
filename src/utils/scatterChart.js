import * as d3 from 'd3';

/**
 * Scatter Chart - Rating Stability and Popularity Analysis
 * Implements Component Contract: init(), update(), resize(), destroy()
 * 
 * Story Point 3: Transition from beeswarm to scatter
 * X-axis: Total vote count (popularity)
 * Y-axis: Average rating
 * Bubble size: Score variance (rating stability - larger = more stable)
 * 
 * Reveals relationships:
 * - Do highly rated anime receive more votes?
 * - Do niche anime show greater rating variance?
 * - Are disagreements more common among less popular titles?
 */
export class ScatterChart {
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
    
    this.xScale = null;
    this.yScale = null;
    this.sizeScale = null;
    this.colorScale = null;
    this.tooltip = null;
    this.hoveredAnimeId = null;
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
    
    // Enrich data with computed fields
    const enrichedData = rawData.map((anime, index) => {
      const scores = [
        anime.mal_score ? parseFloat(anime.mal_score) : null,
        anime.imdb_score ? parseFloat(anime.imdb_score) : null,
        anime.bgm_score ? parseFloat(anime.bgm_score) : null
      ].filter(s => s !== null);
      
      const votes = [
        anime.mal_votes ? parseInt(anime.mal_votes) : 0,
        anime.imdb_votes ? parseInt(anime.imdb_votes) : 0,
        anime.bgm_votes ? parseInt(anime.bgm_votes) : 0
      ];
      
      // Calculate average score across available platforms
      const avgScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : null;
      
      // Calculate total votes
      const totalVotes = votes.reduce((a, b) => a + b, 0);
      
      // Calculate score variance (measure of disagreement)
      let variance = 0;
      if (scores.length > 1) {
        const mean = avgScore;
        variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      }
      
      return {
        ...anime,
        id: anime.id || `anime-${index}`,
        index: index,
        avg_score_across_platforms: avgScore,
        vote_total: totalVotes,
        score_variance: variance
      };
    });
    
    // Filter data: only anime with complete data for scatter
    this.dataset = enrichedData
      .filter(anime => {
        return anime.avg_score_across_platforms && anime.vote_total > 0;
      });

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

    // Setup scales
    this.setupScales();
    
    // Create tooltip
    this.createTooltip();
    
    // Render
    const filteredData = this.getFilteredDataset(sharedState?.selectedGenre);
    this.renderScatter(filteredData);
  }

  /**
   * Setup D3 scales for scatter plot
   */
  setupScales() {
    // X scale: vote count (popularity) - log scale for better distribution
    const votes = this.dataset
      .map(d => parseInt(d.vote_total) || 1)
      .filter(v => v > 0);
    
    const minVotes = votes.length > 0 ? d3.min(votes) : 1;
    const maxVotes = votes.length > 0 ? d3.max(votes) : 100000;
    
    this.xScale = d3.scaleLog()
      .domain([Math.max(1, minVotes), Math.max(minVotes + 1, maxVotes)])
      .range([0, this.innerWidth]);

    // Y scale: average rating
    this.yScale = d3.scaleLinear()
      .domain([4, 10]) // Most anime are between 4-10 range
      .range([this.innerHeight, 0])
      .nice();

    // Size scale: score variance (represents rating stability)
    const variances = this.dataset
      .map(d => parseFloat(d.score_variance) || 0)
      .filter(v => v >= 0);
    
    const maxVariance = variances.length > 0 ? d3.max(variances) : 1;
    
    this.sizeScale = d3.scaleSqrt()
      .domain([0, maxVariance])
      .range([15, 3])  // Inverted: low variance = large bubble
      .clamp(true);

    // Color scale: variance (red = unstable, green = stable)
    this.colorScale = d3.scaleLinear()
      .domain([0, maxVariance / 2, maxVariance])
      .range(['#22c55e', '#fbbf24', '#ef4444'])  // green -> yellow -> red
      .clamp(true);
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    let tooltip = d3.select(this.container).select('.scatter-tooltip');
    if (tooltip.empty()) {
      this.tooltip = d3.select(this.container)
        .append('div')
        .attr('class', 'scatter-tooltip')
        .style('position', 'absolute')
        .style('padding', '10px 12px')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('z-index', '1000')
        .style('max-width', '280px')
        .style('line-height', '1.5');
    } else {
      this.tooltip = tooltip;
    }
  }

  /**
   * Render scatter plot
   */
  renderScatter(dataToRender = this.dataset) {
    if (!this.g) return;

    // Clear previous content
    this.g.selectAll('.scatter-point').remove();
    this.g.selectAll('.axis').remove();
    this.g.selectAll('.axis-label').remove();
    this.g.selectAll('.legend').remove();

    // Draw points (circles)
    this.g.selectAll('.scatter-point')
      .data(dataToRender, d => d.id)
      .join('circle')
      .attr('class', 'scatter-point')
      .attr('cx', d => {
        const votes = parseInt(d.vote_total) || 1;
        return this.xScale(Math.max(1, votes));
      })
      .attr('cy', d => {
        const score = parseFloat(d.avg_score_across_platforms);
        return this.yScale(score);
      })
      .attr('r', d => {
        const variance = parseFloat(d.score_variance) || 0;
        return this.sizeScale(variance);
      })
      .attr('fill', d => {
        const variance = parseFloat(d.score_variance) || 0;
        return this.colorScale(variance);
      })
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        this.hoveredAnimeId = d.id;
        this.highlightPoint(d.id);
        this.showTooltip(event, d);
      })
      .on('mousemove', (event) => {
        this.updateTooltipPosition(event);
      })
      .on('mouseleave', () => {
        this.hoveredAnimeId = null;
        this.unhighlightPoint();
        this.hideTooltip();
      });

    // X-axis (Vote count)
    this.g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0, ${this.innerHeight})`)
      .call(d3.axisBottom(this.xScale)
        .tickFormat(d => {
          if (d >= 1000000) return `${(d / 1000000).toFixed(0)}M`;
          if (d >= 1000) return `${(d / 1000).toFixed(0)}K`;
          return d;
        }))
      .selectAll('text')
      .attr('font-size', 11);

    // X-axis label
    this.g.append('text')
      .attr('class', 'axis-label')
      .attr('x', this.innerWidth / 2)
      .attr('y', this.innerHeight + 60)
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .style('font-weight', 'bold')
      .text('Total Vote Count (Popularity)');

    // Y-axis (Average rating)
    this.g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(this.yScale).ticks(5))
      .selectAll('text')
      .attr('font-size', 11);

    // Y-axis label
    this.g.append('text')
      .attr('class', 'axis-label')
      .attr('x', -this.innerHeight / 2)
      .attr('y', -100)
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .style('font-weight', 'bold')
      .attr('transform', 'rotate(-90)')
      .text('Average Rating');

    // Legend for bubble size and color
    this.renderLegend();
  }

  /**
   * Render legend explaining bubble size and color
   */
  renderLegend() {
    const legendX = this.innerWidth - 180;
    const legendY = -20;

    const legend = this.g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Title
    legend.append('text')
      .attr('font-size', 11)
      .style('font-weight', 'bold')
      .text('Rating Stability');

    // Color legend
    legend.append('text')
      .attr('font-size', 10)
      .attr('y', 18)
      .text('Variance:');

    const colors = ['#22c55e', '#fbbf24', '#ef4444'];
    const labels = ['Stable', 'Moderate', 'Unstable'];

    colors.forEach((color, i) => {
      legend.append('rect')
        .attr('x', 0)
        .attr('y', 25 + i * 18)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', color)
        .attr('opacity', 0.7);

      legend.append('text')
        .attr('x', 18)
        .attr('y', 30 + i * 18)
        .attr('font-size', 10)
        .attr('dominant-baseline', 'middle')
        .text(labels[i]);
    });
  }

  /**
   * Highlight specific anime point
   */
  highlightPoint(animeId) {
    this.g.selectAll('.scatter-point')
      .attr('opacity', d => {
        return d.id === animeId ? 1 : 0.3;
      })
      .attr('stroke-width', d => {
        return d.id === animeId ? 3 : 1.5;
      })
      .attr('stroke', d => {
        return d.id === animeId ? '#333' : '#fff';
      });
  }

  /**
   * Remove highlight
   */
  unhighlightPoint() {
    this.g.selectAll('.scatter-point')
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
  }

  /**
   * Show tooltip with anime information
   */
  showTooltip(event, data) {
    const avgScore = parseFloat(data.avg_score_across_platforms) || 'N/A';
    const variance = parseFloat(data.score_variance) || 0;
    const totalVotes = parseInt(data.vote_total) || 0;
    const title = data.title || data.title_jp || 'Unknown';

    const tooltipText = `
      <strong>${title}</strong>
      ${data.title_jp && data.title_jp !== title ? `<br/><em>${data.title_jp}</em>` : ''}
      <br/>
      <strong>Avg Rating:</strong> ${typeof avgScore === 'number' ? avgScore.toFixed(2) : avgScore}
      <br/>
      <strong>Total Votes:</strong> ${totalVotes.toLocaleString()}
      <br/>
      <strong>Rating Variance:</strong> ${variance.toFixed(3)}
      <br/>
      <span style="font-size: 11px; opacity: 0.8;">
        ${variance < 0.5 ? '✓ Stable' : variance < 1.5 ? '⚠ Moderate' : '✕ Unstable'}
      </span>
    `;

    this.tooltip
      .style('display', 'block')
      .html(tooltipText)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY + 10) + 'px');
  }

  /**
   * Update tooltip position
   */
  updateTooltipPosition(event) {
    if (this.tooltip) {
      this.tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px');
    }
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
   * Get filtered dataset based on genre
   */
  getFilteredDataset(selectedGenre) {
    if (!selectedGenre) {
      return this.dataset;
    }

    return this.dataset.filter(anime => {
      if (!anime.genre) return false;
      const genres = anime.genre.split('|').map(g => g.trim());
      return genres.includes(selectedGenre);
    });
  }

  /**
   * Update based on step state and shared state
   * @param {Object} stepState - current step configuration
   * @param {Object} sharedState - shared global state
   */
  update(stepState, sharedState) {
    if (!this.g || !this.dataset) return;

    this.sharedState = sharedState || {};
    const selectedGenre = stepState?.selectedGenre || sharedState?.selectedGenre;
    const highlightTitle = sharedState?.highlightTitle;

    // Update dataset filtering based on selected genre
    const filteredDataset = this.getFilteredDataset(selectedGenre);

    // Re-render with filtered data
    this.renderScatter(filteredDataset);

    // Update highlighting based on highlightTitle
    if (highlightTitle) {
      this.highlightPoint(highlightTitle);
    } else {
      this.unhighlightPoint();
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
