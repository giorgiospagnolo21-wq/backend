
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const token = req.headers.authorization;
    if (!token) return res.status(403).json({ message: 'Token mancante' });

    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, files) => {
        if (err) return res.status(400).json({ error: 'Errore parsing form' });

        const file = files.poster;
        const description = fields.description;
        const fileBuffer = fs.readFileSync(file.filepath);
        const supabasePath = `posters/${file.originalFilename}`;

        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(supabasePath, fileBuffer, { contentType: file.mimetype });

        if (uploadError) return res.status(500).json({ error: uploadError.message });

        const { data: publicURL } = supabase.storage.from('posters').getPublicUrl(supabasePath);

        const { error } = await supabase.from('posters').insert([
          { file: publicURL.publicUrl, description, uploadedBy: decoded.username }
        ]);

        if (error) return res.status(500).json({ error: error.message });

        res.json({ message: 'Poster caricato!', file: publicURL.publicUrl });
      });
    } catch {
      return res.status(401).json({ message: 'Token non valido' });
    }
  } else {
    res.status(405).json({ message: 'Metodo non consentito' });
  }
}
