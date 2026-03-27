function checkImages($) {
  const issues = [];

  $('img').each((i, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined) {
      issues.push({
        rule: 'images',
        severity: 'error',
        message: 'Image is missing an alt attribute',
        element: $.html(el),
      });
    } else if (alt.trim() === '') {
      issues.push({
        rule: 'images',
        severity: 'warning',
        message: 'Image has an empty alt attribute (acceptable only for decorative images)',
        element: $.html(el),
      });
    }
  });

  return issues;
}

module.exports = checkImages;
