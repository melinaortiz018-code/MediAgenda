const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

app.use(express.static(path.join(__dirname, '/'))); 

const app = express();
// Render asigna dinámicamente un puerto mediante process.env.PORT. 
// Dejar solo el 3000 fijo hará que tu despliegue falle en Render.
const PORT = process.env.PORT || 3000;

// Middleware para entender JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración obligatoria para el manejo de sesiones en memoria
app.use(session({
    secret: 'clave_secreta_mediagenda_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Dejar en false si no manejas certificados SSL locales
        maxAge: 24 * 60 * 60 * 1000 // La sesión dura 24 horas
    }
}));

// Servir los archivos estáticos de la carpeta public (HTML, JS, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de almacenamiento absoluta (Crucial para Linux/Render)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Base de datos simulada en memoria para usuarios
const usuariosDB = [];

// ================= RUTA: SUBIR AVATAR =================
app.post('/api/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
    }
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

// ================= RUTAS DE AUTENTICACIÓN SIMULADAS =================

// Ruta para Registrar Paciente
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
        }
        
        // Encriptar la contraseña usando bcryptjs antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const nuevoUsuario = { email, password: hashedPassword, role: role || 'Paciente' };
        usuariosDB.push(nuevoUsuario);

        res.json({ success: true, message: 'Código de verificación enviado simuladamente.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Ruta para Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const usuario = usuariosDB.find(u => u.email === email && u.role === role);
        
        if (!usuario) {
            return res.status(401).json({ success: false, message: 'Usuario o rol incorrectos' });
        }

        // Validar la contraseña encriptada
        const passwordCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecto) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        // Guardar al usuario en la sesión del servidor
        req.session.user = { email: usuario.email, role: usuario.role };
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Ruta para Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});
// ====================================================
// RUTA COMODÍN CORREGIDA: EVITA ERRORES 'CANNOT GET'
// ====================================================

// Redirige cualquier ruta desconocida al index principal usando 'path' de forma segura
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor vinculando el puerto dinámico de la nube
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose correctamente en el puerto: ${PORT}`);
});
