const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Client Supabase (usa SERVICE_ROLE KEY dal backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔹 GET poster pubblici con voti (ORDINATI)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posters')
      .select('id, file, description, votes')
      .order('votes', { ascending: false });

    if (error) {
      console.error('SUPABASE GET ERROR:', error);
      return res.status(500).json({ error: 'Errore lettura poster' });
    }

    res.json(data);
  } catch (err) {
    console.error('SERVER GET ERROR:', err);
    res.status(500).json({ error: 'Errore server' });
  }
});

// 🔹 POST voto (RPC sicura)
router.post('/:id', async (req, res) => {
  try {
    const posterId = Number(req.params.id);

    if (isNaN(posterId)) {
      return res.status(400).json({ error: 'ID non valido' });
    }

    const { error } = await supabase.rpc('increment_votes', {
      poster_id: posterId
    });

    if (error) {
      console.error('SUPABASE RPC ERROR:', error);
      return res.status(500).json({ error: 'Errore voto' });
    }

    res.json({ message: 'Voto registrato' });
  } catch (err) {
    console.error('SERVER POST ERROR:', err);
    res.status(500).json({ error: 'Errore server' });
  }
});

module.exports = router;
