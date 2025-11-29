
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const token = req.headers.authorization;
    if (!token) return res.status(403).json({ message: 'Token mancante' });

    try {
      jwt.verify(token, SECRET_KEY);
      const { id } = req.query;

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
    } catch {
      res.status(401).json({ message: 'Token non valido' });
    }
  } else {
    res.status(405).json({ message: 'Metodo non consentito' });
  }
}
