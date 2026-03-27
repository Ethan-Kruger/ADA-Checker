const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const axios = require('axios');
const runChecks = require('./src/checker');

const app = express();
const PORT = 3000;

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/check', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }
  const response = await axios.get(url);
  const results = runChecks(response.data);
  res.json({ url, results });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
