const express = require('express');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Configuración de almacenamiento para fotos de perfil subidas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para subir fotos de perfil
app.post('/api/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
    }
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose correctamente en: http://localhost:${PORT}`);
});
