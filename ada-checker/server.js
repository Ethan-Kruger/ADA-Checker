const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const runChecks = require('./src/checker');

const app = express();
const PORT = 3000;

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/check', (req, res) => {
  const { html } = req.body;
  if (!html) {
    return res.status(400).json({ error: 'html is required' });
  }
  const results = runChecks(html);
  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
