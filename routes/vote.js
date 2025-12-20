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

    if (error) {
      console.error('GET ERROR:', error);
      return res.status(500).json(error);
    }

    res.json(data);
  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔹 VOTA (SENZA RPC – FUNZIONA SICURO)
router.post('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    // 1️⃣ prendo i voti attuali
    const { data, error: selectError } = await supabase
      .from('posters')
      .select('votes')
      .eq('id', id)
      .single();

    if (selectError) {
      console.error('SELECT ERROR:', selectError);
      return res.status(500).json(selectError);
    }

    const currentVotes = data.votes ?? 0;

    // 2️⃣ aggiorno i voti
    const { error: updateError } = await supabase
      .from('posters')
      .update({ votes: currentVotes + 1 })
      .eq('id', id);

    if (updateError) {
      console.error('UPDATE ERROR:', updateError);
      return res.status(500).json(updateError);
    }

    res.json({ message: 'Voto registrato' });
  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
