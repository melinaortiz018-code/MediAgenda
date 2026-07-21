const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Configuración correcta de archivos estáticos para Render y entorno local
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A MONGODB ATLAS (Asegurando el nombre de la base de datos 'mediagenda')
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://<db_username>:A2gGkS925WxgfzKs@mediagenda.eyawg89.mongodb.net/mediagenda?retryWrites=true&w=majority&appName=Mediagenda";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Conectado exitosamente a MongoDB Atlas"))
  .catch(err => console.error("Error conectando a MongoDB Atlas:", err));

// ESQUEMAS Y MODELOS DE DATOS
const userSchema = new mongoose.Schema({
  ci: { type: String, unique: true, required: true },
  nombre: String,
  email: String,
  telefono: String,
  password: { type: String, required: true },
  rol: { type: String, enum: ['paciente', 'medico', 'admin'], default: 'paciente' },
  especialidad: String // Solo para médicos
});
const User = mongoose.model('User', userSchema);

const appointmentSchema = new mongoose.Schema({
  pacienteCI: String,
  pacienteNombre: String,
  especialidad: String,
  medicoId: String,
  medicoNombre: String,
  fecha: String,
  hora: String,
  motivo: String,
  estado: { type: String, default: 'Pendiente' }, // Pendiente, Confirmada, En curso, Atendida, Cancelada, Reprogramada
  receta: { type: String, default: '' },
  motivoCambio: { type: String, default: '' }
});
const Appointment = mongoose.model('Appointment', appointmentSchema);

const scheduleSchema = new mongoose.Schema({
  medicoId: String,
  fecha: String,
  horasDisponibles: [String] // ['09:00', '10:00', ...]
});
const Schedule = mongoose.model('Schedule', scheduleSchema);

// RUTAS API REST & WEBSOCKETS
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Autenticación / Registro
  socket.on('registrar_usuario', async (data, callback) => {
    try {
      const nuevo = new User(data);
      await nuevo.save();
      callback({ success: true });
      io.emit('actualizar_usuarios');
    } catch (e) {
      callback({ success: false, error: "La Cédula de Identidad ya está registrada." });
    }
  });

  socket.on('login', async (data, callback) => {
    try {
      console.log("Intentando iniciar sesión con CI:", data.ci, "y Password:", data.password);
      const user = await User.findOne({ ci: data.ci, password: data.password });
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
  // Citas Médicas
  socket.on('crear_cita', async (data, callback) => {
    try {
      // Regla de oro: Bloqueo de duplicados
      const existe = await Appointment.findOne({
        medicoId: data.medicoId,
        fecha: data.fecha,
        hora: data.hora,
        estado: { $ne: 'Cancelada' }
      });
      if (existe) {
        return callback({ success: false, error: "Este médico ya tiene una cita ocupada en esta fecha y hora exactas." });
      }
      const cita = new Appointment(data);
      await cita.save();
      io.emit('citas_actualizadas');
      callback({ success: true });
    } catch (e) {
      callback({ success: false, error: "Error al agendar la cita." });
    }
  });

  socket.on('actualizar_estado_cita', async (data) => {
    await Appointment.findByIdAndUpdate(data.id, { 
      estado: data.estado, 
      receta: data.receta !== undefined ? data.receta : undefined,
      motivoCambio: data.motivoCambio || ''
    });
    io.emit('citas_actualizadas');
  });

  // Gestión de Horarios de Médicos
  socket.on('guardar_horario', async (data) => {
    await Schedule.findOneAndUpdate(
      { medicoId: data.medicoId, fecha: data.fecha },
      { horasDisponibles: data.horasDisponibles },
      { upsert: true, new: true }
    );
    io.emit('horarios_actualizados');
  });

  socket.on('obtener_datos_iniciales', async (_, callback) => {
    try {
      const usuarios = await User.find();
      const citas = await Appointment.find();
      const horarios = await Schedule.find();
      callback({ usuarios, citas, horarios });
    } catch (e) {
      callback({ usuarios: [], citas: [], horarios: [] });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));