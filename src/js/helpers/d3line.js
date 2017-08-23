'use strict';

const d3 = require('d3');
const logger = require('./logger');
const Chart = require('./d3chart');

class LineChart extends Chart {
  constructor(selector, options = {}) {
    super(selector);

    this.margin = Object.assign({
      top: 30, right: 20, bottom: 30, left: 40
    }, options.margin || {});

    this.markers = Object.assign({
      show: true
    }, options.markers || {});

    this.valueFormatter = options.valueFormatter || (v => (v || 0).toLocaleString());
    this.updateDuration = 400;
    this.title = options.title || '';

    this.chartContainer = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Prepare the axes containers so they can be selected during the data update.
    this.xAxisContainer = this.chartContainer.append('g')
      .classed('axis axis-x', true);
    this.yAxisContainer = this.chartContainer.append('g')
      .classed('axis axis-y', true);
    this.yAxisNameContainer = this.chartContainer.append('text')
      .classed('axis-y-name', true);
    this.titleContainer = this.chartContainer.append('text')
      .classed('chart-title', true);
    this.lineContainer = this.chartContainer.append('g')
      .classed('lines', true);
  }

  update(data) {
    this.resize();

    const chartHeight = this.height - this.margin.top - this.margin.bottom;
    const chartWidth = this.width - this.margin.left - this.margin.right;

    const allX = data.reduce((a, series) => a.concat(series.map(d => d.x)), []);
    const allY = data.reduce((a, series) => a.concat(series.map(d => d.y)), []);

    const x = d3.scaleTime()
      .rangeRound([0, chartWidth])
      .domain(d3.extent(allX));

    // The y scale should always start at 0 to avoid confusion. To make sure the
    // line is as "centered" as possible, extra space is added to the maximum
    // y-value corresponding to the space below the graph, which is essentially
    // the minimum y-value.
    const minY = d3.min(allY);
    let maxY = d3.max(allY);
    if (minY > 0) {
      maxY += minY;
    }
    const y = d3.scaleLinear()
      .rangeRound([chartHeight, 0])
      .domain([0, maxY]);

    const lineGen = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y))
      .curve(d3.curveMonotoneX);

    logger.debug('Line domain', x.domain(), y.domain());

    // Prepare the axes.
    // TODO: make this configurable.
    const ticks = d3.utcDay;
    const tickFormat = d3.timeFormat('%d');
    this.xAxisContainer
      .attr('transform', `translate(0, ${chartHeight})`)
      .transition('line-x-axis')
      .duration(this.updateDuration)
      .call(d3.axisBottom(x).ticks(ticks).tickFormat(tickFormat));

    this.yAxisContainer
      .transition('line-y-axis')
      .duration(this.updateDuration)
      .call(d3.axisLeft(y));
    this.yAxisNameContainer
      .attr('y', -(this.margin.top / 2))
      .attr('text-anchor', 'middle')
      .attr('opacity', 0)
      .text(this.yName)
      .transition('line-y-name')
      .delay(this.updateDuration + 50) // Allow the yaxis to be fully animated.
      .duration(this.updateDuration)
      .attr('opacity', 1);

    this.titleContainer
      .attr('x', chartWidth / 2)
      .attr('y', -(this.margin.top / 2))
      .attr('text-anchor', 'middle')
      .attr('opacity', 0)
      .text(this.title)
      .transition('line-title')
      .delay(this.updateDuration + 50) // Allow the yaxis to be fully animated.
      .duration(this.updateDuration)
      .attr('opacity', 1);

    // Create and remove line containers as necessary.
    const series = this.lineContainer.selectAll('g')
      .data(data);
    const seriesEnter = series.enter().append('g');
    series.exit().remove();
    const seriesMerged = series.merge(seriesEnter);

    // Create the actual lines to draw, one for each series
    const pathsUpdate = seriesMerged.selectAll('path')
      .data(d => [d]);
    const pathsEnter = pathsUpdate.enter();
    pathsEnter.append('path')
      .classed('line', true)
      .attr('stroke-dasharray', `${chartWidth} ${chartWidth}`)
      .attr('stroke-dashoffset', chartWidth)
      .attr('d', d => lineGen(d))
      .transition('line-path-enter')
      .duration(this.updateDuration)
      .attr('stroke-dashoffset', 0);

    pathsUpdate
      .transition('line-path-update')
      .duration(this.updateDuration)
      .attr('d', d => lineGen(d));

    if (this.markers.show) {
      // Create circles as markers for the data points.
      const pointsUpdate = seriesMerged.selectAll('circle')
        .data(d => d);
      const pointsEnter = pointsUpdate.enter();
      pointsEnter.append('circle')
        .classed('point', true)
        .attr('r', 3)
        .attr('cx', d => x(d.x))
        .attr('cy', d => y(d.y));
    }

    //const paths = pathsEnter.merge(pathsUpdate);

    // Create new dots
    //const dotsEnter = dotsUpdate.enter().append('g')
    //  .classed('dot', true);
    // barsEnter.append('rect')
    //   .attr('x', d => x(this.label(d)))
    //   .attr('y', chartHeight)
    //   .attr('width', x.bandwidth())
    //   .attr('height', 0);

    // // Existing bars and new bars merged.
    // const barsMerged = barsEnter.merge(barsUpdate);

    // // Now animate to the new heigh and location of the top.
    // barsMerged
    //   .selectAll('rect')
    //   .transition('bar-height')
    //   .duration(400)
    //   .attr('height', d => chartHeight - y(this.value(d)))
    //   .attr('y', d => y(this.value(d)));
  }
}

module.exports = LineChart;
