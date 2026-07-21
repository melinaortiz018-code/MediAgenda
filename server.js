const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión a MongoDB usando la variable de entorno de Render
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Conectado a MongoDB Atlas exitosamente"))
  .catch(err => console.error("Error conectando a MongoDB:", err));

// Definición del esquema de Usuario
const userSchema = new mongoose.Schema({
  ci: String,
  nombre: String,
  email: String,
  telefono: String,
  password: String,
  rol: String,
  especialidad: String
});

const User = mongoose.model('User', userSchema);

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  socket.on('login', async (data, callback) => {
    socket.on('login', async (data, callback) => {
        try {
            // Acepta cualquier nombre con el que el cliente envíe el identificador
            const identificador = data.ci || data.email || data.cedula;
            const password = data.password;

            console.log("Intentando iniciar sesión con identificador:", identificador, "y Password:", password);

            const user = await User.findOne({ 
                $or: [
                    { ci: identificador }, 
                    { email: identificador }
                ],
                password: password
            });

            console.log("Resultado de la búsqueda en MongoDB:", user);
      console.log("Resultado de la búsqueda en MongoDB:", user);
      
      if (user) {
        callback({ success: true, user });
      } else {
        callback({ success: false, error: "Credenciales incorrectas o usuario no encontrado." });
      }
    } catch (e) {
      console.error("Error en login:", e);
      callback({ success: false, error: "Error en el servidor." });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});