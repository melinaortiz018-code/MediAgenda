const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos en memoria para la sincronización entre dispositivos
let users = [];
let doctors = [
  { id: 1, ci: "1101", name: "Dr. Carlos Mendoza", email: "carlos.mendoza@mediagenda.com", pass: "med123", specialty: "Psicología", gender: "M" },
  { id: 2, ci: "1102", name: "Dra. Valeria Ríos", email: "valeria.rios@mediagenda.com", pass: "med123", specialty: "Psicología", gender: "F" },
  { id: 3, ci: "1103", name: "Dr. Andrés Silva", email: "andres.silva@mediagenda.com", pass: "med123", specialty: "Odontología", gender: "M" },
  { id: 4, ci: "1104", name: "Dra. Sofía Castro", email: "sofia.castro@mediagenda.com", pass: "med123", specialty: "Odontología", gender: "F" },
  { id: 5, ci: "1105", name: "Dr. Roberto Gómez", email: "roberto.gomez@mediagenda.com", pass: "med123", specialty: "Medicina General", gender: "M" },
  { id: 6, ci: "1106", name: "Dra. Elena Paredes", email: "elena.paredes@mediagenda.com", pass: "med123", specialty: "Medicina General", gender: "F" },
  { id: 7, ci: "1107", name: "Dr. Mateo Fernández", email: "mateo.fernandez@mediagenda.com", pass: "med123", specialty: "Pediatría", gender: "M" },
  { id: 8, ci: "1108", name: "Dra. Camila Morales", email: "camila.morales@mediagenda.com", pass: "med123", specialty: "Pediatría", gender: "F" }
];

let appointments = [];

// API - Autenticación y Registro
app.post('/api/register', (req, res) => {
  const { ci, name, email, phone, password, address } = req.body;
  if (!ci || !name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }
  const exists = users.find(u => u.ci === ci || u.email === email);
  if (exists) {
    return res.status(400).json({ error: 'El usuario con esta C.I. o correo ya existe.' });
  }
  const newUser = { id: Date.now().toString(), ci, name, email, phone, password, address: address || '', role: 'patient' };
  users.push(newUser);
  res.json({ message: 'Registro exitoso.', user: newUser });
});

app.post('/api/login', (req, res) => {
  const { role, ci, email, password } = req.body;

  if (role === 'admin') {
    if (email === 'admin@mediagenda.com' && password === 'admin123') {
      return res.json({ role: 'admin', user: { name: 'Administrador General', email } });
    }
    return res.status(401).json({ error: 'Credenciales de administrador incorrectas.' });
  }

  if (role === 'doctor') {
    const doc = doctors.find(d => d.email === email && d.pass === password);
    if (doc) return res.json({ role: 'doctor', user: doc });
    return res.status(401).json({ error: 'Credenciales médicas inválidas.' });
  }

  if (role === 'patient') {
    const user = users.find(u => u.ci === ci && u.email === email && u.password === password);
    if (user) return res.json({ role: 'patient', user });
    return res.status(401).json({ error: 'C.I., correo o contraseña incorrectos.' });
  }

  res.status(400).json({ error: 'Rol inválido.' });
});

// API - Datos del Paciente
app.put('/api/patient/:id', (req, res) => {
  const { id } = req.params;
  const { email, phone, address } = req.body;
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  
  user.email = email || user.email;
  user.phone = phone || user.phone;
  user.address = address || user.address;
  res.json({ message: 'Datos actualizados con éxito.', user });
});

// API - Citas
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
  const { patientId, patientName, specialty, doctorName, date, time, reason } = req.body;

  if (!patientId || !specialty || !doctorName || !date || !time || !reason) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios para agendar.' });
  }

  // Validación de duplicados (mismo doctor, fecha y hora)
  const duplicate = appointments.find(a => a.doctorName === doctorName && a.date === date && a.time === time && a.status !== 'Cancelada');
  if (duplicate) {
    return res.status(400).json({ error: 'Este horario ya se encuentra ocupado con el médico seleccionado.' });
  }

  const newApp = {
    id: 'CIT-' + Date.now(),
    patientId,
    patientName,
    specialty,
    doctorName,
    date,
    time,
    reason,
    status: 'Pendiente',
    prescription: '',
    createdAt: new Date().toISOString()
  };

  appointments.push(newApp);
  res.json({ message: 'Cita agendada correctamente.', appointment: newApp });
});

app.put('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const { action, newDate, newTime, prescription, status } = req.body;
  const appIndex = appointments.findIndex(a => a.id === id);

  if (appIndex === -1) return res.status(404).json({ error: 'Cita no encontrada.' });

  const currentApp = appointments[appIndex];
  const appDateTime = new Date(`${currentApp.date}T${currentApp.time}`);
  const now = new Date();
  const diffHours = (appDateTime - now) / (1000 * 60 * 60);

  if (action === 'cancel') {
    if (diffHours < 24) {
      return res.status(400).json({ error: 'No se puede cancelar la cita con menos de 24 horas de anticipación.' });
    }
    currentApp.status = 'Cancelada';
  } else if (action === 'reschedule') {
    if (diffHours < 24) {
      return res.status(400).json({ error: 'No se puede reagendar la cita con menos de 24 horas de anticipación.' });
    }
    // Verificar que el nuevo horario no esté ocupado
    const duplicate = appointments.find(a => a.doctorName === currentApp.doctorName && a.date === newDate && a.time === newTime && a.id !== id && a.status !== 'Cancelada');
    if (duplicate) {
      return res.status(400).json({ error: 'El nuevo horario ya está ocupado.' });
    }
    currentApp.date = newDate;
    currentApp.time = newTime;
    currentApp.status = 'Reagendada';
  } else if (action === 'doctor_update') {
    if (prescription !== undefined) currentApp.prescription = prescription;
    if (status !== undefined) currentApp.status = status;
  }

  res.json({ message: 'Cita actualizada exitosamente.', appointment: currentApp });
});

// API - Administración
app.get('/api/admin/users', (req, res) => res.json(users));
app.get('/api/admin/doctors', (req, res) => res.json(doctors));

app.post('/api/admin/doctors', (req, res) => {
  const { ci, name, email, pass, specialty, gender } = req.body;
  const newDoc = { id: doctors.length + 1, ci, name, email, pass, specialty, gender };
  doctors.push(newDoc);
  res.json({ message: 'Médico agregado correctamente.', doctor: newDoc });
});

app.put('/api/admin/change-password', (req, res) => {
  const { userId, newPassword } = req.body;
  const user = users.find(u => u.id === userId);
  if (user) {
    user.password = newPassword;
    return res.json({ message: 'Contraseña cambiada con éxito.' });
  }
  res.status(404).json({ error: 'Usuario no encontrado.' });
});

app.delete('/api/admin/users/:id', (req, res) => {
  users = users.filter(u => u.id !== req.params.id);
  res.json({ message: 'Usuario eliminado.' });
});

app.listen(PORT, () => {
  console.log(`Servidor MediAgenda corriendo en http://localhost:${PORT}`);
});