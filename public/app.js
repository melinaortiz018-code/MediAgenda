let usuarioActual = null;
let token = localStorage.getItem('token') || null;
const API_BASE = '';

let mesActual = new Date();
let diaSeleccionado = null;
let citasMedicoActuales = [];
let disponibilidadHorarios = {};

// UTILIDADES
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁️' : '👁️‍🗨️';
}

function cambiarTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('formLogin').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('formRegistro').style.display = tab === 'registro' ? 'block' : 'none';
  event.target.classList.add('active');
}

function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}

function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatearFechaCorta(fecha) {
  return fecha.toISOString().split('T')[0];
}

function verificarTiempoRestante(fechaCita, horaCita) {
  const fecha = new Date(fechaCita);
  const [h, m] = horaCita.split(':');
  fecha.setHours(parseInt(h), parseInt(m), 0, 0);
  const ahora = new Date();
  const diferencia = (fecha - ahora) / (1000 * 60 * 60);
  return diferencia > 24;
}

// SELECCIÓN DE ROL
function seleccionarRol(rolElegido, elemento) {
  document.querySelectorAll('.rol-card').forEach(card => card.classList.remove('seleccionado'));
  elemento.classList.add('seleccionado');

  const loginRol = document.getElementById('loginRol');
  const grupoCI = document.getElementById('grupoLoginCI');
  const grupoCorreo = document.getElementById('grupoLoginCorreo');
  const camposLogin = document.getElementById('camposLogin');
  const tabsAuth = document.getElementById('tabsAuth');
  const hint = document.getElementById('loginHint');
  const ciInput = document.getElementById('loginCI');
  const correoInput = document.getElementById('loginCorreo');
  const passwordInput = document.getElementById('loginPassword');

  loginRol.value = rolElegido;
  camposLogin.style.display = 'flex';
  tabsAuth.style.display = 'none';
  ciInput.value = '';
  correoInput.value = '';
  passwordInput.value = '';
  ciInput.required = false;
  correoInput.required = false;

  if (rolElegido === 'paciente') {
    tabsAuth.style.display = 'flex';
    grupoCI.style.display = 'flex';
    grupoCorreo.style.display = 'flex';
    ciInput.required = true;
    correoInput.required = true;
    hint.textContent = '👤 Ingresa tu CI y Correo, o crea una cuenta nueva';
  } else if (rolElegido === 'medico') {
    grupoCI.style.display = 'flex';
    grupoCorreo.style.display = 'none';
    ciInput.required = true;
    hint.textContent = '🩺 Ingresa tu CI (ej: MED001) y contraseña';
  } else if (rolElegido === 'admin') {
    grupoCI.style.display = 'none';
    grupoCorreo.style.display = 'flex';
    correoInput.required = true;
    hint.textContent = '🛡️ Ingresa tu correo y contraseña';
  }
}

// PETICIONES API
async function apiRequest(endpoint, method = 'GET', body = null) {
  const opciones = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opciones.headers['Authorization'] = `Bearer ${token}`;
  if (body) opciones.body = JSON.stringify(body);
  
  const respuesta = await fetch(`${API_BASE}${endpoint}`, opciones);
  const datos = await respuesta.json();
  
  if (!respuesta.ok) throw new Error(datos.mensaje || 'Error en la solicitud');
  return datos;
}

// AUTENTICACIÓN
async function iniciarSesion() {
  const rol = document.getElementById('loginRol').value;
  const ci = document.getElementById('loginCI').value.trim();
  const correo = document.getElementById('loginCorreo').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!rol) return Swal.fire('Error', 'Selecciona un tipo de cuenta', 'warning');

  const datos = { rol, password };
  if (rol === 'paciente') {
    if (!ci || !correo) return Swal.fire('Error', 'Ingresa CI y Correo', 'warning');
    datos.ci = ci;
    datos.correo = correo;
  } else if (rol === 'medico') {
    if (!ci) return Swal.fire('Error', 'Ingresa tu CI', 'warning');
    datos.ci = ci;
  } else if (rol === 'admin') {
    if (!correo) return Swal.fire('Error', 'Ingresa tu correo', 'warning');
    datos.correo = correo;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje);

    token = data.token;
    usuarioActual = data.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioActual));

    Swal.fire('✅ Bienvenido', `Hola ${usuarioActual.nombres}`, 'success')
      .then(() => cargarInterfazSegunRol());
  } catch (err) {
    Swal.fire('❌ Error', err.message, 'error');
  }
}

