const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

router.post('/', async (req, res) => {
  const { username, password } = req.body;

  // Cerco l’utente nel db
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) {
    return res.status(404).json({ message: 'Utente non trovato' });
  }

  // Controllo password semplice (NO hashing)
  if (data.password !== password) {
    return res.status(401).json({ message: 'Password errata' });
  }

  // Genero token
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

  res.json({ token });
});

module.exports = router;
