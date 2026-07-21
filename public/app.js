let usuarioActual = null;
let token = localStorage.getItem('token') || null;
const API_BASE = '';

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

// SELECCIÓN DE ROL Y FORMULARIO
function seleccionarRol(rolElegido, elemento) {
  // Resaltar tarjeta
  document.querySelectorAll('.rol-card').forEach(card => {
    card.style.background = '#ffffff';
    card.style.borderColor = '#9333EA';
  });
  elemento.style.background = '#f3e8ff';
  elemento.style.borderColor = '#7e22ce';

  // Elementos
  const loginRol = document.getElementById('loginRol');
  const grupoCI = document.getElementById('grupoLoginCI');
  const grupoCorreo = document.getElementById('grupoLoginCorreo');
  const tabsAuth = document.getElementById('tabsAuth');
  const ciInput = document.getElementById('loginCI');
  const correoInput = document.getElementById('loginCorreo');
  const passwordInput = document.getElementById('loginPassword');
  const hint = document.getElementById('loginHint');

  // Asignar y limpiar
  loginRol.value = rolElegido;
  ciInput.value = '';
  correoInput.value = '';
  passwordInput.value = '';
  grupoCI.style.display = 'none';
  grupoCorreo.style.display = 'none';
  tabsAuth.style.display = 'none';

  // Configurar por rol
  if (rolElegido === 'paciente') {
    tabsAuth.style.display = 'flex';
    grupoCI.style.display = 'flex';
    grupoCorreo.style.display = 'flex';
    hint.textContent = '👤 Ingresa CI y Correo, o regístrate';
  } else if (rolElegido === 'medico') {
    grupoCI.style.display = 'flex';
    hint.textContent = '🩺 Ingresa tu CI (ej: MED001) y contraseña';
  } else if (rolElegido === 'admin') {
    grupoCorreo.style.display = 'flex';
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
  
  const res = await fetch(`${API_BASE}${endpoint}`, opciones);
  const datos = await res.json();
  if (!res.ok) throw new Error(datos.mensaje || 'Error');
  return datos;
}

// ✅ LOGIN ARREGLADO PARA MÉDICOS
async function iniciarSesion() {
  const rol = document.getElementById('loginRol').value;
  const ci = document.getElementById('loginCI').value.trim();
  const correo = document.getElementById('loginCorreo').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!rol) return Swal.fire('Error', 'Selecciona un tipo de cuenta', 'warning');
  if (!password) return Swal.fire('Error', 'Escribe tu contraseña', 'warning');

  // ✅ Enviar SOLO los datos que pide el backend — SIN undefined
  const datos = { rol, password };
  if (rol === 'paciente') {
    if (!ci || !correo) return Swal.fire('Error', 'Paciente necesita CI y Correo', 'warning');
    datos.ci = ci;
    datos.correo = correo;
  } else if (rol === 'medico') {
    if (!ci) return Swal.fire('Error', 'Médico necesita solo el CI', 'warning');
    datos.ci = ci; // ✅ NO envía correo, solo CI
  } else if (rol === 'admin') {
    if (!correo) return Swal.fire('Error', 'Admin necesita solo el correo', 'warning');
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
    Swal.fire('✅ Registro exitoso', '', 'success').then(() => cargarInterfazSegunRol());
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}

function cerrarSesion() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Volverás a la pantalla de inicio',
    icon: 'warning',
    confirmButtonColor: '#9333EA',
    cancelButtonColor: '#EF4444',
    confirmButtonText: 'Sí, cerrar',
    cancelButtonText: 'Cancelar'
  }).then(res => {
    if (res.isConfirmed) {
      token = null;
      usuarioActual = null;
      localStorage.clear();
      document.getElementById('navbar').style.display = 'none';
      document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
      document.getElementById('vistaInicio').style.display = 'flex';
      document.getElementById('camposLogin').style.display = 'none';
      document.getElementById('tabsAuth').style.display = 'none';
      document.getElementById('loginRol').value = '';
      document.querySelectorAll('.rol-card').forEach(c => {
        c.style.background = '#fff';
        c.style.borderColor = '#9333EA';
      });
    }
  });
}

