const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'Token mancante' });

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token non valido' });
    req.username = decoded.username;
    next();
  });
}

router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  const { data: poster, error } = await supabase
    .from('posters')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !poster) return res.status(404).json({ message: 'Poster non trovato' });

  await supabase.from('posters').delete().eq('id', id);

  const url = new URL(poster.file);
  const marker = '/storage/v1/object/public/posters/';
  const idx = url.pathname.indexOf(marker);
  if (idx !== -1) {
    const objectPath = url.pathname.slice(idx + marker.length);
    await supabase.storage.from('posters').remove([objectPath]);
  }

  res.json({ message: 'Poster eliminato' });
});

module.exports = router;
