'use strict';

/**
 * Global requirements d3 and jQuery ($). Deliberately not required here :-)
 */

const d3 = require('d3');
const nunjucks = require('./helpers/nunjucks');
const BarChart = require('./helpers/d3bar');
const LineChart = require('./helpers/d3line');
const logger = require('./helpers/logger');

let barChart;
let lineChart;

const formatCurrency = v => v.toLocaleString('en-US' || navigator.language, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const updateMonthLine = (data, selection, view, industry) => {
  if (!industry) return false;

  selection += view;

  let valueFieldSelector;
  switch (selection) {
    case 'storeRevenue':
      valueFieldSelector = 'revenue';
      lineChart.yName = 'Total Revenue (USD)';
      break;
    case 'storeRevenueMedian':
      valueFieldSelector = 'revenueMedian';
      lineChart.yName = 'Median Revenue (USD)';
      break;
    case 'storeVolume':
      valueFieldSelector = 'volume';
      lineChart.yName = 'Total Orders';
      break;
    case 'storeVolumeMedian':
      valueFieldSelector = 'volumeMedian';
      lineChart.yName = 'Median Orders';
      break;
    default:
      return false;
  }

  data = data.industries
    .filter(i => i.name === industry)
    .map(i => i.days.map(d => ({ x: new Date(d.timestamp), y: d[valueFieldSelector] })));

  lineChart.update(data);

  return true;
};

const setupMonthLine = data => {
  lineChart = new LineChart('#line-container svg', {
    markers: {
      show: false
    },
    margin: {
      left: 70
    }
  });

  let dataSelection;
  let dataView;
  let dataIndustry;

  const update = () => {
    $('#line-container').show();
    if (!updateMonthLine(data, dataSelection, dataView, dataIndustry)) {
      $('#line-container').hide();
    }
  };

  $('#controls').on('selection.update', (e, selection, view) => {
    dataSelection = selection;
    dataView = view;
    update();
  });

  // It's assumed bar chart has been initialized at this point so we can start
  // listening to events immediately.
  barChart.on('bar.click', (e, d) => {
    dataIndustry = d.label;
    update();
  });
};

const updateIndustryBar = (data, selection, view) => {
  let description = '';

  // Selection is something like "storeRevenue" and view is something like "" or
  // "Median". So the selection will be something like "storeRevenueMedian"
  // after this concatenation.
  selection += view;

  // We almost always want to round the value before displaying it.
  barChart.valueFormatter = (v => Math.round(v).toLocaleString());

  let valueFieldSelector;
  switch (selection) {
    case 'storeRevenue':
      valueFieldSelector = 'revenue';
      barChart.yName = 'Total Revenue (USD)';
      lineChart.yName = 'Total Revenue (USD)';
      description = 'Showing each industry\'s total revenue';
      barChart.valueFormatter = formatCurrency;
      break;
    case 'storeRevenueMedian':
      valueFieldSelector = 'revenueMedian';
      description = 'Showing the revenue of a typical store in the industry (i.e. the median revenue)';
      barChart.yName = 'Median Revenue (USD)';
      lineChart.yName = 'Median Revenue (USD)';
      barChart.valueFormatter = formatCurrency;
      break;
    case 'storeVolume':
      valueFieldSelector = 'volume';
      description = 'Showing each industry\'s total number of orders';
      barChart.yName = 'Total Orders';
      lineChart.yName = 'Total Orders';
      break;
    case 'storeVolumeMedian':
      valueFieldSelector = 'volumeMedian';
      description = 'Showing the number of orders placed for a typical store in the industry (i.e. the median number of orders)';
      barChart.yName = 'Median Orders';
      lineChart.yName = 'Median Orders';
      break;
    case 'storeCount':
    default:
      // The default data is the count of industries.
      valueFieldSelector = 'storeCount';
      barChart.yName = 'Stores';
      description = 'Showing the number of active stores in each industry. A store is "active" if it had at least one order.';
      break;
  }

  data = data.industries
    .map(industry => ({
      label: industry.name,
      value: industry[valueFieldSelector],
    }));

  barChart.update(data);
  $('#data-description').text(description);
};

/**
 * Sets up the pie chart with distribution of stores for each category.
 * @param {*} data - The JSON data
 */
const setupIndustryBar = data => {
  barChart = new BarChart('#bar-container svg', {
    labels: {
      rotate: true
    },
    margin: {
      left: 70,
      bottom: 170
    }
  });

  $('#controls').on('selection.update', (e, selection, view) => {
    updateIndustryBar(data, selection, view);
  });
};

const setupControls = () => {
  let dataSelection;
  let dataView = '';
  const $controls = $('#controls');

  $controls.find('#data-view').on('change', e => {
    dataView = $(e.target).val();
    $controls.trigger('selection.update', [dataSelection, dataView]);
  });

  $controls.find('#data-selection .btn').on('click', e => {
    dataSelection = $(e.target).find('input').val();

    const $dataView = $('#data-view').prop('disabled', dataSelection === 'storeCount');
    if (dataSelection === 'storeCount') {
      // Store count only supports grand total.
      dataView = '';
      $dataView.val('');
    }
    $controls.trigger('selection.update', [dataSelection, dataView]);
  })
  .first()
  .click();
};

/**
 * Sets up the initial "show" button
 * @param {*} data - The JSON data
 */
const setupDistButton = data => {
  const industries = data.industries;
  const industryCount = industries.length;
  const storeCount = d3.sum(industries, i => i.storeCount);
  const storeCountAvg = d3.sum(industries, i => i.storeCount) / industryCount;
  const revenueSum = d3.sum(industries, i => i.revenue);
  const volumeSum = d3.sum(industries, i => i.volume);
  const aov = revenueSum / volumeSum;
  const intro = nunjucks.renderString($('#intro-template').text(), {
    industryCount,
    storeCount,
    storeCountAvg,
    volumeSum,
    revenueSum,
    aov
  });
  $('#intro').html(intro);

  const $btn = $('#show-totals');
  $btn.on('click', () => {
    $btn.fadeOut(200, () => {
      $('#totals-area')
        .show()
        .find('.should-fade')
        .addClass('fade-in');
      setupIndustryBar(data);
      setupMonthLine(data);
      setupControls();
    });
  });

  // TODO: remove this
  $btn.click();
};

const setup = data => {
  setupDistButton(data);
};

const start = () => {
  const url = `${window.DATA_BASE_URL}/storegrader.json`;
  const $loader = $('#loader');
  const $prog = $('#progress');
  d3.json(url)
    .on('progress', (e) => {
      if (e && e.lengthComputable) {
        const prog = Math.round((e.loaded / e.total) * 100);
        $prog.text(`${prog}%`);
      }
    })
    .on('error', e => logger.error(e))
    .on('load', (data) => {
      $loader.hide();
      $('.container').show();
      logger.debug('Data fetched', ...Object.keys(data).map(k => `${k}: ${data[k].length}`));
      setup(data);
    })
    .get();
};

$(document).ready(() => {
  start();
});
