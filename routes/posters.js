const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token mancante' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token non valido' });
    req.username = decoded.username;
    next();
  });
}

router.get('/', verifyToken, async (req, res) => {
  const { username } = req;

  const { data, error } = await supabase
    .from('posters')
    .select('*')
    .eq('uploadedBy', username);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
