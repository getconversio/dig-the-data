'use strict';

const path = require('path'),
  nunjucks = require('nunjucks');

const env = nunjucks.configure(path.join(__dirname, '..', 'views'), {
  watch: false,
  noCache: true
});

module.exports = env;
