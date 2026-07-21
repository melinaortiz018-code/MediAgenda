let usuarioActual = null;
let token = localStorage.getItem('token') || null;
const API_BASE = '';

// Variables globales para calendario del médico
let mesActual = new Date();
let diaSeleccionado = null;
let citasMedicoActuales = [];
let disponibilidadHorarios = {};

// ==================== UTILIDADES ====================
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

// ==================== LOGIN POR ROLES ====================
function seleccionarRol(rol, elemento) {
  // Estilo de tarjetas
  document.querySelectorAll('.rol-card').forEach(card => {
    card.style.background = 'var(--blanco)';
    card.style.borderColor = 'var(--borde)';
    card.style.transform = 'none';
    card.style.boxShadow = 'none';
  });
  
  elemento.style.background = 'var(--tarjeta)';
  elemento.style.borderColor = 'var(--principal)';
  elemento.style.transform = 'translateY(-3px)';
  elemento.style.boxShadow = '0 6px 18px rgba(147, 51, 234, 0.25)';
  
  document.getElementById('loginRol').value = rol;
  
  const campoCi = document.getElementById('campoCi');
  const campoCorreo = document.getElementById('campoCorreo');
  const camposLogin = document.getElementById('camposLogin');
  const tabsAuth = document.getElementById('tabsAuth');
  const ciInput = document.getElementById('loginCi');
  const correoInput = document.getElementById('loginCorreo');
  const hint = document.getElementById('loginHint');
  
  // Limpiar
  ciInput.required = false;
  correoInput.required = false;
  ciInput.value = '';
  correoInput.value = '';
  document.getElementById('loginPassword').value = '';
  
  // Mostrar contenedor de campos
  camposLogin.style.display = 'block';
  
  // Ocultar pestañas de registro por defecto
  tabsAuth.style.display = 'none';
  document.getElementById('formRegistro').style.display = 'none';
  document.getElementById('formLogin').style.display = 'block';
  
  if (rol === 'paciente') {
    // Paciente: mostrar pestañas de login/registro
    tabsAuth.style.display = 'flex';
    campoCi.style.display = 'block';
    campoCorreo.style.display = 'block';
    ciInput.required = true;
    correoInput.required = true;
    hint.textContent = '👤 Pacientes: Ingrese su CI y Correo, o regístrese';
  } 
  else if (rol === 'medico') {
    campoCi.style.display = 'block';
    campoCorreo.style.display = 'none';
    ciInput.required = true;
    correoInput.required = false;
    hint.textContent = '🩺 Médicos: Ingrese su CI (ej: MED001)';
  } 
  else if (rol === 'admin') {
    campoCi.style.display = 'none';
    campoCorreo.style.display = 'block';
    ciInput.required = false;
    correoInput.required = true;
    hint.textContent = '🛡️ Administrador: Ingrese su correo';
  }
}

function ajustarCamposLogin() {
  // Función de compatibilidad
}

// ==================== PETICIONES API ====================
async function apiRequest(endpoint, method = 'GET', body = null) {
  const opciones = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opciones.headers['Authorization'] = `Bearer ${token}`;
  if (body) opciones.body = JSON.stringify(body);
  
  const respuesta = await fetch(`${API_BASE}${endpoint}`, opciones);
  const datos = await respuesta.json();
  
  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'Error en la solicitud');
  }
  return datos;
}