async function registrarUsuario(e) {
  e.preventDefault();
  try {
    const datos = await apiRequest('/api/auth/registro', 'POST', {
      ci: document.getElementById('regCi').value,
      nombres: document.getElementById('regNombres').value,
      correo: document.getElementById('regCorreo').value,
      celular: document.getElementById('regCelular').value,
      direccion: document.getElementById('regDireccion').value,
      password: document.getElementById('regPassword').value,
      confirmPassword: document.getElementById('regConfirmPassword').value
    });
    
    token = datos.token;
    usuarioActual = datos.usuario;
    localStorage.setItem('token', token);
    
    Swal.fire({ icon: 'success', title: '¡Registro Exitoso!', timer: 1500, showConfirmButton: false });
    cargarInterfazSegunRol();
  } catch (error) {
    Swal.fire('Error en el registro', error.message, 'error');
  }
}

function cerrarSesion() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Volverás a la pantalla de inicio',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#9333EA',
    cancelButtonColor: '#EF4444',
    confirmButtonText: 'Sí, cerrar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      token = null;
      usuarioActual = null;
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');

      document.getElementById('navbar').style.display = 'none';
      document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
      document.getElementById('vistaInicio').style.display = 'flex';
      document.getElementById('vistaSeleccionRol').style.display = 'flex';

      document.getElementById('formLogin').reset();
      document.getElementById('formRegistro').reset();
      document.getElementById('loginRol').value = '';
      document.getElementById('camposLogin').style.display = 'none';
      document.getElementById('tabsAuth').style.display = 'none';
      document.getElementById('loginHint').textContent = '';
      document.querySelectorAll('.rol-card').forEach(card => card.classList.remove('seleccionado'));
    }
  });
}

