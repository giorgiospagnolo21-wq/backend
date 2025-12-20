const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 🔹 CORS (PRIMA DI QUALSIASI ROUTE)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

// 🔹 Body parser
app.use(express.json());

// 🔹 Routes
app.use('/api/login', require('./routes/login'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/delete', require('./routes/delete'));
app.use('/api/posters', require('./routes/posters'));
app.use('/api/vote', require('./routes/vote'));

// 🔹 Health check (FONDAMENTALE PER RENDER)
app.get('/', (req, res) => {
  res.send('Backend running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`);
});
