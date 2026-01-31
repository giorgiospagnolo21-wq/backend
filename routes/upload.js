const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

// ================================
// VERIFICA TOKEN
// ================================
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token mancante' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token non valido' });
    req.username = decoded.username;
    next();
  });
}

// ================================
// CARTELLA UPLOADS ASSOLUTA
// ================================
const uploadDir = path.join(__dirname, '..', 'uploads');

// Se la cartella non esiste → creala
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================================
// CONFIGURAZIONE MULTER
// ================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + file.originalname;
    cb(null, filename);
  }
});

const upload = multer({ storage });

// ================================
// ENDPOINT UPLOAD
// ================================
router.post('/', verifyToken, upload.single('poster'), async (req, res) => {
  try {
    const file = req.file;
    const description = req.body.description || '';

    if (!file) return res.status(400).json({ message: 'Nessun file ricevuto' });

    const filePath = path.join(uploadDir, file.filename);

    // Leggi file correttamente
    const fileBuffer = fs.readFileSync(filePath);
    const supabasePath = `posters/${file.filename}`;

    // Upload su Supabase
    const { error: uploadError } = await supabase.storage
      .from('posters')
      .upload(supabasePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error(uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    // URL pubblico
    const { data: publicURL } = supabase.storage
      .from('posters')
      .getPublicUrl(supabasePath);

    // Salva nel DB
    const { error } = await supabase.from('posters').insert([
      {
        file: publicURL.publicUrl,
        description,
        uploadedBy: req.username
      }
    ]);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    // Cancella file locale
    fs.unlinkSync(filePath);

    return res.json({
      message: 'Poster caricato!',
      file: publicURL.publicUrl
    });

  } catch (err) {
    console.error('ERRORE UPLOAD:', err);
    return res.status(500).json({ error: 'Errore interno durante upload' });
  }
});

module.exports = router;