// CARGA DE INTERFAZ
function cargarInterfazSegunRol() {
  document.getElementById('navbar').style.display = 'flex';
  document.getElementById('userName').textContent = usuarioActual.nombres;
  document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
  
  const navMenu = document.getElementById('navMenu');
  navMenu.innerHTML = '';
  
  if (usuarioActual.rol === 'paciente') {
    navMenu.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaAgendar', this)">Agendar Cita</button>
      <button onclick="mostrarVista('vistaMisCitas', this)">Mis Citas</button>
      <button onclick="mostrarVista('vistaPerfil', this)">Mi Perfil</button>
    `;
    mostrarVista('vistaAgendar');
    document.getElementById('citaFecha').min = new Date().toISOString().split('T')[0];
  } else if (usuarioActual.rol === 'medico') {
    navMenu.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaMedicoCalendario', this)">Mi Calendario</button>
      <button onclick="mostrarVista('vistaMedicoCitas', this)">Gestión de Citas</button>
    `;
    mostrarVista('vistaMedicoCalendario');
  } else if (usuarioActual.rol === 'admin') {
    navMenu.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaAdminUsuarios', this)">Gestión Usuarios</button>
      <button onclick="mostrarVista('vistaAdminEstadisticas', this)">Estadísticas</button>
    `;
    mostrarVista('vistaAdminUsuarios');
  }
}

function mostrarVista(idVista, btn = null) {
  document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
  document.getElementById(idVista).style.display = 'block';
  
  if (btn) {
    document.querySelectorAll('.nav-menu button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  
  if (idVista === 'vistaAgendar') cargarMedicos();
  if (idVista === 'vistaMisCitas') cargarMisCitas();
  if (idVista === 'vistaPerfil') cargarPerfil();
  if (idVista === 'vistaMedicoCalendario') cargarCalendarioMedico();
  if (idVista === 'vistaMedicoCitas') cargarCitasMedico('hoy', document.querySelectorAll('.filtros-medico .filtro-btn')[1]);
  if (idVista === 'vistaAdminUsuarios') cargarUsuariosAdmin();
  if (idVista === 'vistaAdminEstadisticas') cargarEstadisticas();
}

// CARGA DE MÉDICOS
async function cargarMedicos() {
  const selectMedicos = document.getElementById('citaMedico');
  if (!selectMedicos || !token) return;

  selectMedicos.innerHTML = '<option value="">Seleccione un médico</option>';

  try {
    const respuesta = await fetch('/api/medicos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!respuesta.ok) throw new Error('Error al cargar');
    const medicos = await respuesta.json();

    if (medicos.length === 0) {
      selectMedicos.innerHTML = '<option value="">No hay médicos disponibles</option>';
      return;
    }

    medicos.forEach(medico => {
      const opcion = document.createElement('option');
      opcion.value = medico._id;
      opcion.textContent = `${medico.nombres} | ${medico.especialidad}`;
      selectMedicos.appendChild(opcion);
    });
  } catch (error) {
    Swal.fire('Error', 'No se pudo cargar la lista de médicos', 'error');
  }
}

async function agendarCita(e) {
  e.preventDefault();
  try {
    await apiRequest('/api/citas', 'POST', {
      medicoId: document.getElementById('citaMedico').value,
      especialidad: document.getElementById('citaEspecialidad').value,
      fecha: document.getElementById('citaFecha').value,
      hora: document.getElementById('citaHora').value,
      motivo: document.getElementById('citaMotivo').value
    });
    
    Swal.fire({ icon: 'success', title: '¡Cita Agendada!', timer: 2000, showConfirmButton: false });
    e.target.reset();
    document.getElementById('citaMedico').innerHTML = '<option value="">Seleccione un médico</option>';
  } catch (error) {
    Swal.fire('No se pudo agendar', error.message, 'error');
  }
}

// RESTO DE FUNCIONES (mis citas, perfil, médico, admin)
async function cargarMisCitas() { /* ... */ }
async function cancelarCita(id) { /* ... */ }
function abrirModalReagendar(id) { /* ... */ }
async function confirmarReagendar() { /* ... */ }
function cargarPerfil() { /* ... */ }
async function actualizarPerfil(e) { /* ... */ }
function cargarCalendarioMedico() { /* ... */ }
function cambiarMes(d) { /* ... */ }
function generarCalendario() { /* ... */ }
function seleccionarDia(f) { /* ... */ }
function cargarHorariosDia() { /* ... */ }
function toggleHorario(f, h, el) { /* ... */ }
function guardarDisponibilidad() { /* ... */ }
async function cargarCitasMedico(r, b) { /* ... */ }
function filtrarCitasMedico(e, b) { /* ... */ }
function renderizarCitasMedico(c) { /* ... */ }
function abrirModalEditarCita(i, e, h, r) { /* ... */ }
async function guardarEdicionCita() { /* ... */ }
async function cargarUsuariosAdmin() { /* ... */ }
async function cambiarPasswordAdmin(id, n) { /* ... */ }
async function eliminarUsuario(id, n) { /* ... */ }
function mostrarModalAgregarMedico() { /* ... */ }
async function agregarMedico(e) { /* ... */ }
async function cargarEstadisticas() { /* ... */ }

// INICIO
window.onload = async () => {
  if (token) {
    try {
      const datos = await apiRequest('/api/auth/verify');
      usuarioActual = datos.usuario;
      cargarInterfazSegunRol();
      return;
    } catch (e) {
      localStorage.removeItem('token');
      token = null;
    }
  }
  document.getElementById('vistaInicio').style.display = 'flex';
  document.getElementById('camposLogin').style.display = 'none';
  document.getElementById('tabsAuth').style.display = 'none';
};

window.onclick = (e) => {
  document.querySelectorAll('.modal').forEach(m => {
    if (e.target === m) m.style.display = 'none';
  });
};