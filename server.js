require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mediagenda-secret-key-2026';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ==================== MODELOS MONGOOSE ====================
const usuarioSchema = new mongoose.Schema({
  ci: { type: String, unique: true, required: true },
  nombres: { type: String, required: true },
  correo: { type: String, unique: true, required: true },
  celular: { type: String },
  direccion: { type: String },
  password: { type: String, required: true },
  rol: { type: String, enum: ['paciente', 'medico', 'admin'], default: 'paciente' },
  especialidad: { type: String, enum: ['Psicología', 'Odontología', 'Medicina General', 'Pediatría'] },
  genero: { type: String, enum: ['M', 'F'] },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

const citaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  especialidad: { type: String, required: true },
  fecha: { type: Date, required: true },
  hora: { type: String, required: true },
  motivo: { type: String, required: true },
  estado: { type: String, enum: ['Pendiente', 'Confirmada', 'Realizada', 'Cancelada', 'Reagendada'], default: 'Pendiente' },
  recetaObservaciones: { type: String, default: '' },
  fechaOriginal: { type: Date }
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', usuarioSchema);
const Cita = mongoose.model('Cita', citaSchema);

// ==================== MIDDLEWARE AUTENTICACIÓN ====================
const auth = (rolesPermitidos = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ mensaje: 'Acceso denegado' });
      
      const decoded = jwt.verify(token, JWT_SECRET);
      const usuario = await Usuario.findById(decoded.id).select('-password');
      
      if (!usuario || !usuario.activo) return res.status(401).json({ mensaje: 'Usuario no válido' });
      if (rolesPermitidos.length && !rolesPermitidos.includes(usuario.rol)) 
        return res.status(403).json({ mensaje: 'No autorizado para esta acción' });
      
      req.usuario = usuario;
      next();
    } catch (error) {
      res.status(401).json({ mensaje: 'Token inválido' });
    }
  };
};

// ==================== RUTAS AUTENTICACIÓN ====================
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { ci, nombres, correo, celular, direccion, password, confirmPassword } = req.body;
    
    if (!ci || !nombres || !correo || !password || !confirmPassword)
      return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben llenarse' });
    
    if (password !== confirmPassword)
      return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
    
    if (password.length < 6)
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    
    const existeCI = await Usuario.findOne({ ci });
    if (existeCI) return res.status(400).json({ mensaje: 'Ya existe un usuario con este CI' });
    
    const existeCorreo = await Usuario.findOne({ correo });
    if (existeCorreo) return res.status(400).json({ mensaje: 'Ya existe un usuario con este correo' });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const usuario = new Usuario({
      ci, nombres, correo, celular, direccion,
      password: passwordHash, rol: 'paciente'
    });
    
    await usuario.save();
    const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      usuario: { id: usuario._id, ci: usuario.ci, nombres: usuario.nombres, correo: usuario.correo, rol: usuario.rol }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
  }
});

// RUTA DE LOGIN CORREGIDA: FLEXIBLE POR ROLES
app.post('/api/auth/login', async (req, res) => {
  try {
    const { ci, correo, password } = req.body;
    
    if (!password)
      return res.status(400).json({ mensaje: 'La contraseña es obligatoria' });
    
    let usuario;
    
    // Caso 1: Paciente (CI + Correo)
    if (ci && correo) {
      usuario = await Usuario.findOne({ ci, correo });
    }
    // Caso 2: Médico (solo CI)
    else if (ci && !correo) {
      usuario = await Usuario.findOne({ ci });
    }
    // Caso 3: Administrador (solo Correo)
    else if (!ci && correo) {
      usuario = await Usuario.findOne({ correo });
    }
    // Caso 4: Faltan datos
    else {
      return res.status(400).json({ mensaje: 'Ingrese sus credenciales correctamente' });
    }
    
    if (!usuario) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
    
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });
    
    if (!usuario.activo) return res.status(400).json({ mensaje: 'Cuenta desactivada' });
    
    const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      usuario: {
        id: usuario._id, ci: usuario.ci, nombres: usuario.nombres, correo: usuario.correo,
        rol: usuario.rol, celular: usuario.celular, direccion: usuario.direccion,
        especialidad: usuario.especialidad
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
  }
});

// NUEVA RUTA: VERIFICAR TOKEN (MANTENER SESIÓN)
app.get('/api/auth/verify', auth(), async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id).select('-password');
    res.json({ usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al verificar token' });
  }
});