// ==================== AUTENTICACIÓN ====================
async function iniciarSesion(e) {
  e.preventDefault();
  try {
    const rol = document.getElementById('loginRol').value;
    const ci = document.getElementById('loginCi').value.trim();
    const correo = document.getElementById('loginCorreo').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!rol) {
      Swal.fire('Aviso', 'Primero seleccione un tipo de cuenta', 'warning');
      return;
    }
    
    const bodySolicitud = { rol, password };
    
    if (rol === 'paciente') {
      if (!ci || !correo) {
        Swal.fire('Aviso', 'Pacientes deben ingresar CI y Correo', 'warning');
        return;
      }
      bodySolicitud.ci = ci;
      bodySolicitud.correo = correo;
    } 
    else if (rol === 'medico') {
      if (!ci) {
        Swal.fire('Aviso', 'Médicos deben ingresar su CI', 'warning');
        return;
      }
      bodySolicitud.ci = ci;
    } 
    else if (rol === 'admin') {
      if (!correo) {
        Swal.fire('Aviso', 'Administrador debe ingresar su correo', 'warning');
        return;
      }
      bodySolicitud.correo = correo;
    }
    
    const datos = await apiRequest('/api/auth/login', 'POST', bodySolicitud);
    
    token = datos.token;
    usuarioActual = datos.usuario;
    localStorage.setItem('token', token);
    
    Swal.fire({ 
      icon: 'success', 
      title: '¡Bienvenido!', 
      text: datos.usuario.nombres, 
      timer: 1500, 
      showConfirmButton: false 
    });
    
    cargarInterfazSegunRol();
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Error', text: error.message });
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
    
    Swal.fire({ icon: 'success', title: '¡Registro Exitoso!', text: 'Tu cuenta ha sido creada correctamente', timer: 1500, showConfirmButton: false });
    cargarInterfazSegunRol();
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Error en el registro', text: error.message });
  }
}

function cerrarSesion() {
  Swal.fire({
    title: '¿Está seguro?',
    text: '¿Desea cerrar su sesión?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#9333EA',
    cancelButtonColor: '#EF4444',
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      token = null;
      usuarioActual = null;
      localStorage.removeItem('token');
      document.getElementById('navbar').style.display = 'none';
      document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
      document.getElementById('vistaInicio').style.display = 'flex';
      document.getElementById('formLogin').reset();
      document.getElementById('loginRol').value = '';
      document.getElementById('camposLogin').style.display = 'none';
      document.getElementById('tabsAuth').style.display = 'none';
      document.getElementById('loginHint').textContent = '';
      document.querySelectorAll('.rol-card').forEach(card => {
        card.style.background = 'var(--blanco)';
        card.style.borderColor = 'var(--borde)';
        card.style.transform = 'none';
        card.style.boxShadow = 'none';
      });
    }
  });
}

