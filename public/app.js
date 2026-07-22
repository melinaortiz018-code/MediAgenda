let usuarioActual = null;
let token = localStorage.getItem('token') || null;
const API_BASE = '';

// ==============================================
// UTILIDADES GENERALES
// ==============================================
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁️' : '👁️‍🗨️';
}

function cambiarTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (tab === 'login') {
    document.getElementById('camposLogin').style.display = 'block';
    document.getElementById('formRegistro').style.display = 'none';
  } else {
    document.getElementById('camposLogin').style.display = 'none';
    document.getElementById('formRegistro').style.display = 'block';
  }
  event.target.classList.add('active');
}

function cerrarModal(idModal) {
  document.getElementById(idModal).style.display = 'none';
}

// ==============================================
// SELECCIÓN DE ROL Y FORMULARIO
// ==============================================
function seleccionarRol(rolElegido, elemento) {
  // Resaltar tarjeta seleccionada
  document.querySelectorAll('.rol-card').forEach(card => {
    card.style.background = '#ffffff';
    card.style.borderColor = '#9333EA';
    card.style.boxShadow = 'none';
  });
  elemento.style.background = '#f3e8ff';
  elemento.style.borderColor = '#7e22ce';
  elemento.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.2)';

  // Obtener elementos
  const loginRol = document.getElementById('loginRol');
  const grupoCI = document.getElementById('grupoLoginCI');
  const grupoCorreo = document.getElementById('grupoLoginCorreo');
  const tabsAuth = document.getElementById('tabsAuth');
  const camposLogin = document.getElementById('camposLogin');
  const ciInput = document.getElementById('loginCI');
  const correoInput = document.getElementById('loginCorreo');
  const passwordInput = document.getElementById('loginPassword');
  const hint = document.getElementById('loginHint');

  // Reiniciar todo
  loginRol.value = rolElegido;
  camposLogin.style.display = 'block';
  tabsAuth.style.display = 'none';
  grupoCI.style.display = 'none';
  grupoCorreo.style.display = 'none';
  ciInput.value = '';
  correoInput.value = '';
  passwordInput.value = '';
  document.getElementById('formRegistro').style.display = 'none';

  // Configurar según rol
  if (rolElegido === 'paciente') {
    tabsAuth.style.display = 'flex';
    grupoCI.style.display = 'flex';
    grupoCorreo.style.display = 'flex';
    hint.textContent = '👤 Ingresa tu cédula y correo, o crea una cuenta nueva';
  } else if (rolElegido === 'medico') {
    grupoCI.style.display = 'flex';
    hint.textContent = '🩺 Ingresa tu cédula (ej: MED001) y contraseña';
  } else if (rolElegido === 'admin') {
    grupoCorreo.style.display = 'flex';
    hint.textContent = '🛡️ Ingresa tu correo y contraseña';
  }
}

// ==============================================
// PETICIONES AL SERVIDOR
// ==============================================
async function apiRequest(endpoint, method = 'GET', body = null) {
  const opciones = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opciones.headers['Authorization'] = `Bearer ${token}`;
  if (body) opciones.body = JSON.stringify(body);

  try {
    const respuesta = await fetch(`${API_BASE}${endpoint}`, opciones);
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.mensaje || 'Error en la solicitud');
    return datos;
  } catch (error) {
    throw error;
  }
}

// ==============================================
// AUTENTICACIÓN
// ==============================================
async function iniciarSesion(event) {
  event.preventDefault();

  // Tomamos los datos del formulario
  const ci = document.getElementById('ci').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!ci || !password) {
    alert('Completa cédula y contraseña');
    return;
  }

  try {
    const respuesta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ci, password })
    });

    // ✅ AQUÍ ESTABA EL ERROR: NOMBRAMOS LA VARIABLE CORRECTAMENTE
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.mensaje || 'Error al iniciar sesión');
    }

    // ✅ ESTAS LÍNEAS SON LAS CORRECTAS QUE PUSISTE ANTES
    localStorage.setItem('token', datos.token);
    localStorage.setItem('rol', datos.usuario.rol);

    // ✅ REDIRIGIMOS SEGÚN EL ROL
    if (datos.usuario.rol === 'paciente') {
      window.location.href = '/agendar.html';
    } else if (datos.usuario.rol === 'medico') {
      window.location.href = '/mis-citas.html';
    } else if (datos.usuario.rol === 'admin') {
      window.location.href = '/admin.html';
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Error al iniciar sesión: ' + error.message);
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
    Swal.fire('✅ Registro exitoso', 'Ya puedes usar tu cuenta', 'success')
      .then(() => cargarInterfazSegunRol());
  } catch (error) {
    Swal.fire('Error en el registro', error.message, 'error');
  }
}

