const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = 3000;

app.use(helmet());
app.use(morgan('dev'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
