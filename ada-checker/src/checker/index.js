const checkImages = require('./rules/images');

function runChecks($) {
  const results = [];

  results.push(...checkImages($));

  return results;
}

module.exports = runChecks;
