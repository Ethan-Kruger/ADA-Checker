function checkImages($) {
  const issues = [];

  $('img:not([alt])').each((i, el) => {
    issues.push({
      severity: 'critical',
      message: 'Image is missing an alt attribute',
      element: $.html(el),
      remediation: 'Add a descriptive alt attribute to the <img> element, e.g. alt="Description of image". For decorative images use alt="".'
    });
  });

  return issues;
}

module.exports = checkImages;
