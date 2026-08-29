const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = 5000;

connectDB();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hi' });
});

app.use('/api', authRoutes);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
