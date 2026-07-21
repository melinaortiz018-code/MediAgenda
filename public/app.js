let usuarioActual = null;
let token = localStorage.getItem('token') || null;
const API_BASE = '';

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

function verificarTiempoRestante(fechaCita, horaCita) {
  const fecha = new Date(fechaCita);
  const [h, m] = horaCita.split(':');
  fecha.setHours(parseInt(h), parseInt(m), 0, 0);
  const ahora = new Date();
  const diferencia = (fecha - ahora) / (1000 * 60 * 60);
  return diferencia > 24;
}
// Seleccionar rol al hacer clic en la tarjeta
function seleccionarRol(rol, elemento) {
  // Quitar estilo de selección anterior
  document.querySelectorAll('.rol-card').forEach(card => {
    card.style.background = 'var(--blanco)';
    card.style.borderColor = 'var(--borde)';
    card.style.transform = 'none';
    card.style.boxShadow = 'none';
  });
  
  // Aplicar estilo a la tarjeta seleccionada
  elemento.style.background = 'var(--tarjeta)';
  elemento.style.borderColor = 'var(--principal)';
  elemento.style.transform = 'translateY(-3px)';
  elemento.style.boxShadow = '0 6px 18px rgba(147, 51, 234, 0.25)';
  
  // Guardar rol
  document.getElementById('loginRol').value = rol;
  
  // Mostrar/ocultar campos según el rol (FORZADO para que siempre funcione)
  const campoCi = document.getElementById('campoCi');
  const campoCorreo = document.getElementById('campoCorreo');
  const ciInput = document.getElementById('loginCi');
  const correoInput = document.getElementById('loginCorreo');
  const hint = document.getElementById('loginHint');
  
  // Limpiar siempre
  ciInput.required = false;
  correoInput.required = false;
  ciInput.value = '';
  correoInput.value = '';
  
  // ================== CORRECCIÓN CLAVE ==================
  if (rol === 'paciente') {
    // PACIENTE: Mostrar AMBOS campos
    campoCi.style.setProperty('display', 'block', 'important');
    campoCorreo.style.setProperty('display', 'block', 'important');
    ciInput.required = true;
    correoInput.required = true;
    hint.textContent = '👤 Pacientes: Ingrese su CI y Correo';
  } 
  else if (rol === 'medico') {
    // MÉDICO: Solo CI
    campoCi.style.setProperty('display', 'block', 'important');
    campoCorreo.style.setProperty('display', 'none', 'important');
    ciInput.required = true;
    correoInput.required = false;
    hint.textContent = '🩺 Médicos: Ingrese su CI (ej: MED001)';
  } 
  else if (rol === 'admin') {
    // ADMIN: Solo Correo
    campoCi.style.setProperty('display', 'none', 'important');
    campoCorreo.style.setProperty('display', 'block', 'important');
    ciInput.required = false;
    correoInput.required = true;
    hint.textContent = '🛡️ Administrador: Ingrese su correo';
  }
}

// Eliminamos la función antigua ajustarCamposLogin, ya que todo se hace en seleccionarRol
function ajustarCamposLogin() {
  // Función vacía por compatibilidad, no la usamos más
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
    
    // Enviar ROL EXPLÍCITO + datos
    const bodySolicitud = { rol, password };
    
    if (rol === 'paciente') {
      if (!ci || !correo) return Swal.fire('Aviso', 'Ingrese CI y Correo', 'warning');
      bodySolicitud.ci = ci;
      bodySolicitud.correo = correo;
    } else if (rol === 'medico') {
      if (!ci) return Swal.fire('Aviso', 'Ingrese su CI de médico', 'warning');
      bodySolicitud.ci = ci;
    } else if (rol === 'admin') {
      if (!correo) return Swal.fire('Aviso', 'Ingrese el correo de administrador', 'warning');
      bodySolicitud.correo = correo;
    }
    
    const datos = await apiRequest('/api/auth/login', 'POST', bodySolicitud);
    
    token = datos.token;
    usuarioActual = datos.usuario;
    localStorage.setItem('token', token);
    
    Swal.fire({ icon: 'success', title: '¡Bienvenido!', text: datos.usuario.nombres, timer: 1500, showConfirmButton: false });
    cargarInterfazSegunRol();
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Error', text: error.message });
  }
}
    
    token = datos.token;
    usuarioActual = datos.usuario;
    localStorage.setItem('token', token);
    
    Swal.fire({ 
      icon: 'success', 
      title: '¡Bienvenido!', 
      text: `Hola ${datos.usuario.nombres}`, 
      timer: 1500, 
      showConfirmButton: false 
    });
    
    cargarInterfazSegunRol();
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Error', text: error.message });
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
      ajustarCamposLogin();
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
  } else if (usuarioActual.rol === 'medico') {
    navMenu.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaMedicoCitas', this)">Mis Citas</button>
    `;
    mostrarVista('vistaMedicoCitas');
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
  
  if (idVista === 'vistaMisCitas') cargarMisCitas();
  if (idVista === 'vistaPerfil') cargarPerfil();
  if (idVista === 'vistaMedicoCitas') cargarCitasMedico('hoy', document.querySelector('.filtro-btn'));
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

// ==================== MÉDICO: PANEL CITAS ====================
async function cargarCitasMedico(rango, btn) {
  if (btn) {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  
  try {
    const citas = await apiRequest(`/api/medico/citas?rango=${rango}`);
    const contenedor = document.getElementById('listaCitasMedico');
    
    if (citas.length === 0) {
      contenedor.innerHTML = '<div class="cita-card"><p style="text-align:center;color:var(--texto-claro);">No hay citas para este período</p></div>';
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
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar las citas', 'error');
  }
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
    const btnActivo = document.querySelector('.filtro-btn.active');
    const rango = btnActivo.textContent.toLowerCase().includes('hoy') ? 'hoy' : 
                btnActivo.textContent.toLowerCase().includes('semana') ? 'semana' : 'meses';
    cargarCitasMedico(rango);
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
      <div class="stat-card"><div class="stat-numero" style="color:#10B981">${stats.exitosas}</div><div class="stat-titulo">Realizadas</div></div>
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
  ajustarCamposLogin();
};

// Cerrar modales al hacer clic fuera
window.onclick = (e) => {
  document.querySelectorAll('.modal').forEach(modal => {
    if (e.target === modal) modal.style.display = 'none';
  });
};
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
  
  // Al inicio: ocultar ambos campos hasta que se elija rol
  document.getElementById('campoCi').style.setProperty('display', 'none', 'important');
  document.getElementById('campoCorreo').style.setProperty('display', 'none', 'important');
};