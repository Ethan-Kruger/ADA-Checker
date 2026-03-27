const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(helmet());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