// ==================== RUTAS PACIENTES ====================
app.get('/api/medicos', auth(['paciente', 'admin']), async (req, res) => {
  try {
    const medicos = await Usuario.find({ rol: 'medico', activo: true }).select('-password');
    res.json(medicos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cargar médicos' });
  }
});

app.post('/api/citas', auth(['paciente']), async (req, res) => {
  try {
    const { medicoId, especialidad, fecha, hora, motivo } = req.body;
    
    if (!medicoId || !especialidad || !fecha || !hora || !motivo)
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    
    const fechaCita = new Date(fecha);
    const [h, m] = hora.split(':');
    fechaCita.setHours(parseInt(h), parseInt(m), 0, 0);
    
    const citaDuplicada = await Cita.findOne({
      medico: medicoId,
      fecha: new Date(fecha),
      hora,
      estado: { $in: ['Pendiente', 'Confirmada'] }
    });
    
    if (citaDuplicada)
      return res.status(400).json({ mensaje: 'Este horario ya está reservado para este médico' });
    
    const cita = new Cita({
      paciente: req.usuario._id,
      medico: medicoId,
      especialidad,
      fecha: new Date(fecha),
      hora,
      motivo,
      fechaOriginal: fechaCita
    });
    
    await cita.save();
    await cita.populate('medico', 'nombres especialidad');
    res.status(201).json(cita);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agendar cita', error: error.message });
  }
});

app.get('/api/mis-citas', auth(['paciente']), async (req, res) => {
  try {
    const citas = await Cita.find({ paciente: req.usuario._id })
      .populate('medico', 'nombres especialidad')
      .sort({ fecha: -1, hora: -1 });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cargar citas' });
  }
});

app.put('/api/citas/:id/cancelar', auth(['paciente', 'medico', 'admin']), async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id).populate('medico paciente');
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    
    if (req.usuario.rol === 'paciente' && cita.paciente._id.toString() !== req.usuario._id.toString())
      return res.status(403).json({ mensaje: 'No autorizado' });
    
    if (req.usuario.rol === 'medico' && cita.medico._id.toString() !== req.usuario._id.toString())
      return res.status(403).json({ mensaje: 'No autorizado' });
    
    const fechaCita = new Date(cita.fecha);
    const [h, m] = cita.hora.split(':');
    fechaCita.setHours(parseInt(h), parseInt(m), 0, 0);
    const ahora = new Date();
    const diferenciaHoras = (fechaCita - ahora) / (1000 * 60 * 60);
    
    if (req.usuario.rol === 'paciente' && diferenciaHoras <= 24)
      return res.status(400).json({ mensaje: 'Solo puedes cancelar con más de 24 horas de antelación' });
    
    cita.estado = 'Cancelada';
    await cita.save();
    res.json({ mensaje: 'Cita cancelada exitosamente', cita });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar cita' });
  }
});

app.put('/api/citas/:id/reagendar', auth(['paciente', 'medico']), async (req, res) => {
  try {
    const { nuevaFecha, nuevaHora } = req.body;
    const cita = await Cita.findById(req.params.id).populate('medico paciente');
    
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    
    if (req.usuario.rol === 'paciente' && cita.paciente._id.toString() !== req.usuario._id.toString())
      return res.status(403).json({ mensaje: 'No autorizado' });
    
    if (req.usuario.rol === 'medico' && cita.medico._id.toString() !== req.usuario._id.toString())
      return res.status(403).json({ mensaje: 'No autorizado' });
    
    const fechaCita = new Date(cita.fecha);
    const [h, m] = cita.hora.split(':');
    fechaCita.setHours(parseInt(h), parseInt(m), 0, 0);
    const ahora = new Date();
    const diferenciaHoras = (fechaCita - ahora) / (1000 * 60 * 60);
    
    if (req.usuario.rol === 'paciente' && diferenciaHoras <= 24)
      return res.status(400).json({ mensaje: 'Solo puedes reagendar con más de 24 horas de antelación' });
    
    const citaDuplicada = await Cita.findOne({
      medico: cita.medico._id,
      fecha: new Date(nuevaFecha),
      hora: nuevaHora,
      _id: { $ne: cita._id },
      estado: { $in: ['Pendiente', 'Confirmada'] }
    });
    
    if (citaDuplicada)
      return res.status(400).json({ mensaje: 'Este nuevo horario ya está reservado' });
    
    cita.fecha = new Date(nuevaFecha);
    cita.hora = nuevaHora;
    cita.estado = 'Reagendada';
    await cita.save();
    await cita.populate('medico', 'nombres especialidad');
    
    res.json({ mensaje: 'Cita reagendada exitosamente', cita });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al reagendar cita' });
  }
});

