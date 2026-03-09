import * as d3 from 'd3';

/**
 * Parallel Coordinate Chart - Ranking Divergence Within a Genre
 * Implements Component Contract: init(), update(), resize(), destroy()
 * 
 * Story Point 5: Ranking disagreement among individual titles within a genre
 * 
 * X-dimension: Platforms (MAL, IMDb, Bangumi)
 * Y-axis: Rank positions (1 = top)
 * Each line = one anime title
 * 
 * Pattern interpretation:
 * - Horizontal lines: cross-platform agreement
 * - Steep slopes: strong ranking divergence
 * - Line crossings: community disagreement
 * 
 * Interactions:
 * - Filter by genre
 * - Highlight specific titles
 * - Focus on Top N rankings
 */
export class ParallelCoordinateChart {
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
    this.hoveredTitle = null;
    this.topN = 30; // Default: top 30 rankings
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
    
    // Prepare data with rank information
    this.dataset = rawData
      .map((anime, index) => ({
        ...anime,
        id: anime.id || `anime-${index}`,
        index: index,
        mal_rank_num: anime.mal_rank ? parseInt(anime.mal_rank) : null,
        imdb_rank_num: anime.imdb_rank ? parseInt(anime.imdb_rank) : null,
        bgm_rank_num: anime.bgm_rank ? parseInt(anime.bgm_rank) : null
      }))
      .filter(anime => {
        // Need at least 2 ranks for comparison
        const rankCount = [
          anime.mal_rank_num,
          anime.imdb_rank_num,
          anime.bgm_rank_num
        ].filter(r => r !== null).length;
        return rankCount >= 2;
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
    const filteredData = this.getFilteredDataset(
      sharedState?.selectedGenre,
      sharedState?.topN || this.topN
    );
    this.renderParallelCoordinates(filteredData);
  }

  /**
   * Setup D3 scales
   */
  setupScales() {
    // X scale: 3 platforms
    this.xScale = d3.scalePoint()
      .domain(['mal', 'imdb', 'bgm'])
      .range([0, this.innerWidth])
      .padding(0.1);

    // Y scale: rank (inverted - lower rank = top = higher position)
    // Find max rank to set domain appropriately
    const maxRanks = [
      ...this.dataset.map(d => d.mal_rank_num),
      ...this.dataset.map(d => d.imdb_rank_num),
      ...this.dataset.map(d => d.bgm_rank_num)
    ].filter(r => r !== null);

    const maxRank = maxRanks.length > 0 ? d3.max(maxRanks) : 100;

    this.yScale = d3.scaleLinear()
      .domain([1, maxRank])
      .range([this.innerHeight, 0]);
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    let tooltip = d3.select(this.container).select('.parallel-tooltip');
    if (tooltip.empty()) {
      this.tooltip = d3.select(this.container)
        .append('div')
        .attr('class', 'parallel-tooltip')
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
   * Render parallel coordinate chart
   */
  renderParallelCoordinates(dataToRender = this.dataset) {
    if (!this.g) return;

    // Clear previous content
    this.g.selectAll('.parallel-line').remove();
    this.g.selectAll('.axis').remove();
    this.g.selectAll('.axis-label').remove();

    // Draw lines (one per anime)
    this.g.selectAll('.parallel-line')
      .data(dataToRender, d => d.id)
      .join('path')
      .attr('class', 'parallel-line')
      .attr('d', d => {
        const platforms = ['mal', 'imdb', 'bgm'];
        const points = platforms
          .map((platform, i) => {
            const rankKey = `${platform}_rank_num`;
            const rank = d[rankKey];
            if (rank === null) return null;
            return [this.xScale(platform), this.yScale(rank)];
          })
          .filter(p => p !== null);

        if (points.length < 2) return null;

        // Create a line generator
        const line = d3.line();
        return line(points);
      })
      .attr('stroke', (d, i) => {
        // Color by ranking divergence (variance)
        const ranks = [d.mal_rank_num, d.imdb_rank_num, d.bgm_rank_num]
          .filter(r => r !== null);
        
        if (ranks.length < 2) return '#999';
        
        const mean = ranks.reduce((a, b) => a + b, 0) / ranks.length;
        const variance = ranks.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ranks.length;
        
        // Low variance = green (agreement), high variance = red (disagreement)
        if (variance < 100) return '#10b981';      // green - stable
        if (variance < 500) return '#f59e0b';      // amber - moderate
        return '#ef4444';                          // red - divergent
      })
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.5)
      .attr('fill', 'none')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        this.hoveredTitle = d.id;
        this.highlightLine(d.id);
        this.showTooltip(event, d);
      })
      .on('mousemove', (event) => {
        this.updateTooltipPosition(event);
      })
      .on('mouseleave', () => {
        this.hoveredTitle = null;
        this.unhighlightLine();
        this.hideTooltip();
      });

    // Draw axes for each platform
    const platforms = ['mal', 'imdb', 'bgm'];
    platforms.forEach(platform => {
      const x = this.xScale(platform);

      // Axis line
      this.g.append('line')
        .attr('class', 'axis')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', this.innerHeight)
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 2);

      // Platform label
      this.g.append('text')
        .attr('class', 'axis-label')
        .attr('x', x)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .style('font-weight', 'bold')
        .style('fill', this.platformColors[platform])
        .text(this.platformLabels[platform]);

      // Rank tick marks and labels
      const tickValues = [1, 10, 20, 30, 50, 100];
      this.g.selectAll(`.tick-${platform}`)
        .data(tickValues)
        .join('g')
        .attr('class', `tick-${platform}`)
        .attr('transform', d => `translate(${x}, ${this.yScale(d)})`)
        .each(function(d) {
          if (d === 1) {
            d3.select(this).append('circle')
              .attr('r', 4)
              .attr('fill', '#10b981');
          } else {
            d3.select(this).append('circle')
              .attr('r', 2)
              .attr('fill', '#ccc');
          }
          
          if (d === 1) {
            d3.select(this).append('text')
              .attr('x', -30)
              .attr('y', 4)
              .attr('text-anchor', 'end')
              .attr('font-size', 9)
              .text(d);
          }
        });
    });