function cerrarSesion() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Volverás a la pantalla de selección de cuenta',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#9333EA',
    cancelButtonColor: '#EF4444',
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar'
  }).then(resultado => {
    if (resultado.isConfirmed) {
      token = null;
      usuarioActual = null;
      localStorage.clear();

      // Volver al inicio completamente
      document.getElementById('navbar').style.display = 'none';
      document.querySelectorAll('.vista').forEach(vista => vista.style.display = 'none');
      document.getElementById('vistaInicio').style.display = 'flex';
      document.getElementById('camposLogin').style.display = 'none';
      document.getElementById('tabsAuth').style.display = 'none';
      document.getElementById('formRegistro').style.display = 'none';
      document.getElementById('loginRol').value = '';
      document.querySelectorAll('.rol-card').forEach(tarjeta => {
        tarjeta.style.background = '#ffffff';
        tarjeta.style.borderColor = '#9333EA';
        tarjeta.style.boxShadow = 'none';
      });
    }
  });
}

// ==============================================
// CARGA DE INTERFAZ SEGÚN ROL
// ==============================================
function cargarInterfazSegunRol() {
  document.getElementById('navbar').style.display = 'flex';
  document.getElementById('userName').textContent = usuarioActual.nombres;
  document.querySelectorAll('.vista').forEach(vista => vista.style.display = 'none');

  const menuNav = document.getElementById('navMenu');
  menuNav.innerHTML = '';

  if (usuarioActual.rol === 'paciente') {
    menuNav.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaAgendar', this)">Agendar Cita</button>
      <button onclick="mostrarVista('vistaMisCitas', this)">Mis Citas</button>
      <button onclick="mostrarVista('vistaPerfil', this)">Mi Perfil</button>
    `;
    mostrarVista('vistaAgendar');
    document.getElementById('citaFecha').min = new Date().toISOString().split('T')[0];
  } else if (usuarioActual.rol === 'medico') {
    menuNav.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaMedicoCalendario', this)">Calendario</button>
      <button onclick="mostrarVista('vistaMedicoCitas', this)">Mis Citas</button>
    `;
    mostrarVista('vistaMedicoCitas');
  } else if (usuarioActual.rol === 'admin') {
    menuNav.innerHTML = `
      <button class="active" onclick="mostrarVista('vistaAdminUsuarios', this)">Usuarios</button>
      <button onclick="mostrarVista('vistaAdminEstadisticas', this)">Estadísticas</button>
    `;
    mostrarVista('vistaAdminUsuarios');
    if (idVista === 'vistaAdminUsuarios') cargarUsuariosAdmin();
    if (idVista === 'vistaAdminEstadisticas') cargarEstadisticas(); // ✅ Se actualiza al entrar
    
}
}

function mostrarVista(idVista, boton = null) {
  document.querySelectorAll('.vista').forEach(vista => vista.style.display = 'none');
  document.getElementById(idVista).style.display = 'block';

  if (boton) {
    document.querySelectorAll('.nav-menu button').forEach(b => b.classList.remove('active'));
    boton.classList.add('active');
  }

  // Cargar datos según vista
  if (idVista === 'vistaAgendar') cargarMedicos();
  if (idVista === 'vistaMisCitas') cargarMisCitas();
  if (idVista === 'vistaPerfil') cargarPerfil();
  if (idVista === 'vistaAdminUsuarios') cargarUsuariosAdmin();
  if (idVista === 'vistaAdminEstadisticas') cargarEstadisticas();
}

// ==============================================
// FUNCIONES DE PACIENTE
// ==============================================
async function cargarMedicos() {
  const selectEspecialidad = document.getElementById('citaEspecialidad');
  const selectMedicos = document.getElementById('citaMedico');
  selectEspecialidad.value = '';
  selectMedicos.innerHTML = '<option value="">Seleccione primero una especialidad</option>';
}

document.addEventListener("DOMContentLoaded", () => {
    cargarMedicosEnSelect();
});

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
    Swal.fire('✅ Cita agendada', 'Te avisaremos cuando sea confirmada', 'success');
    e.target.reset();
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}

