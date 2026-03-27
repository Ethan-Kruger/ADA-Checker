const cheerio = require('cheerio');
const checkImages = require('./rules/images');

function runChecks(html) {
  const $ = cheerio.load(html);
  const results = [];

  results.push(...checkImages($));

  return results;
}

module.exports = runChecks;
