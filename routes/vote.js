const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('posters')
    .select('id,file,title,description,votes')
    .order('votes', { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

router.post('/:id', async (req, res) => {
  const id = Number(req.params.id);

  const { data, error } = await supabase.rpc('increment_votes', {
    p_poster_id: id
  });

  if (error) return res.status(500).json(error);
  res.json({ message: 'Voto registrato' });
});

module.exports = router;