// CARGA DE INTERFAZ
function cargarInterfazSegunRol() {
  document.getElementById('navbar').style.display = 'flex';
  document.getElementById('userName').textContent = usuarioActual.nombres;
  document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
  
  const nav = document.getElementById('navMenu');
  nav.innerHTML = '';

  if (usuarioActual.rol === 'paciente') {
    nav.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaAgendar', this)">Agendar Cita</button>
      <button onclick="mostrarVista('vistaMisCitas', this)">Mis Citas</button>
      <button onclick="mostrarVista('vistaPerfil', this)">Mi Perfil</button>
    `;
    mostrarVista('vistaAgendar');
  } else if (usuarioActual.rol === 'medico') {
    nav.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaMedicoCalendario', this)">Calendario</button>
      <button onclick="mostrarVista('vistaMedicoCitas', this)">Mis Citas</button>
    `;
    mostrarVista('vistaMedicoCitas');
  } else if (usuarioActual.rol === 'admin') {
    nav.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaAdminUsuarios', this)">Usuarios</button>
      <button onclick="mostrarVista('vistaAdminEstadisticas', this)">Estadísticas</button>
    `;
    mostrarVista('vistaAdminUsuarios');
  }
}

function mostrarVista(id, btn = null) {
  document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  if (btn) {
    document.querySelectorAll('.nav-menu button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  if (id === 'vistaAgendar') cargarMedicos();
  if (id === 'vistaMisCitas') cargarMisCitas();
  if (id === 'vistaAdminUsuarios') cargarUsuariosAdmin();
}

// CARGA DE MÉDICOS
async function cargarMedicos() {
  const select = document.getElementById('citaMedico');
  select.innerHTML = '<option value="">Seleccione un médico</option>';
  try {
    const medicos = await apiRequest('/api/medicos');
    medicos.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m._id;
      opt.textContent = `${m.nombres} - ${m.especialidad}`;
      select.appendChild(opt);
    });
  } catch (e) {
    Swal.fire('Error', 'No se cargaron los médicos', 'error');
  }
}

async function cargarMedicosPorEspecialidad() {
  const esp = document.getElementById('citaEspecialidad').value;
  const select = document.getElementById('citaMedico');
  select.innerHTML = '<option value="">Seleccione un médico</option>';
  try {
    const medicos = await apiRequest('/api/medicos');
    medicos.filter(m => m.especialidad === esp).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m._id;
      opt.textContent = `${m.nombres}`;
      select.appendChild(opt);
    });
  } catch (e) {}
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
    Swal.fire('✅ Cita agendada', '', 'success');
    e.target.reset();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

// FUNCIONES ADICIONALES BÁSICAS
async function cargarMisCitas() {}
async function cargarPerfil() {}
async function actualizarPerfil(e) { e.preventDefault(); }
async function cargarUsuariosAdmin() {
  try {
    const usuarios = await apiRequest('/api/admin/usuarios');
    const tabla = document.getElementById('tablaUsuarios');
    tabla.innerHTML = `
      <tr><th>CI</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Especialidad</th><th>Acciones</th></tr>
    `;
    usuarios.forEach(u => {
      const rol = { paciente:'Paciente', medico:'Médico', admin:'Admin' }[u.rol];
      const esp = u.rol === 'medico' ? u.especialidad : '-';
      tabla.innerHTML += `
        <tr>
          <td>${u.ci}</td><td>${u.nombres}</td><td>${u.correo}</td><td>${rol}</td><td>${esp}</td>
          <td><button onclick="cambiarPass('${u._id}')">Cambiar Pass</button></td>
        </tr>
      `;
    });
  } catch (e) {}
}
async function cambiarPass(id) {}
function mostrarModalAgregarMedico() { document.getElementById('modalAgregarMedico').style.display = 'flex'; }
async function agregarMedico(e) {
  e.preventDefault();
  try {
    await apiRequest('/api/admin/medicos', 'POST', {
      ci: document.getElementById('medicoCi').value,
      nombres: document.getElementById('medicoNombres').value,
      correo: document.getElementById('medicoCorreo').value,
      celular: '',
      especialidad: document.getElementById('medicoEspecialidad').value,
      genero: document.getElementById('medicoGenero').value,
      password: document.getElementById('medicoPassword').value
    });
    Swal.fire('✅ Médico agregado', '', 'success');
    cerrarModal('modalAgregarMedico');
    e.target.reset();
    cargarUsuariosAdmin();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

// INICIO
window.onload = async () => {
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
  if (token) {
    try {
      const res = await apiRequest('/api/auth/verify');
      usuarioActual = res.usuario;
      cargarInterfazSegunRol();
      return;
    } catch {
      localStorage.clear();
      token = null;
    }
  }
  document.getElementById('vistaInicio').style.display = 'flex';
};