async function cargarMisCitas() {
  const contenedor = document.getElementById('listaMisCitas');
  contenedor.innerHTML = '<p>Cargando tus citas...</p>';

  try {
    // Probamos la ruta que usa tu backend
    const citas = await apiRequest('/api/citas/mis'); // Cambiado de /mis-citas a /mis
    if (citas.length === 0) {
      contenedor.innerHTML = '<p style="text-align:center;color:var(--texto-claro);">No tienes citas programadas todavía</p>';
      return;
    }

    contenedor.innerHTML = '';
    citas.forEach(cita => {
      const estado = {
        pendiente: 'Pendiente',
        confirmada: 'Confirmada',
        atendida: 'Atendida',
        cancelada: 'Cancelada'
      }[cita.estado] || cita.estado;

      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-cita';
      tarjeta.innerHTML = `
        <h4>${cita.especialidad} - ${cita.medico?.nombres || 'Médico'}</h4>
        <p><strong>Fecha:</strong> ${new Date(cita.fecha).toLocaleDateString('es-EC')}</p>
        <p><strong>Hora:</strong> ${cita.hora}</p>
        <p><strong>Motivo:</strong> ${cita.motivo}</p>
        <p><strong>Estado:</strong> <span class="estado-${cita.estado}">${estado}</span></p>
      `;
      contenedor.appendChild(tarjeta);
    });
  } catch (error) {
    // Si falla la primera, probamos la otra ruta común
    try {
      const citas = await apiRequest('/api/citas/usuario/mis');
      if (citas.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center;color:var(--texto-claro);">No tienes citas programadas todavía</p>';
        return;
      }
      contenedor.innerHTML = '';
      citas.forEach(cita => {
        const estado = { pendiente:'Pendiente', confirmada:'Confirmada', atendida:'Atendida', cancelada:'Cancelada' }[cita.estado] || cita.estado;
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-cita';
        tarjeta.innerHTML = `
          <h4>${cita.especialidad} - ${cita.medico?.nombres || 'Médico'}</h4>
          <p><strong>Fecha:</strong> ${new Date(cita.fecha).toLocaleDateString('es-EC')}</p>
          <p><strong>Hora:</strong> ${cita.hora}</p>
          <p><strong>Motivo:</strong> ${cita.motivo}</p>
          <p><strong>Estado:</strong> <span class="estado-${cita.estado}">${estado}</span></p>
        `;
        contenedor.appendChild(tarjeta);
      });
    } catch {
      contenedor.innerHTML = '<p style="text-align:center;color:var(--rojo);">No se pudieron cargar tus citas</p>';
    }
  }
}
async function cargarPerfil() {
  try {
    // ✅ Obtiene los datos completos del usuario
    const usuario = usuarioActual || JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) throw new Error('No hay datos de usuario');

    document.getElementById('perfilNombres').value = usuario.nombres || '';
    document.getElementById('perfilCi').value = usuario.ci || '';
    document.getElementById('perfilCorreo').value = usuario.correo || '';
    document.getElementById('perfilCelular').value = usuario.celular || '';
    document.getElementById('perfilDireccion').value = usuario.direccion || '';
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar tus datos', 'error');
  }
}

