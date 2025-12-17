const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔹 GET poster pubblici + voti
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('posters')
    .select('id, file, description, votes')
    .order('votes', { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

// 🔹 VOTA
router.post('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('posters')
    .update({ votes: supabase.rpc('increment', { x: 1 }) })
    .eq('id', id);

  if (error) return res.status(500).json(error);
  res.json({ message: 'Voto registrato' });
});

module.exports = router;