app.put('/api/perfil', auth(['paciente', 'medico']), async (req, res) => {
  try {
    const { correo, celular, direccion } = req.body;
    
    if (correo) {
      const existeCorreo = await Usuario.findOne({ correo, _id: { $ne: req.usuario._id } });
      if (existeCorreo) return res.status(400).json({ mensaje: 'Este correo ya está en uso' });
    }
    
    const usuario = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      { correo, celular, direccion },
      { new: true }
    ).select('-password');
    
    res.json({ mensaje: 'Perfil actualizado exitosamente', usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar perfil' });
  }
});

// ==================== RUTAS MÉDICOS ====================
app.get('/api/medico/citas', auth(['medico']), async (req, res) => {
  try {
    const { rango = 'hoy' } = req.query;
    let filtro = { medico: req.usuario._id };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (rango === 'hoy') {
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      filtro.fecha = { $gte: hoy, $lt: manana };
    } else if (rango === 'semana') {
      const finSemana = new Date(hoy);
      finSemana.setDate(finSemana.getDate() + 7);
      filtro.fecha = { $gte: hoy, $lt: finSemana };
    } else if (rango === 'meses') {
      const finMeses = new Date(hoy);
      finMeses.setMonth(finMeses.getMonth() + 2);
      filtro.fecha = { $gte: hoy, $lt: finMeses };
    }
    
    const citas = await Cita.find(filtro)
      .populate('paciente', 'nombres ci correo celular direccion')
      .sort({ fecha: 1, hora: 1 });
    
    res.json(citas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cargar citas' });
  }
});

app.put('/api/medico/citas/:id', auth(['medico']), async (req, res) => {
  try {
    const { estado, recetaObservaciones, hora } = req.body;
    const cita = await Cita.findById(req.params.id);
    
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    if (cita.medico.toString() !== req.usuario._id.toString())
      return res.status(403).json({ mensaje: 'No autorizado' });
    
    if (estado) cita.estado = estado;
    if (recetaObservaciones !== undefined) cita.recetaObservaciones = recetaObservaciones;
    if (hora) cita.hora = hora;
    
    await cita.save();
    await cita.populate('paciente', 'nombres ci correo');
    res.json({ mensaje: 'Cita actualizada exitosamente', cita });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar cita' });
  }
});

// ==================== RUTAS ADMINISTRADOR ====================
app.get('/api/admin/usuarios', auth(['admin']), async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('+password').sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cargar usuarios' });
  }
});

app.post('/api/admin/medicos', auth(['admin']), async (req, res) => {
  try {
    const { ci, nombres, correo, celular, especialidad, genero, password } = req.body;
    
    if (!ci || !nombres || !correo || !especialidad || !genero || !password)
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    
    const existeCI = await Usuario.findOne({ ci });
    if (existeCI) return res.status(400).json({ mensaje: 'Ya existe un usuario con este CI' });
    
    const existeCorreo = await Usuario.findOne({ correo });
    if (existeCorreo) return res.status(400).json({ mensaje: 'Ya existe un usuario con este correo' });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const medico = new Usuario({
      ci, nombres, correo, celular, especialidad, genero,
      password: passwordHash, rol: 'medico'
    });
    
    await medico.save();
    res.status(201).json({ mensaje: 'Médico agregado exitosamente', medico });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agregar médico' });
  }
});

app.put('/api/admin/usuarios/:id/password', auth(['admin']), async (req, res) => {
  try {
    const { nuevaPassword } = req.body;
    if (!nuevaPassword || nuevaPassword.length < 6)
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nuevaPassword, salt);
    
    await Usuario.findByIdAndUpdate(req.params.id, { password: passwordHash });
    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar contraseña' });
  }
});

app.delete('/api/admin/usuarios/:id', auth(['admin']), async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    
    if (usuario.rol === 'admin')
      return res.status(400).json({ mensaje: 'No se puede eliminar una cuenta de administrador' });
    
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
});