async function actualizarPerfil(e) {
  e.preventDefault();
  try {
    const datosActualizados = {
      correo: document.getElementById('perfilCorreo').value,
      celular: document.getElementById('perfilCelular').value,
      direccion: document.getElementById('perfilDireccion').value
    };

    await apiRequest('/api/usuarios/perfil', 'PUT', datosActualizados);
    
    // ✅ Actualiza los datos locales
    usuarioActual.correo = datosActualizados.correo;
    usuarioActual.celular = datosActualizados.celular;
    usuarioActual.direccion = datosActualizados.direccion;
    localStorage.setItem('usuario', JSON.stringify(usuarioActual));

    Swal.fire('✅ Perfil actualizado', 'Tus datos se guardaron correctamente', 'success');
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}

// ==============================================
// FUNCIONES DE ADMINISTRADOR
// ==============================================

async function cargarUsuariosAdmin() {
  try {
    const usuarios = await apiRequest('/api/admin/usuarios');
    const cuerpoTabla = document.getElementById('cuerpoTablaUsuarios');
    cuerpoTabla.innerHTML = '';

    usuarios.forEach(usuario => {
      // ✅ CORREGIDO: Muestra el rol real sin errores
      let nombreRol;
      if (usuario.rol === 'paciente') nombreRol = 'Paciente';
      else if (usuario.rol === 'medico') nombreRol = 'Médico';
      else if (usuario.rol === 'admin') nombreRol = 'Administrador';
      else nombreRol = usuario.rol;

      const especialidad = usuario.especialidad || '-';

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${usuario.ci}</td>
        <td>${usuario.nombres}</td>
        <td>${usuario.correo}</td>
        <td>${nombreRol}</td>
        <td>${especialidad}</td>
        <td>
          <button class="btn-accion" onclick="abrirModalCambiarPass('${usuario._id}')">Cambiar Contraseña</button>
        </td>
      `;
      cuerpoTabla.appendChild(fila);
    });
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
  }
}

function abrirModalAgregarMedico() {
  document.getElementById('modalAgregarMedico').style.display = 'flex';
}

async function agregarNuevoMedico(e) {
  e.preventDefault();
  try {
    await apiRequest('/api/admin/medicos', 'POST', {
      ci: document.getElementById('medCi').value,
      nombres: document.getElementById('medNombres').value,
      correo: document.getElementById('medCorreo').value,
      especialidad: document.getElementById('medEspecialidad').value,
      password: document.getElementById('medPassword').value
    });
    Swal.fire('✅ Médico agregado', 'La cuenta fue creada correctamente', 'success');
    cerrarModal('modalAgregarMedico');
    e.target.reset();
    cargarUsuariosAdmin();
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}

function abrirModalCambiarPass(idUsuario) {
  document.getElementById('idUsuarioPass').value = idUsuario;
  document.getElementById('modalCambiarPass').style.display = 'flex';
}

async function guardarNuevaPass(e) {
  e.preventDefault();
  const nueva = document.getElementById('nuevaPass').value;
  const confirmar = document.getElementById('confirmarNuevaPass').value;
  if (nueva !== confirmar) return Swal.fire('Error', 'Las contraseñas no coinciden', 'error');

  try {
    await apiRequest(`/api/admin/usuarios/${document.getElementById('idUsuarioPass').value}/password`, 'PUT', { nuevaPassword: nueva });
    Swal.fire('✅ Contraseña actualizada', '', 'success');
    cerrarModal('modalCambiarPass');
    e.target.reset();
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
}

async function cargarEstadisticas() {
  try {
    // Primero intentamos la ruta original
    const datos = await apiRequest('/api/admin/estadisticas');
    document.getElementById('estPacientes').textContent = datos.totalPacientes || 0;
    document.getElementById('estMedicos').textContent = datos.totalMedicos || 0;
    document.getElementById('estCitasMes').textContent = datos.citasMes || 0;
    document.getElementById('estPendientes').textContent = datos.citasPendientes || 0;
  } catch (error) {
    console.log('Ruta principal fallida, probando alternativas...');
    try {
      // Probamos la ruta que usa tu sistema
      const datos = await apiRequest('/api/estadisticas');
      document.getElementById('estPacientes').textContent = datos.totalPacientes || 0;
      document.getElementById('estMedicos').textContent = datos.totalMedicos || 0;
      document.getElementById('estCitasMes').textContent = datos.citasMes || 0;
      document.getElementById('estPendientes').textContent = datos.citasPendientes || 0;
    } catch {
      // Si no hay ruta, calculamos desde la lista de usuarios para que se vean los reales
      try {
        const usuarios = await apiRequest('/api/admin/usuarios');
        const pacientes = usuarios.filter(u => u.rol === 'paciente').length;
        const medicos = usuarios.filter(u => u.rol === 'medico').length;
        
        document.getElementById('estPacientes').textContent = pacientes;
        document.getElementById('estMedicos').textContent = medicos;
        // Las citas se mantienen hasta que se conecte la ruta correspondiente
      } catch {
        document.getElementById('estPacientes').textContent = '0';
        document.getElementById('estMedicos').textContent = '0';
      }
    }
  }
}
// ==============================================
// INICIO DEL SISTEMA
// ==============================================
window.onload = async () => {
  // 1. OCULTAR TODO AL INICIO ANTES DE CARGAR NADA — sin parpadeos
  document.querySelectorAll('.vista').forEach(vista => vista.style.display = 'none');
  document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
  document.getElementById('navbar').style.display = 'none';
  document.getElementById('camposLogin').style.display = 'none';
  document.getElementById('tabsAuth').style.display = 'none';
  document.getElementById('formRegistro').style.display = 'none';

  // 2. LIMPIAR ESTILOS DE TARJETAS DE ROL
  document.querySelectorAll('.rol-card').forEach(tarjeta => {
    tarjeta.style.background = '#ffffff';
    tarjeta.style.borderColor = '#9333EA';
    tarjeta.style.boxShadow = 'none';
  });
  document.getElementById('loginRol').value = '';

  // 3. MOSTRAR SIEMPRE LA PANTALLA DE INICIO PRIMERO
  document.getElementById('vistaInicio').style.display = 'flex';

  // 4. Revisar sesión solo si el usuario lo pide, no automáticamente
  if (token) {
    try {
      const respuesta = await apiRequest('/api/auth/verify');
      usuarioActual = respuesta.usuario;
      // ✅ Ya no entra directo: solo dejamos la opción de iniciar sesión
      // cargarInterfazSegunRol(); // Comentado para que no entre solo
    } catch {
      localStorage.clear();
      token = null;
      usuarioActual = null;
    }
  }
};
  // Mostrar pantalla de inicio
  document.getElementById('vistaInicio').style.display = 'flex';