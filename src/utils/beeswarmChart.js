import * as d3 from 'd3';
import { getResponsiveChartConfig, globalConfig } from '../config/globalConfig';

/**
 * Beeswarm Chart - Individual Anime Titles with Cross-Platform Comparison
 * Implements Component Contract: init(), update(), resize(), destroy()
 * 
 * Features:
 * - Three separate beeswarm plots (one per platform)
 * - X-axis: Average rating on each platform
 * - Point size: Number of users who rated (vote count)
 * - Interaction: Highlight same anime across all plots on hover
 * - Tooltip: Title, ratings on each platform, vote counts
 */
export class BeeswarmChart {
  constructor(config = {}) {
    this.config = {
      width: config.width || 1600,
      height: config.height || 700,
      margin: config.margin || { top: 40, right: 20, bottom: 80, left: 100 }
    };
    this.container = null;
    this.svg = null;
    this.dataset = null;
    this.rawData = null;
    
    this.platformLabels = {
      mal: 'MyAnimeList',
      imdb: 'IMDb',
      bgm: 'Bangumi'
    };
    
    this.platformKeys = ['mal', 'imdb', 'bgm'];
    this.platformColors = {
      mal: globalConfig.cyberpunkPalette.platform.mal,
      imdb: globalConfig.cyberpunkPalette.platform.imdb,
      bgm: globalConfig.cyberpunkPalette.platform.bgm
    };
    
    this.rScale = null;
    this.xScales = {};
    this.yScale = null;
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
    
    // Filter data: only anime with at least one score, and generate IDs
    this.dataset = rawData
      .map((anime, index) => ({
        ...anime,
        id: anime.id || `anime-${index}`,
        index: index
      }))
      .filter(anime => {
        return anime.mal_score || anime.imdb_score || anime.bgm_score;
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
    this.renderBeeswarms(filteredData);
  }

  /**
   * Setup D3 scales
   */
  setupScales() {
    // Calculate score ranges for each platform
    const malScores = this.dataset
      .filter(d => d.mal_score)
      .map(d => d.mal_score);
    const imdbScores = this.dataset
      .filter(d => d.imdb_score)
      .map(d => d.imdb_score);
    const bgmScores = this.dataset
      .filter(d => d.bgm_score)
      .map(d => d.bgm_score);

    // X scales for each platform (rating)
    this.xScales.mal = d3.scaleLinear()
      .domain([0, 10])
      .range([0, this.innerWidth / 3 - 30]);

    this.xScales.imdb = d3.scaleLinear()
      .domain([0, 10])
      .range([0, this.innerWidth / 3 - 30]);

    this.xScales.bgm = d3.scaleLinear()
      .domain([0, 10])
      .range([0, this.innerWidth / 3 - 30]);

    // Y scale for platforms (only 3 positions)
    this.yScale = d3.scaleBand()
      .domain(['mal', 'imdb', 'bgm'])
      .range([0, this.innerHeight])
      .padding(0.1);

    // Radius scale for vote count
    const maxVotes = Math.max(
      d3.max(malScores.length > 0 ? this.dataset.filter(d => d.mal_votes).map(d => d.mal_votes) : [0]),
      d3.max(imdbScores.length > 0 ? this.dataset.filter(d => d.imdb_votes).map(d => d.imdb_votes) : [0]),
      d3.max(bgmScores.length > 0 ? this.dataset.filter(d => d.bgm_votes).map(d => d.bgm_votes) : [0])
    ) || 1;

    this.rScale = d3.scaleSqrt()
      .domain([0, maxVotes])
      .range([3, 15]);
  }

  /**
   * Update scales based on filtered data (if needed)
   */
  updateScales(dataToRender) {
    // For now, we use the same scales as setupScales
    // This ensures consistent scale across all views
    // If you want scales to change based on filtered data, update this method
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    let tooltip = d3.select(this.container).select('.beeswarm-tooltip');
    if (tooltip.empty()) {
      this.tooltip = d3.select(this.container)
        .append('div')
        .attr('class', 'beeswarm-tooltip')
        .style('position', 'absolute')
        .style('padding', '10px 12px')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('border-radius', '4px')
        .style('font-size', '24px')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('z-index', '1000')
        .style('max-width', '250px')
        .style('line-height', '1.5');
    } else {
      this.tooltip = tooltip;
    }
  }

  /**
   * Render the beeswarm plots with given data
   * @param {Array} dataToRender - the data to render (may be filtered)
   */
  renderBeeswarms(dataToRender = this.dataset) {
    if (!this.g) return;

    // Clear previous content
    this.g.selectAll('.platform-group').remove();
    this.g.selectAll('.axis').remove();
    this.g.selectAll('.platform-label').remove();

    const platforms = ['mal', 'imdb', 'bgm'];
    const plotWidth = this.innerWidth / 3 - 30;

    // Update scales based on the data to render
    this.updateScales(dataToRender);

    platforms.forEach((platform, index) => {
      const xOffset = index * (plotWidth + 30);
      
      // Create group for this platform
      const platformGroup = this.g.append('g')
        .attr('class', 'platform-group')
        .attr('transform', `translate(${xOffset}, 0)`);

      // Get data points for this platform
      const scoreKey = `${platform}_score`;
      const votesKey = `${platform}_votes`;

      const platformData = dataToRender
        .filter(d => d[scoreKey])
        .map(d => ({
          id: d.id,
          title_en: d.title || 'Unknown',
          title_jp: d.title_jp || '',
          score: parseFloat(d[scoreKey]),
          votes: parseInt(d[votesKey]) || 0,
          mal_score: d.mal_score ? parseFloat(d.mal_score) : null,
          imdb_score: d.imdb_score ? parseFloat(d.imdb_score) : null,
          bgm_score: d.bgm_score ? parseFloat(d.bgm_score) : null,
          mal_votes: d.mal_votes ? parseInt(d.mal_votes) : 0,
          imdb_votes: d.imdb_votes ? parseInt(d.imdb_votes) : 0,
          bgm_votes: d.bgm_votes ? parseInt(d.bgm_votes) : 0
        }));

      // Beeswarm simulation
      const simulation = d3.forceSimulation(platformData)
        .force('x', d3.forceX(d => this.xScales[platform](d.score)).strength(0.95))
        .force('y', d3.forceY(this.yScale(platform) + this.yScale.bandwidth() / 2).strength(0.1))
        .force('collide', d3.forceCollide(d => this.rScale(d.votes) + 1))
        .stop();

      // Run simulation
      for (let i = 0; i < 120; i++) {
        simulation.tick();
      }

      // Draw circles (anime points)
      platformGroup.selectAll('circle')
        .data(platformData, d => d.id)
        .join('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => this.rScale(d.votes))
        .attr('fill', this.platformColors[platform])
        .attr('opacity', 0.7)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          this.hoveredAnimeId = d.id;
          this.highlightAnime(d.id);
          this.showTooltip(event, d);
        })
        .on('mousemove', (event) => {
          this.updateTooltipPosition(event);
        })
        .on('mouseleave', () => {
          this.hoveredAnimeId = null;
          this.unhighlightAnime();
          this.hideTooltip();
        });

      // X-axis
      platformGroup.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0, ${this.yScale(platform) + this.yScale.bandwidth() + 20})`)
        .call(d3.axisBottom(this.xScales[platform]))
        .selectAll('text')
        .attr('font-size', 22);

      // X-axis label
      platformGroup.append('text')
        .attr('x', plotWidth / 2)
        .attr('y', this.yScale(platform) + this.yScale.bandwidth() + 50)
        .attr('text-anchor', 'middle')
        .attr('font-size', 24)
        .style('font-weight', 'bold')
        .text('Rating');

      // Platform label
      platformGroup.append('text')
        .attr('class', 'platform-label')
        .attr('x', plotWidth / 2)
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .attr('font-size', 28)
        .style('font-weight', 'bold')
        .style('fill', this.platformColors[platform])
        .text(this.platformLabels[platform]);
    });

    // Y-axis label (single for all)
    this.g.append('text')
      .attr('x', -this.innerHeight / 2)
      .attr('y', -80)
      .attr('text-anchor', 'middle')
      .attr('font-size', 24)
      .style('font-weight', 'bold')
      .attr('transform', 'rotate(-90)')
      .text('Platforms');

    // Legend for bubble size
    this.renderLegend(dataToRender);
  }

  /**
   * Render legend for bubble sizes
   */
  renderLegend(dataToRender = this.dataset) {
    const legendX = this.innerWidth + 20;
    const legendY = -20;

    const legend = this.g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    legend.append('text')
      .attr('font-size', 22)
      .style('font-weight', 'bold')
      .text('Vote Count');

    const sizes = [10000, 50000, 100000];
    const labelsAndSizes = sizes.map(s => ({
      size: s,
      label: `${(s / 1000).toFixed(0)}k`
    })).filter(d => d.size <= d3.max(
      dataToRender.flatMap(a => [a.mal_votes, a.imdb_votes, a.bgm_votes]).filter(v => v)
    ));

    legend.selectAll('circle')
      .data(labelsAndSizes)
      .join('circle')
      .attr('cx', 20)
      .attr('cy', (d, i) => 20 + i * 35)
      .attr('r', d => this.rScale(d.size))
      .attr('fill', '#ccc')
      .attr('opacity', 0.5)
      .attr('stroke', '#999')
      .attr('stroke-width', 1);

    legend.selectAll('text.legend-label')
      .data(labelsAndSizes)
      .join('text')
      .attr('class', 'legend-label')
      .attr('x', 45)
      .attr('y', (d, i) => 25 + i * 35)
      .attr('font-size', 20)
      .style('dominant-baseline', 'middle')
      .text(d => d.label);
  }

  /**
   * Highlight specific anime across all platforms
   */
  highlightAnime(animeId) {
    this.g.selectAll('circle')
      .attr('opacity', d => {
        return d.id === animeId ? 1 : 0.2;
      })
      .attr('stroke-width', d => {
        return d.id === animeId ? 2 : 1;
      })
      .attr('stroke', d => {
        return d.id === animeId ? '#333' : 'white';
      });
  }

  /**
   * Remove highlight
   */
  unhighlightAnime() {
    this.g.selectAll('circle')
      .attr('opacity', 0.7)
      .attr('stroke', 'white')
      .attr('stroke-width', 1);
  }

  /**
   * Show tooltip with anime information
   */
  showTooltip(event, data) {
    const tooltipText = `
      <strong>${data.title_en}</strong>
      ${data.title_jp ? `<br/><em>${data.title_jp}</em>` : ''}
      <br/>
      <strong>Ratings:</strong>
      <br/>MAL: ${data.mal_score ? data.mal_score.toFixed(2) : 'N/A'} (${data.mal_votes ? data.mal_votes.toLocaleString() : 0} votes)
      <br/>IMDb: ${data.imdb_score ? data.imdb_score.toFixed(2) : 'N/A'} (${data.imdb_votes ? data.imdb_votes.toLocaleString() : 0} votes)
      <br/>Bangumi: ${data.bgm_score ? data.bgm_score.toFixed(2) : 'N/A'} (${data.bgm_votes ? data.bgm_votes.toLocaleString() : 0} votes)
    `;

    const containerRect = this.container.getBoundingClientRect();
    this.tooltip
      .style('display', 'block')
      .html(tooltipText);
    
    // Calculate position with boundary detection
    setTimeout(() => {
      const tooltipNode = this.tooltip.node();
      const tooltipRect = tooltipNode.getBoundingClientRect();
      const tooltipWidth = tooltipRect.width;
      const tooltipHeight = tooltipRect.height;
      
      let left = event.clientX - containerRect.left + 20;
      let top = event.clientY - containerRect.top + 55;
      
      // Check right boundary
      if (left + tooltipWidth > containerRect.width) {
        left = event.clientX - containerRect.left - tooltipWidth - 20;
      }
      
      // Check bottom boundary
      if (top + tooltipHeight > containerRect.height) {
        top = event.clientY - containerRect.top - tooltipHeight - 20;
      }
      
      // Ensure minimum values
      left = Math.max(0, left);
      top = Math.max(0, top);
      
      this.tooltip
        .style('left', left + 'px')
        .style('top', top + 'px');
    }, 0);
  }

  /**
   * Update tooltip position
   */
  updateTooltipPosition(event) {
    if (this.tooltip) {
      const containerRect = this.container.getBoundingClientRect();
      const tooltipNode = this.tooltip.node();
      const tooltipRect = tooltipNode.getBoundingClientRect();
      const tooltipWidth = tooltipRect.width;
      const tooltipHeight = tooltipRect.height;
      
      let left = event.clientX - containerRect.left + 60;
      let top = event.clientY - containerRect.top + 85;
      
      // Check right boundary
      if (left + tooltipWidth > containerRect.width) {
        left = event.clientX - containerRect.left - tooltipWidth - 20;
      }
      
      // Check bottom boundary
      if (top + tooltipHeight > containerRect.height) {
        top = event.clientY - containerRect.top - tooltipHeight - 20;
      }
      
      // Ensure minimum values
      left = Math.max(0, left);
      top = Math.max(0, top);
      
      this.tooltip
        .style('left', left + 'px')
        .style('top', top + 'px');
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
    this.renderBeeswarms(filteredDataset);

    // Update highlighting based on highlightTitle
    if (highlightTitle) {
      this.highlightAnime(highlightTitle);
    } else {
      this.unhighlightAnime();
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
   * Handle window resize
   */
  resize() {
    if (!this.svg || !this.container) return;

    // 获取新的窗口宽度，并计算响应式配置
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1600;
    const newConfig = getResponsiveChartConfig(windowWidth);

    // 更新内部配置
    this.config = newConfig;
    
    const width = newConfig.width;
    const height = newConfig.height;
    const margin = newConfig.margin;

    // 更新 SVG 的 viewBox 和尺寸
    this.svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%');

    // 重新计算内部宽度和高度
    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    // 更新 g 元素的位置
    this.g.attr('transform', `translate(${margin.left}, ${margin.top})`);

    // 重新设置 scales
    this.setupScales();

    // 重新渲染图表内容（使用相同的数据）
    const filteredData = this.getFilteredDataset(this.sharedState?.selectedGenre);
    this.renderBeeswarms(filteredData);
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
