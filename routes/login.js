const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1) Cerca l'utente in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // 2) Verifica password
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Password errata' });
    }

    // 3) Genera token
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });

  } catch (err) {
    return res.status(500).json({ message: 'Errore interno' });
  }
});

module.exports = router;
