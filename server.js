const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes corrette
app.use('/api/login', require('./routes/login'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/delete', require('./routes/delete'));
app.use('/api/posters', require('./routes/posters'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server attivo su http://localhost:${PORT}`));