    // Y-axis label (Rank)
    this.g.append('text')
      .attr('class', 'axis-label')
      .attr('x', -this.innerHeight / 2)
      .attr('y', -100)
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .style('font-weight', 'bold')
      .attr('transform', 'rotate(-90)')
      .text('Rank Position (1 = Top)');

    // Legend for line colors
    this.renderLegend();
  }

  /**
   * Render legend for ranking divergence colors
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
      .text('Ranking Stability');

    const items = [
      { color: '#10b981', label: 'Stable' },
      { color: '#f59e0b', label: 'Moderate' },
      { color: '#ef4444', label: 'Divergent' }
    ];

    items.forEach((item, i) => {
      legend.append('line')
        .attr('x1', 0)
        .attr('y1', 18 + i * 18)
        .attr('x2', 15)
        .attr('y2', 18 + i * 18)
        .attr('stroke', item.color)
        .attr('stroke-width', 2);

      legend.append('text')
        .attr('x', 20)
        .attr('y', 22 + i * 18)
        .attr('font-size', 10)
        .text(item.label);
    });
  }

  /**
   * Highlight specific line
   */
  highlightLine(animeId) {
    this.g.selectAll('.parallel-line')
      .attr('opacity', d => {
        return d.id === animeId ? 1 : 0.1;
      })
      .attr('stroke-width', d => {
        return d.id === animeId ? 3 : 1.5;
      });
  }

  /**
   * Remove highlighting
   */
  unhighlightLine() {
    this.g.selectAll('.parallel-line')
      .attr('opacity', 0.5)
      .attr('stroke-width', 1.5);
  }

  /**
   * Show tooltip with title ranking information
   */
  showTooltip(event, data) {
    const title = data.title || data.title_jp || 'Unknown';
    const ranks = [
      { platform: 'MyAnimeList', rank: data.mal_rank_num },
      { platform: 'IMDb', rank: data.imdb_rank_num },
      { platform: 'Bangumi', rank: data.bgm_rank_num }
    ];

    let tooltipText = `<strong>${title}</strong>`;
    
    if (data.title_jp && data.title_jp !== title) {
      tooltipText += `<br/><em>${data.title_jp}</em>`;
    }

    tooltipText += '<br/><strong>Rankings:</strong><br/>';
    
    ranks.forEach(r => {
      if (r.rank !== null) {
        tooltipText += `${r.platform}: #${r.rank}<br/>`;
      }
    });

    // Calculate ranking divergence
    const validRanks = ranks
      .map(r => r.rank)
      .filter(r => r !== null);
    
    if (validRanks.length >= 2) {
      const mean = validRanks.reduce((a, b) => a + b, 0) / validRanks.length;
      const variance = validRanks.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / validRanks.length;
      
      tooltipText += `<br/><strong>Divergence:</strong><br/>`;
      tooltipText += `Variance: ${variance.toFixed(1)}<br/>`;
      
      if (variance < 100) {
        tooltipText += '✓ Stable ranking';
      } else if (variance < 500) {
        tooltipText += '⚠ Moderate difference';
      } else {
        tooltipText += '✕ Strong disagreement';
      }
    }

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
   * Get filtered dataset based on genre and top N
   */
  getFilteredDataset(selectedGenre, topN = this.topN) {
    let filtered = this.dataset;

    // Filter by genre if specified
    if (selectedGenre) {
      filtered = filtered.filter(anime => {
        if (!anime.genre) return false;
        const genres = anime.genre.split('|').map(g => g.trim());
        return genres.includes(selectedGenre);
      });
    }

    // Filter by top N rankings
    if (topN && topN > 0) {
      filtered = filtered.filter(anime => {
        const ranks = [anime.mal_rank_num, anime.imdb_rank_num, anime.bgm_rank_num]
          .filter(r => r !== null);
        // Keep anime if any rank is within top N
        return ranks.some(r => r <= topN);
      });
    }

    return filtered;
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
    const topN = stepState?.topN || sharedState?.topN || this.topN;
    const highlightTitle = sharedState?.highlightTitle;

    // Update dataset filtering
    const filteredDataset = this.getFilteredDataset(selectedGenre, topN);

    // Re-render with filtered data
    this.renderParallelCoordinates(filteredDataset);

    // Update highlighting
    if (highlightTitle) {
      this.highlightLine(highlightTitle);
    } else {
      this.unhighlightLine();
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
