const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔹 GET poster pubblici + voti
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posters')
      .select('id, file, description, votes')
      .order('votes', { ascending: false });

    if (error) return res.status(500).json(error);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔹 VOTA (RPC DEFINITIVA)
router.post('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { error } = await supabase.rpc('increment_votes', {
      poster_id: id
    });

    if (error) {
      console.error('SUPABASE ERROR:', error);
      return res.status(500).json(error);
    }

    res.json({ message: 'Voto registrato' });
  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
