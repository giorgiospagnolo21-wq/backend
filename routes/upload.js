const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

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

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.post('/', verifyToken, upload.single('poster'), async (req, res) => {
  try {
    const file = req.file;
    const title = req.body.title || '';
    const description = req.body.description || '';

    if (!file) return res.status(400).json({ message: 'Nessun file' });
    if (!title.trim()) return res.status(400).json({ message: 'Titolo obbligatorio' });

    const buffer = fs.readFileSync(file.path);
    const supabasePath = `posters/${file.filename}`;

    await supabase.storage.from('posters').upload(supabasePath, buffer, {
      contentType: file.mimetype
    });

    const { data: publicURL } = supabase.storage.from('posters').getPublicUrl(supabasePath);

    await supabase.from('posters').insert([{
      file: publicURL.publicUrl,
      title,
      description,
      uploadedBy: req.username,
      votes: 0
    }]);

    fs.unlinkSync(file.path);

    res.json({ message: 'Poster caricato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore upload' });
  }
});

module.exports = router;
