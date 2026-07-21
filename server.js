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

// Función para asegurar que existan los 8 médicos y usuarios por defecto al iniciar
async function inicializarUsuariosDemo() {
    try {
        const medicosDemo = [
            {
                ci: "0900000001",
                nombre: "Dr. Carlos Pérez",
                email: "carlos.perez@mediagenda.com",
                telefono: "0999999991",
                password: "medico123",
                rol: "medico",
                especialidad: "Cardiología"
            },
            {
                ci: "0900000002",
                nombre: "Dra. María Gómez",
                email: "maria.gomez@mediagenda.com",
                telefono: "0999999992",
                password: "medico123",
                rol: "medico",
                especialidad: "Pediatría"
            },
            {
                ci: "0900000003",
                nombre: "Dr. Luis Rodríguez",
                email: "luis.rodriguez@mediagenda.com",
                telefono: "0999999993",
                password: "medico123",
                rol: "medico",
                especialidad: "Medicina General"
            },
            {
                ci: "0900000004",
                nombre: "Dra. Ana Torres",
                email: "ana.torres@mediagenda.com",
                telefono: "0999999994",
                password: "medico123",
                rol: "medico",
                especialidad: "Dermatología"
            },
            {
                ci: "0900000005",
                nombre: "Dr. Jorge Mendoza",
                email: "jorge.mendoza@mediagenda.com",
                telefono: "0999999995",
                password: "medico123",
                rol: "medico",
                especialidad: "Traumatología"
            },
            {
                ci: "0900000006",
                nombre: "Dra. Sofía Benítez",
                email: "sofia.benitez@mediagenda.com",
                telefono: "0999999996",
                password: "medico123",
                rol: "medico",
                especialidad: "Ginecología"
            },
            {
                ci: "0900000007",
                nombre: "Dr. Fernando Ruiz",
                email: "fernando.ruiz@mediagenda.com",
                telefono: "0999999997",
                password: "medico123",
                rol: "medico",
                especialidad: "Neurología"
            },
            {
                ci: "0900000008",
                nombre: "Dra. Lucía Castro",
                email: "lucia.castro@mediagenda.com",
                telefono: "0999999998",
                password: "medico123",
                rol: "medico",
                especialidad: "Oftalmología"
            }
        ];

        for (const medico of medicosDemo) {
            await User.findOneAndUpdate(
                { ci: medico.ci },
                medico,
                { upsert: true, new: true }
            );
        }
        console.log("Los 8 médicos demo han sido verificados/cargados exitosamente en MongoDB.");
    } catch (error) {
        console.error("Error al inicializar los médicos demo:", error);
    }
}

mongoose.connect(MONGO_URI)
  .then(async () => {
      console.log("Conectado a MongoDB Atlas exitosamente");
      await inicializarUsuariosDemo();
  })
  .catch(err => console.error("Error conectando a MongoDB:", err));

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  socket.on('login', async (data, callback) => {
    try {
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