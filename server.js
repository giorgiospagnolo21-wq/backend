
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Configurazione Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Chiave JWT
const SECRET_KEY = process.env.SECRET_KEY || 'supersegreto';

// ✅ Utenti hardcoded (puoi sostituirli con DB Supabase se vuoi)
const users = [
  { username: 'sponsor1', password: bcrypt.hashSync('password1', 8) },
  { username: 'sponsor2', password: bcrypt.hashSync('password2', 8) }
];

// ✅ Middleware per verificare token
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token mancante' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token non valido' });
    req.username = decoded.username;
    next();
  });
}

// ✅ Rotta Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ message: 'Utente non trovato' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Password errata' });

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// ✅ Configurazione Multer per upload temporaneo
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ Rotta Upload
app.post('/upload', verifyToken, upload.single('poster'), async (req, res) => {
  try {
    const file = req.file;
    const description = req.body.description;

    if (!file) return res.status(400).json({ message: 'Nessun file ricevuto' });

    const fileBuffer = fs.readFileSync(file.path);
    const supabasePath = `posters/${file.filename}`;

    // Carica su Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('posters')
      .upload(supabasePath, fileBuffer, { contentType: file.mimetype });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    // Ottieni URL pubblico
    const { data: publicURL } = supabase.storage.from('posters').getPublicUrl(supabasePath);

    // Salva nel DB Supabase
    const { error } = await supabase.from('posters').insert([
      { file: publicURL.publicUrl, description, uploadedBy: req.username }
    ]);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Poster caricato!', file: publicURL.publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'Errore interno' });
  }
});

// ✅ Rotta Lista Poster (solo quelli dell'utente loggato)
app.get('/posters', verifyToken, async (req, res) => {
  const { username } = req;
  const { data, error } = await supabase
    .from('posters')
    .select('*')
    .eq('uploadedBy', username);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ Rotta Elimina Poster
app.delete('/poster/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

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
});

// ✅ Avvio server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server attivo su http://localhost:${PORT}`));