app.get('/api/admin/estadisticas', auth(['admin']), async (req, res) => {
  try {
    const totalCitas = await Cita.countDocuments();
    const exitosas = await Cita.countDocuments({ estado: 'Realizada' });
    const canceladas = await Cita.countDocuments({ estado: 'Cancelada' });
    const reagendadas = await Cita.countDocuments({ estado: 'Reagendada' });
    const pendientes = await Cita.countDocuments({ estado: { $in: ['Pendiente', 'Confirmada'] } });
    
    const porEspecialidad = await Cita.aggregate([
      { $group: { _id: '$especialidad', total: { $sum: 1 } } }
    ]);
    
    res.json({
      totalCitas, exitosas, canceladas, reagendadas, pendientes,
      porEspecialidad: porEspecialidad.map(e => ({ especialidad: e._id, total: e.total }))
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cargar estadísticas' });
  }
});

// ==================== CONEXIÓN DB Y SEED ====================
const MEDICOS_PREDEFINIDOS = [
  { ci: 'MED001', nombres: 'Dr. Carlos Mendoza', correo: 'carlos.mendoza@mediagenda.com', celular: '0987654321', especialidad: 'Psicología', genero: 'M', password: 'Medico123*' },
  { ci: 'MED002', nombres: 'Dra. Laura Fernández', correo: 'laura.fernandez@mediagenda.com', celular: '0987654322', especialidad: 'Psicología', genero: 'F', password: 'Medico123*' },
  { ci: 'MED003', nombres: 'Dr. Andrés Salazar', correo: 'andres.salazar@mediagenda.com', celular: '0987654323', especialidad: 'Odontología', genero: 'M', password: 'Medico123*' },
  { ci: 'MED004', nombres: 'Dra. Mariana Gómez', correo: 'mariana.gomez@mediagenda.com', celular: '0987654324', especialidad: 'Odontología', genero: 'F', password: 'Medico123*' },
  { ci: 'MED005', nombres: 'Dr. Javier López', correo: 'javier.lopez@mediagenda.com', celular: '0987654325', especialidad: 'Medicina General', genero: 'M', password: 'Medico123*' },
  { ci: 'MED006', nombres: 'Dra. Ana Martínez', correo: 'ana.martinez@mediagenda.com', celular: '0987654326', especialidad: 'Medicina General', genero: 'F', password: 'Medico123*' },
  { ci: 'MED007', nombres: 'Dr. Diego Ramírez', correo: 'diego.ramirez@mediagenda.com', celular: '0987654327', especialidad: 'Pediatría', genero: 'M', password: 'Medico123*' },
  { ci: 'MED008', nombres: 'Dra. Sofía Torres', correo: 'sofia.torres@mediagenda.com', celular: '0987654328', especialidad: 'Pediatría', genero: 'F', password: 'Medico123*' }
];

const ADMIN_PREDEFINIDO = {
  ci: 'ADMIN001',
  nombres: 'Administrador Sistema',
  correo: 'admin@mediagenda.com',
  celular: '0999999999',
  password: 'Admin123*',
  rol: 'admin'
};

const inicializarDatos = async () => {
  try {
    // ================== NUEVO: Borrar admin y médicos antiguos ==================
    await Usuario.deleteMany({ 
      $or: [
        { rol: 'admin' }, 
        { ci: { $in: MEDICOS_PREDEFINIDOS.map(m => m.ci) } } 
      ] 
    });
    console.log('🔄 Usuarios por defecto reiniciados');

    // ================== Crear Administrador ==================
    const saltAdmin = await bcrypt.genSalt(10);
    const passwordHashAdmin = await bcrypt.hash(ADMIN_PREDEFINIDO.password, saltAdmin);
    await Usuario.create({ ...ADMIN_PREDEFINIDO, password: passwordHashAdmin });
    console.log('✅ Administrador predeterminado creado');
    
    // ================== Crear 8 Médicos ==================
    for (const medico of MEDICOS_PREDEFINIDOS) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(medico.password, salt);
      await Usuario.create({ ...medico, password: passwordHash });
      console.log(`✅ Médico creado: ${medico.nombres}`);
    }
    console.log('📋 Datos iniciales verificados correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar datos:', error);
  }
};
const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mediagenda');
    console.log('🔌 Conectado a MongoDB exitosamente');
    await inicializarDatos();
  } catch (error) {
    console.error('❌ Error de conexión MongoDB:', error);
    process.exit(1);
  }
};

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

conectarDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor MediAgenda corriendo en puerto ${PORT}`);
    console.log(`📌 Credenciales por defecto:`);
    console.log(`   Admin: admin@mediagenda.com / Admin123*`);
    console.log(`   Médicos: CI MED001-MED008 / Password: Medico123*`);
  });
});