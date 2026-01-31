const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

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

router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  const { data: posterData, error: fetchError } = await supabase
    .from('posters')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !posterData) return res.status(404).json({ message: 'Poster non trovato' });

  await supabase.from('posters').delete().eq('id', id);

  const filePath = posterData.file.split('/posters/')[1];
  await supabase.storage.from('posters').remove([`posters/${filePath}`]);

  res.json({ message: 'Poster eliminato con successo' });
});

module.exports = router;