// ==================== CARGAR INTERFAZ ====================
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
  } 
  else if (usuarioActual.rol === 'medico') {
    navMenu.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaMedicoCalendario', this)">Mi Calendario</button>
      <button onclick="mostrarVista('vistaMedicoCitas', this)">Gestión de Citas</button>
    `;
    mostrarVista('vistaMedicoCalendario');
  } 
  else if (usuarioActual.rol === 'admin') {
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
  
  if (idVista === 'vistaMisCitas') cargarMisCitas();
  if (idVista === 'vistaPerfil') cargarPerfil();
  if (idVista === 'vistaMedicoCalendario') cargarCalendarioMedico();
  if (idVista === 'vistaMedicoCitas') cargarCitasMedico('hoy', document.querySelectorAll('.filtros-medico .filtro-btn')[1]);
  if (idVista === 'vistaAdminUsuarios') cargarUsuariosAdmin();
  if (idVista === 'vistaAdminEstadisticas') cargarEstadisticas();
}

// ==================== PACIENTE: AGENDAR CITA ====================
async function cargarMedicosPorEspecialidad() {
  const especialidad = document.getElementById('citaEspecialidad').value;
  const selectMedico = document.getElementById('citaMedico');
  
  if (!especialidad) {
    selectMedico.innerHTML = '<option value="">Primero seleccione especialidad</option>';
    return;
  }
  
  try {
    const medicos = await apiRequest('/api/medicos');
    const medicosFiltrados = medicos.filter(m => m.especialidad === especialidad);
    
    selectMedico.innerHTML = '<option value="">Seleccione un médico</option>';
    medicosFiltrados.forEach(m => {
      selectMedico.innerHTML += `<option value="${m._id}">${m.nombres} (${m.genero === 'M' ? 'Dr.' : 'Dra.'})</option>`;
    });
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los médicos', 'error');
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
    
    Swal.fire({ icon: 'success', title: '¡Cita Agendada!', text: 'Tu cita ha sido reservada correctamente' });
    e.target.reset();
    document.getElementById('citaMedico').innerHTML = '<option value="">Primero seleccione especialidad</option>';
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo agendar', text: error.message });
  }
}

// ==================== PACIENTE: MIS CITAS ====================
async function cargarMisCitas() {
  try {
    const citas = await apiRequest('/api/mis-citas');
    const contenedor = document.getElementById('listaMisCitas');
    
    if (citas.length === 0) {
      contenedor.innerHTML = '<div class="cita-card"><p style="text-align:center;color:var(--texto-claro);">No tienes citas agendadas aún</p></div>';
      return;
    }
    
    contenedor.innerHTML = citas.map(cita => {
      const puedeModificar = verificarTiempoRestante(cita.fecha, cita.hora) && ['Pendiente', 'Confirmada', 'Reagendada'].includes(cita.estado);
      return `
        <div class="cita-card ${cita.estado.toLowerCase()}">
          <div class="cita-header">
            <span class="cita-especialidad">${cita.especialidad}</span>
            <span class="cita-estado estado-${cita.estado}">${cita.estado}</span>
          </div>
          <div class="cita-info">
            <p><strong>👨‍⚕️ Médico:</strong> ${cita.medico.nombres}</p>
            <p><strong>📅 Fecha:</strong> ${formatearFecha(cita.fecha)}</p>
            <p><strong>⏰ Hora:</strong> ${cita.hora}</p>
            <p><strong>📝 Motivo:</strong> ${cita.motivo}</p>
            ${cita.recetaObservaciones ? `<p><strong>💊 Receta/Obs:</strong> ${cita.recetaObservaciones}</p>` : ''}
          </div>
          <div class="cita-acciones">
            <button class="btn-reagendar" onclick="abrirModalReagendar('${cita._id}')" ${!puedeModificar ? 'disabled' : ''}>
              ${!puedeModificar && !['Pendiente', 'Confirmada', 'Reagendada'].includes(cita.estado) ? 'No disponible' : 'Reagendar'}
            </button>
            <button class="btn-cancelar" onclick="cancelarCita('${cita._id}')" ${!puedeModificar ? 'disabled' : ''}>
              ${!puedeModificar && !['Pendiente', 'Confirmada', 'Reagendada'].includes(cita.estado) ? 'No disponible' : 'Cancelar'}
            </button>
          </div>
          ${!puedeModificar && ['Pendiente', 'Confirmada', 'Reagendada'].includes(cita.estado) ? 
            '<p style="margin-top:0.8rem;font-size:0.8rem;color:var(--rojo);text-align:center;">⚠️ Menos de 24h para la cita - No se puede modificar</p>' : ''}
        </div>
      `;
    }).join('');
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar las citas', 'error');
  }
}

async function cancelarCita(idCita) {
  const confirmacion = await Swal.fire({
    title: '¿Está seguro?',
    text: '¿Desea cancelar esta cita? Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#9333EA',
    confirmButtonText: 'Sí, cancelar cita',
    cancelButtonText: 'Volver'
  });
  
  if (confirmacion.isConfirmed) {
    try {
      await apiRequest(`/api/citas/${idCita}/cancelar`, 'PUT');
      Swal.fire('Cancelada', 'La cita ha sido cancelada exitosamente', 'success');
      cargarMisCitas();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  }
}

function abrirModalReagendar(idCita) {
  document.getElementById('reagendarCitaId').value = idCita;
  document.getElementById('nuevaFecha').min = new Date().toISOString().split('T')[0];
  document.getElementById('modalReagendar').style.display = 'flex';
}

async function confirmarReagendar() {
  const idCita = document.getElementById('reagendarCitaId').value;
  const nuevaFecha = document.getElementById('nuevaFecha').value;
  const nuevaHora = document.getElementById('nuevaHora').value;
  
  if (!nuevaFecha || !nuevaHora) {
    Swal.fire('Aviso', 'Seleccione nueva fecha y hora', 'warning');
    return;
  }
  
  const confirmacion = await Swal.fire({
    title: 'Confirmar reagendamiento',
    text: `¿Desea cambiar la cita para el ${formatearFecha(nuevaFecha)} a las ${nuevaHora}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#FACC15',
    cancelButtonColor: '#9333EA',
    confirmButtonText: 'Sí, reagendar'
  });
  
  if (confirmacion.isConfirmed) {
    try {
      await apiRequest(`/api/citas/${idCita}/reagendar`, 'PUT', { nuevaFecha, nuevaHora });
      Swal.fire('Reagendada', 'La cita ha sido actualizada exitosamente', 'success');
      cerrarModal('modalReagendar');
      cargarMisCitas();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  }
}

