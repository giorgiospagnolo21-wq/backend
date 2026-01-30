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

// Estrae il path dell'oggetto storage dall'URL pubblico di Supabase
// Esempio URL:
// https://xxxx.supabase.co/storage/v1/object/public/posters/posters/NOMEFILE.jpg
// -> ritorna "posters/NOMEFILE.jpg"
function extractObjectPathFromPublicUrl(publicUrl) {
  try {
    const u = new URL(publicUrl);
    const marker = '/storage/v1/object/public/posters/';
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return u.pathname.slice(idx + marker.length); // es: "posters/FILE"
  } catch {
    return null;
  }
}

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Prendo il poster
    const { data: posterData, error: fetchError } = await supabase
      .from('posters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !posterData) {
      return res.status(404).json({ message: 'Poster non trovato' });
    }

    // (Opzionale) Se vuoi impedire di eliminare poster di altri:
    // if (posterData.uploadedBy !== req.username) {
    //   return res.status(403).json({ message: 'Non puoi eliminare questo poster' });
    // }

    // 2) Cancello la riga dal DB
    const { error: delError } = await supabase
      .from('posters')
      .delete()
      .eq('id', id);

    if (delError) {
      return res.status(500).json({ message: delError.message });
    }

    // 3) Cancello il file su Storage (se riesco a ricavare il path)
    const objectPath = extractObjectPathFromPublicUrl(posterData.file);

    if (objectPath) {
      const { error: storageError } = await supabase.storage
        .from('posters')
        .remove([objectPath]); // IMPORTANTISSIMO: NON aggiungere "posters/" davanti

      // Se lo storage fallisce, non blocco: il DB è già pulito
      if (storageError) {
        console.error('Storage remove error:', storageError);
      }
    } else {
      console.warn('Impossibile estrarre objectPath da URL:', posterData.file);
    }

    return res.json({ message: 'Poster eliminato con successo' });
  } catch (err) {
    console.error('DELETE ERROR:', err);
    return res.status(500).json({ message: 'Errore interno eliminazione' });
  }
});

module.exports = router;
