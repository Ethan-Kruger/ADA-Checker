function checkImages($) {
  const issues = [];

  $('img:not([alt])').each(() => {
    issues.push('Found image without alt');
  });

  return issues;
}

module.exports = checkImages;