// ==================== PACIENTE: PERFIL ====================
function cargarPerfil() {
  document.getElementById('perfilCi').value = usuarioActual.ci;
  document.getElementById('perfilNombres').value = usuarioActual.nombres;
  document.getElementById('perfilCorreo').value = usuarioActual.correo;
  document.getElementById('perfilCelular').value = usuarioActual.celular || '';
  document.getElementById('perfilDireccion').value = usuarioActual.direccion || '';
}

async function actualizarPerfil(e) {
  e.preventDefault();
  try {
    const datos = await apiRequest('/api/perfil', 'PUT', {
      correo: document.getElementById('perfilCorreo').value,
      celular: document.getElementById('perfilCelular').value,
      direccion: document.getElementById('perfilDireccion').value
    });
    usuarioActual = { ...usuarioActual, ...datos.usuario };
    Swal.fire('Actualizado', 'Tu perfil ha sido actualizado correctamente', 'success');
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}

// ==================== MÉDICO: CALENDARIO Y DISPONIBILIDAD ====================
function cargarCalendarioMedico() {
  mesActual = new Date();
  diaSeleccionado = new Date();
  generarCalendario();
  cargarHorariosDia();
}

function cambiarMes(direccion) {
  mesActual.setMonth(mesActual.getMonth() + direccion);
  generarCalendario();
}

function generarCalendario() {
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  document.getElementById('mesActual').textContent = `${meses[mesActual.getMonth()]} ${mesActual.getFullYear()}`;
  
  // Encabezado de días
  document.getElementById('diasSemana').innerHTML = diasSemana.map(d => `<div>${d}</div>`).join('');
  
  const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay();
  const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate();
  const hoy = new Date();
  const hoyStr = formatearFechaCorta(hoy);
  
  let html = '';
  
  // Espacios vacíos antes del primer día
  for (let i = 0; i < primerDia; i++) {
    html += '<div></div>';
  }
  
  // Días del mes
  for (let dia = 1; dia <= ultimoDia; dia++) {
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    const fechaStr = formatearFechaCorta(fecha);
    const esHoy = fechaStr === hoyStr;
    const esSeleccionado = fechaStr === formatearFechaCorta(diaSeleccionado);
    const esPasado = fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    let estilo = 'padding:1rem;text-align:center;border-radius:8px;cursor:pointer;transition:all 0.2s;';
    if (esHoy) estilo += 'background:var(--principal);color:white;font-weight:700;';
    else if (esSeleccionado) estilo += 'background:var(--tarjeta);border:2px solid var(--principal);font-weight:700;';
    else if (esPasado) estilo += 'color:var(--texto-claro);cursor:not-allowed;';
    else estilo += 'hover:background:var(--tarjeta);';
    
    html += `<div style="${estilo}" onclick="${!esPasado ? `seleccionarDia('${fechaStr}')` : ''}">${dia}</div>`;
  }
  
  document.getElementById('calendarioDias').innerHTML = html;
}

function seleccionarDia(fechaStr) {
  diaSeleccionado = new Date(fechaStr + 'T00:00:00');
  generarCalendario();
  cargarHorariosDia();
}

function cargarHorariosDia() {
  const horarios = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const fechaStr = formatearFechaCorta(diaSeleccionado);
  
  document.getElementById('diaSeleccionado').textContent = formatearFecha(fechaStr);
  
  // Inicializar disponibilidad para este día si no existe
  if (!disponibilidadHorarios[fechaStr]) {
    disponibilidadHorarios[fechaStr] = {};
    horarios.forEach(h => disponibilidadHorarios[fechaStr][h] = true); // Por defecto disponible
  }
  
  const html = horarios.map(hora => {
    const disponible = disponibilidadHorarios[fechaStr][hora];
    const estilo = disponible 
      ? 'background:#10B981;color:white;padding:0.8rem;border-radius:8px;text-align:center;cursor:pointer;font-weight:600;transition:all 0.2s;hover:opacity:0.8;'
      : 'background:#EF4444;color:white;padding:0.8rem;border-radius:8px;text-align:center;cursor:pointer;font-weight:600;transition:all 0.2s;hover:opacity:0.8;';
    
    return `<div style="${estilo}" onclick="toggleHorario('${fechaStr}', '${hora}', this)">
      ${hora} - ${disponible ? '✓ Disponible' : '✗ No Disponible'}
    </div>`;
  }).join('');
  
  document.getElementById('listaHorarios').innerHTML = html;
}

function toggleHorario(fechaStr, hora, elemento) {
  disponibilidadHorarios[fechaStr][hora] = !disponibilidadHorarios[fechaStr][hora];
  cargarHorariosDia();
}

function guardarDisponibilidad() {
  Swal.fire({
    icon: 'success',
    title: '¡Disponibilidad Guardada!',
    text: `Tu disponibilidad para el ${formatearFecha(formatearFechaCorta(diaSeleccionado))} ha sido actualizada correctamente`,
    timer: 2000,
    showConfirmButton: false
  });
}

// ==================== MÉDICO: GESTIÓN DE CITAS ====================
async function cargarCitasMedico(rango, btn) {
  if (btn) {
    // Quitar active de todos los filtros de esta sección
    const filtros = btn.closest('.filtros-medico');
    filtros.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  
  try {
    citasMedicoActuales = await apiRequest(`/api/medico/citas?rango=${rango}`);
    renderizarCitasMedico(citasMedicoActuales);
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar las citas', 'error');
  }
}

function filtrarCitasMedico(estado, btn) {
  // Quitar active de todos los filtros de esta sección
  const filtros = btn.closest('.filtros-medico');
  filtros.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  if (estado === 'todas') {
    renderizarCitasMedico(citasMedicoActuales);
    return;
  }
  
  const citasFiltradas = citasMedicoActuales.filter(c => c.estado === estado);
  renderizarCitasMedico(citasFiltradas);
}

function renderizarCitasMedico(citas) {
  const contenedor = document.getElementById('listaCitasMedico');
  
  if (citas.length === 0) {
    contenedor.innerHTML = '<div class="cita-card"><p style="text-align:center;color:var(--texto-claro);">No hay citas para este filtro</p></div>';
    return;
  }
  
  contenedor.innerHTML = citas.map(cita => `
    <div class="cita-card ${cita.estado.toLowerCase()}">
      <div class="cita-header">
        <span class="cita-especialidad">${cita.especialidad}</span>
        <span class="cita-estado estado-${cita.estado}">${cita.estado}</span>
      </div>
      <div class="cita-info">
        <p><strong>👤 Paciente:</strong> ${cita.paciente.nombres}</p>
        <p><strong>🆔 CI:</strong> ${cita.paciente.ci}</p>
        <p><strong>📧 Correo:</strong> ${cita.paciente.correo}</p>
        <p><strong>📱 Celular:</strong> ${cita.paciente.celular || 'No registrado'}</p>
        <p><strong>📍 Dirección:</strong> ${cita.paciente.direccion || 'No registrada'}</p>
        <p><strong>📅 Fecha:</strong> ${formatearFecha(cita.fecha)}</p>
        <p><strong>⏰ Hora:</strong> ${cita.hora}</p>
        <p><strong>📝 Motivo:</strong> ${cita.motivo}</p>
        ${cita.recetaObservaciones ? `<p><strong>💊 Receta/Obs:</strong> ${cita.recetaObservaciones}</p>` : ''}
      </div>
      <div class="cita-acciones">
        <button class="btn-editar" onclick="abrirModalEditarCita('${cita._id}', '${cita.estado}', '${cita.hora}', '${(cita.recetaObservaciones || '').replace(/'/g, "\\'")}')">
          ✏️ Editar Cita
        </button>
      </div>
    </div>
  `).join('');
}

function abrirModalEditarCita(id, estado, hora, receta) {
  document.getElementById('editarCitaId').value = id;
  document.getElementById('editarEstado').value = estado;
  document.getElementById('editarHora').value = hora;
  document.getElementById('editarReceta').value = receta;
  document.getElementById('modalEditarCita').style.display = 'flex';
}

async function guardarEdicionCita() {
  const id = document.getElementById('editarCitaId').value;
  try {
    await apiRequest(`/api/medico/citas/${id}`, 'PUT', {
      estado: document.getElementById('editarEstado').value,
      hora: document.getElementById('editarHora').value,
      recetaObservaciones: document.getElementById('editarReceta').value
    });
    Swal.fire('Actualizada', 'La cita ha sido actualizada exitosamente', 'success');
    cerrarModal('modalEditarCita');
    // Recargar citas
    const btnRango = document.querySelectorAll('.filtros-medico')[1].querySelector('.filtro-btn.active');
    const rango = btnRango.textContent.toLowerCase().includes('hoy') ? 'hoy' : 
                btnRango.textContent.toLowerCase().includes('semana') ? 'semana' : 'meses';
    cargarCitasMedico(rango, btnRango);
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}

// ==================== ADMIN: USUARIOS ====================
async function cargarUsuariosAdmin() {
  try {
    const usuarios = await apiRequest('/api/admin/usuarios');
    const tbody = document.getElementById('tablaUsuarios');
    
    tbody.innerHTML = usuarios.map(u => `
      <tr>
        <td>${u.ci}</td>
        <td>${u.nombres}</td>
        <td>${u.correo}</td>
        <td><strong>${u.rol}</strong></td>
        <td>${u.especialidad || '-'}</td>
        <td><button class="btn-editar" onclick="verPassword('${u.password}')">Ver</button></td>
        <td class="acciones">
          <button class="btn-editar" onclick="cambiarPasswordAdmin('${u._id}', '${u.nombres}')">Cambiar Pass</button>
          ${u.rol !== 'admin' ? `<button class="btn-cancelar" onclick="eliminarUsuario('${u._id}', '${u.nombres}')">Eliminar</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
  }
}

function verPassword(hash) {
  Swal.fire({
    title: 'Contraseña (Encriptada)',
    text: `Por seguridad solo se muestra el hash:\n\n${hash.substring(0, 60)}...`,
    icon: 'info',
    confirmButtonColor: '#9333EA'
  });
}

async function cambiarPasswordAdmin(id, nombre) {
  const { value: nuevaPass } = await Swal.fire({
    title: `Cambiar contraseña a ${nombre}`,
    input: 'text',
    inputLabel: 'Nueva contraseña (mínimo 6 caracteres)',
    inputPlaceholder: 'Ingrese nueva contraseña temporal',
    showCancelButton: true,
    confirmButtonColor: '#9333EA',
    cancelButtonColor: '#EF4444',
    inputValidator: (value) => {
      if (!value || value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    }
  });
  
  if (nuevaPass) {
    try {
      await apiRequest(`/api/admin/usuarios/${id}/password`, 'PUT', { nuevaPassword: nuevaPass });
      Swal.fire('Actualizada', 'Contraseña actualizada exitosamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  }
}

async function eliminarUsuario(id, nombre) {
  const confirmacion = await Swal.fire({
    title: '¿Eliminar usuario?',
    text: `Está a punto de eliminar a ${nombre}. Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#9333EA',
    confirmButtonText: 'Sí, eliminar'
  });
  
  if (confirmacion.isConfirmed) {
    try {
      await apiRequest(`/api/admin/usuarios/${id}`, 'DELETE');
      Swal.fire('Eliminado', 'Usuario eliminado exitosamente', 'success');
      cargarUsuariosAdmin();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  }
}

function mostrarModalAgregarMedico() {
  document.getElementById('modalAgregarMedico').style.display = 'flex';
}

async function agregarMedico(e) {
  e.preventDefault();
  try {
    await apiRequest('/api/admin/medicos', 'POST', {
      ci: document.getElementById('medicoCi').value,
      nombres: document.getElementById('medicoNombres').value,
      correo: document.getElementById('medicoCorreo').value,
      celular: document.getElementById('medicoCelular').value,
      especialidad: document.getElementById('medicoEspecialidad').value,
      genero: document.getElementById('medicoGenero').value,
      password: document.getElementById('medicoPassword').value
    });
    Swal.fire('Agregado', 'Médico agregado exitosamente al sistema', 'success');
    cerrarModal('modalAgregarMedico');
    e.target.reset();
    cargarUsuariosAdmin();
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}

// ==================== ADMIN: ESTADÍSTICAS ====================
async function cargarEstadisticas() {
  try {
    const stats = await apiRequest('/api/admin/estadisticas');
    
    document.getElementById('estadisticasGrid').innerHTML = `
      <div class="stat-card"><div class="stat-numero">${stats.totalCitas}</div><div class="stat-titulo">Total Citas</div></div>
      <div class="stat-card"><div class="stat-numero" style="color:#10B981">${stats.exitosas}</div><div class="stat-titulo">Exitosas</div></div>
      <div class="stat-card"><div class="stat-numero" style="color:#EF4444">${stats.canceladas}</div><div class="stat-titulo">Canceladas</div></div>
      <div class="stat-card"><div class="stat-numero" style="color:#F59E0B">${stats.reagendadas}</div><div class="stat-titulo">Reagendadas</div></div>
      <div class="stat-card"><div class="stat-numero" style="color:#3B82F6">${stats.pendientes}</div><div class="stat-titulo">Pendientes</div></div>
    `;
    
    const maxTotal = Math.max(...stats.porEspecialidad.map(e => e.total), 1);
    document.getElementById('graficoEspecialidades').innerHTML = stats.porEspecialidad.map(e => `
      <div class="barra-especialidad">
        <div class="barra-label"><span>${e.especialidad}</span><span>${e.total} citas</span></div>
        <div class="barra-fondo"><div class="barra-llena" style="width:${(e.total / maxTotal * 100)}%">${e.total}</div></div>
      </div>
    `).join('');
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar las estadísticas', 'error');
  }
}

// ==================== INICIALIZACIÓN ====================
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
  document.getElementById('campoCi').style.display = 'none';
  document.getElementById('campoCorreo').style.display = 'none';
  document.getElementById('camposLogin').style.display = 'none';
  document.getElementById('tabsAuth').style.display = 'none';
};

// Cerrar modales al hacer clic fuera
window.onclick = (e) => {
  document.querySelectorAll('.modal').forEach(modal => {
    if (e.target === modal) modal.style.display = 'none';
  });
};