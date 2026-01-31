const express = require('express');
const cors = require('cors');

const loginRoute = require('./routes/login');
const uploadRoute = require('./routes/upload');
const postersRoute = require('./routes/posters');
const deleteRoute = require('./routes/delete');
const voteRoute = require('./routes/vote');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.options('*', cors());
app.use(express.json());

app.use('/api/login', loginRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/posters', postersRoute);
app.use('/api/delete', deleteRoute);
app.use('/api/vote', voteRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server avviato su porta", PORT));
