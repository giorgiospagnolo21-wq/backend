    const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const cors = require('cors');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes corrette
app.use('/api/login', require('./routes/login'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/delete', require('./routes/delete'));
app.use('/api/posters', require('./routes/posters'));
app.use('/api/vote', require('./routes/vote'));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server attivo su http://localhost:${PORT}`));
