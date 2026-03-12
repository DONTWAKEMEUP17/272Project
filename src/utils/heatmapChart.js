import * as d3 from 'd3';
import { getContainerResponsiveChartConfig, globalConfig } from '../config/globalConfig';

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

    this.config = getContainerResponsiveChartConfig(container?.clientWidth, container?.clientHeight);

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
      .padding(0.3);

    this.colorScale = d3.scaleLinear()
      .domain([0, 50, 100])
      .range([globalConfig.cyberpunkPalette.heatmap.low, globalConfig.cyberpunkPalette.heatmap.mid, globalConfig.cyberpunkPalette.heatmap.high])
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

    // 支持单个流派或多个流派数组
    const genresToHighlight = Array.isArray(highlightGenre) ? highlightGenre : (highlightGenre ? [highlightGenre] : []);

    // Update rect colors and emphasis based on highlight
    this.g.selectAll('rect.heatmap-cell')
      .attr('opacity', d => {
        if (genresToHighlight.length === 0) return 1;
        return genresToHighlight.includes(d.genre) ? 1 : 0.3;
      })
      .attr('stroke-width', d => {
        return genresToHighlight.includes(d.genre) ? 2 : 1;
      })
      .attr('stroke', d => {
        return genresToHighlight.includes(d.genre) ? '#000' : '#fff';
      });
  }

  /**
   * Recalculate layout on window resize
   */
  resize() {
    if (!this.svg || !this.container) return;

    // 基于实际容器尺寸进行响应式计算（兼容分屏场景）
    const newConfig = getContainerResponsiveChartConfig(this.container?.clientWidth, this.container?.clientHeight);

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
    this.xScale = d3.scaleBand()
      .domain(this.genres)
      .range([0, this.innerWidth])
      .padding(0.05);

    this.yScale = d3.scaleBand()
      .domain(this.platforms)
      .range([0, this.innerHeight])
      .padding(0.05);

    // 重新渲染图表内容（使用相同的数据）
    this.render();
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
        .style('font-size', '24px')
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
          .html(tooltipText.replace(/\n/g, '<br/>'));
        
        // Calculate tooltip position with boundary detection
        setTimeout(() => {
          const tooltipNode = tooltip.node();
          const tooltipRect = tooltipNode.getBoundingClientRect();
          const tooltipWidth = tooltipRect.width;
          const tooltipHeight = tooltipRect.height;
          
          let left = event.clientX - containerRect.left + 10;
          let top = event.clientY - containerRect.top + 10;
          
          // Check right boundary
          if (left + tooltipWidth > containerRect.width) {
            left = event.clientX - containerRect.left - tooltipWidth - 10;
          }
          
          // Check bottom boundary
          if (top + tooltipHeight > containerRect.height) {
            top = event.clientY - containerRect.top - tooltipHeight - 10;
          }
          
          // Ensure minimum values
          left = Math.max(0, left);
          top = Math.max(0, top);
          
          tooltip
            .style('left', left + 'px')
            .style('top', top + 'px');
        }, 0);
      })
      .on('mousemove', (event) => {
        // Update tooltip position with boundary detection
        const containerRect = this.container.getBoundingClientRect();
        const tooltipNode = tooltip.node();
        const tooltipRect = tooltipNode.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width;
        const tooltipHeight = tooltipRect.height;
        
        let left = event.clientX - containerRect.left + 10;
        let top = event.clientY - containerRect.top + 10;
        
        // Check right boundary
        if (left + tooltipWidth > containerRect.width) {
          left = event.clientX - containerRect.left - tooltipWidth - 10;
        }
        
        // Check bottom boundary
        if (top + tooltipHeight > containerRect.height) {
          top = event.clientY - containerRect.top - tooltipHeight - 10;
        }
        
        // Ensure minimum values
        left = Math.max(0, left);
        top = Math.max(0, top);
        
        tooltip
          .style('left', left + 'px')
          .style('top', top + 'px');
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
      .attr('font-size', 24)
      .attr('fill', '#000')
      .attr('transform', 'rotate(-60)')
      .style('text-anchor', 'end')
      .style('dominant-baseline', 'middle');

    // Y-axis (Platform)
    this.g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale))
      .selectAll('text')
      .attr('font-size', 26)
      .attr('fill', '#000');

    // Color legend - horizontal layout at top
    const legendHeight = 50;
    const legendData = d3.range(0, 101, 10);
    const legendRectSize = 20;
    const legendSpacing = 8;
    const totalLegendWidth = legendData.length * (legendRectSize + legendSpacing) + 40;
    const legendX = (this.innerWidth - totalLegendWidth) / 2;

    const legend = this.g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, ${-legendHeight})`);

    // Legend background
    legend.append('rect')
      .attr('x', -10)
      .attr('y', -15)
      .attr('width', totalLegendWidth + 20)
      .attr('height', 90)
      .attr('fill', 'rgba(13, 10, 37, 0.6)')
      .attr('stroke', '#00D9FF')
      .attr('stroke-width', 1)
      .attr('rx', 5);

    // Legend title - positioned above color boxes
    legend.append('text')
      .attr('x', 10)
      .attr('y', 0)
      .attr('font-size', 18)
      .attr('font-weight', 'bold')
      .attr('fill', '#e0e0ff')
      .text('Percentile:');

    // Legend color boxes and labels
    const legendItems = legend.selectAll('g.legend-item')
      .data(legendData)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${10 + i * (legendRectSize + legendSpacing)}, 10)`);

    legendItems.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('fill', d => this.colorScale(d))
      .attr('stroke', '#1a2050')
      .attr('stroke-width', 1);

    legendItems.append('text')
      .attr('x', legendRectSize / 2)
      .attr('y', legendRectSize + 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', 22)
      .attr('fill', '#a0a0ff')
      .text(d => d);
  }
}
