'use strict';

const d3 = require('d3');
const logger = require('./logger');

/**
 * A minimal base class for with some common functionality such as width and
 * height calculations and resizing.
 */
class Chart {
  constructor(selector, options = {}) {
    this.selector = selector;
    this.svg = d3.select(selector);
    this.dom = $(selector);
    this.tooltip = options.tooltip || d3.select('#tooltip');
    this.resize();
  }

  on(eventName, fun) {
    this.dom.on(eventName, fun);
  }

  trigger(eventName, ...args) {
    this.dom.trigger(eventName, args);
  }

  resize() {
    // Use jquery for width and height fetching.
    [this.width, this.height] = [this.dom.width(), this.dom.height()];
    logger.debug('SVG dimensions', this.width, this.height);
  }
}

module.exports = Chart;
