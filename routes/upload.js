const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

// ================================
// VERIFICA TOKEN (accetta sia "Bearer x" sia "x")
// ================================
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'Token mancante' });

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token non valido' });
    req.username = decoded.username;
    next();
  });
}

// ================================
// CARTELLA UPLOADS LOCALE
// ================================
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================================
// CONFIG MULTER
// ================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

// ================================
// ENDPOINT UPLOAD
// ================================
router.post('/', verifyToken, upload.single('poster'), async (req, res) => {
  try {
    const file = req.file;

    // accetta title o titolo (per sicurezza)
    const title = (req.body.title || req.body.titolo || '').toString();
    const description = (req.body.description || '').toString();

    if (!file) return res.status(400).json({ message: 'Nessun file' });
    if (!title.trim()) return res.status(400).json({ message: 'Titolo obbligatorio' });

    const localPath = path.join(uploadDir, file.filename);
    const fileBuffer = fs.readFileSync(localPath);

    // path oggetto nello storage (bucket = posters)
    const supabasePath = `posters/${file.filename}`;

    // upload su Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('posters')
      .upload(supabasePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('UPLOAD ERROR:', uploadError);
      try { fs.unlinkSync(localPath); } catch {}
      return res.status(500).json({ message: uploadError.message });
    }

    // URL pubblico
    const { data: publicURL } = supabase.storage
      .from('posters')
      .getPublicUrl(supabasePath);

    // salva nel DB
    const { error: dbError } = await supabase.from('posters').insert([
      {
        file: publicURL.publicUrl,
        title: title.trim(),
        description,
        uploadedBy: req.username,
        votes: 0,
      },
    ]);

    if (dbError) {
      console.error('DB ERROR:', dbError);

      // se fallisce DB, prova a rimuovere anche lo storage (non obbligatorio ma pulito)
      try {
        await supabase.storage.from('posters').remove([supabasePath]);
      } catch {}

      try { fs.unlinkSync(localPath); } catch {}
      return res.status(500).json({ message: dbError.message });
    }

    // cancella file locale
    try { fs.unlinkSync(localPath); } catch {}

    return res.json({
      message: 'Poster caricato!',
      file: publicURL.publicUrl,
    });
  } catch (err) {
    console.error('ERRORE UPLOAD:', err);
    return res.status(500).json({ message: 'Errore interno durante upload' });
  }
});

module.exports = router;
