// Archivo: ./server.js (En la RAÍZ del proyecto)
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Aquí le decimos al servidor que la carpeta "public" contiene los archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal que carga tu index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`👉 Sirviendo archivos desde la carpeta '/public'`);
});