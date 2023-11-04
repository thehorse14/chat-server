const express = require('express');
const cors = require('cors');

const app = express();
const port = 3002;
const users = require('./routes/api/users');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express on Vercel');
});

app.use('/api/users', users);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
