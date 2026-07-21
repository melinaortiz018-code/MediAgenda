let currentRole = null;
let currentUser = null;
let availableDoctors = [];

const API_BASE = '/api';

function selectRole(role) {
  currentRole = role;
  document.getElementById('role-selection').classList.add('hidden');
  document.getElementById('auth-section').classList.remove('hidden');

  const ciGroup = document.getElementById('group-ci-login');
  const toggleReg = document.getElementById('toggle-reg-msg');

  if (role === 'patient') {
    ciGroup.classList.remove('hidden');
    toggleReg.classList.remove('hidden');
  } else {
    ciGroup.classList.add('hidden');
    toggleReg.classList.add('hidden');
  }
}

function showRoleSelection() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('role-selection').classList.remove('hidden');
  toggleAuthMode('login');
}

function toggleAuthMode(mode) {
  if (mode === 'register') {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('auth-title').innerText = 'Registro de Paciente';
  } else {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('auth-title').innerText = 'Iniciar Sesión';
  }
}

function togglePass(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// Autenticación
async function handleLogin(e) {
  e.preventDefault();
  const ci = document.getElementById('login-ci').value;
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-pass').value;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: currentRole, ci, email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    currentUser = data.user;
    document.getElementById('auth-section').classList.add('hidden');

    if (currentRole === 'patient') loadPatientDashboard();
    else if (currentRole === 'doctor') loadDoctorDashboard();
    else if (currentRole === 'admin') loadAdminDashboard();

  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const ci = document.getElementById('reg-ci').value;
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  const address = document.getElementById('reg-address').value;
  const pass = document.getElementById('reg-pass').value;
  const passConfirm = document.getElementById('reg-pass-confirm').value;

  if (pass !== passConfirm) {
    return Swal.fire('Atención', 'Las contraseñas no coinciden.', 'warning');
  }

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ci, name, email, phone, address, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    Swal.fire('¡Éxito!', 'Registro completado. Ahora inicia sesión.', 'success');
    toggleAuthMode('login');
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

// DASHBOARD PACIENTE
async function loadPatientDashboard() {
  document.getElementById('patient-dashboard').classList.remove('hidden');
  document.getElementById('patient-welcome-name').innerText = currentUser.name;

  document.getElementById('edit-email').value = currentUser.email;
  document.getElementById('edit-phone').value = currentUser.phone;
  document.getElementById('edit-address').value = currentUser.address || '';

  const res = await fetch(`${API_BASE}/admin/doctors`);
  availableDoctors = await res.json();

  fetchPatientAppointments();
}

function loadDoctorsBySpecialty() {
  const spec = document.getElementById('app-specialty').value;
  const selectDoc = document.getElementById('app-doctor');
  selectDoc.innerHTML = '<option value="">-- Seleccionar Doctor --</option>';

  const filtered = availableDoctors.filter(d => d.specialty === spec);
  filtered.forEach(d => {
    selectDoc.innerHTML += `<option value="${d.name}">${d.name}</option>`;
  });
}

async function updatePatientData(e) {
  e.preventDefault();
  const email = document.getElementById('edit-email').value;
  const phone = document.getElementById('edit-phone').value;
  const address = document.getElementById('edit-address').value;

  const res = await fetch(`${API_BASE}/patient/${currentUser.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone, address })
  });

  if (res.ok) {
    Swal.fire('Guardado', 'Datos de contacto actualizados correctamente.', 'success');
  }
}

async function handleBookAppointment(e) {
  e.preventDefault();
  const specialty = document.getElementById('app-specialty').value;
  const doctorName = document.getElementById('app-doctor').value;
  const date = document.getElementById('app-date').value;
  const time = document.getElementById('app-time').value;
  const reason = document.getElementById('app-reason').value;

  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.id,
        patientName: currentUser.name,
        specialty, doctorName, date, time, reason
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    Swal.fire('¡Cita Agendada!', 'Tu cita ha sido registrada con éxito.', 'success');
    fetchPatientAppointments();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function fetchPatientAppointments() {
  const res = await fetch(`${API_BASE}/appointments`);
  const data = await res.json();
  const myApps = data.filter(a => a.patientId === currentUser.id);

  const tbody = document.getElementById('patient-appointments-list');
  tbody.innerHTML = '';

  myApps.forEach(app => {
    tbody.innerHTML += `
      <tr>
        <td>${app.specialty}</td>
        <td>${app.doctorName}</td>
        <td>${app.date} ${app.time}</td>
        <td><span class="badge badge-${app.status.toLowerCase()}">${app.status}</span></td>
        <td>${app.prescription || 'N/A'}</td>
        <td>
          <button onclick="rescheduleApp('${app.id}')" class="btn-shiny" style="padding: 4px 8px; font-size: 0.8rem;">Reagendar</button>
          <button onclick="cancelApp('${app.id}')" class="btn-shiny btn-danger" style="padding: 4px 8px; font-size: 0.8rem;">Cancelar</button>
        </td>
      </tr>
    `;
  });
}

async function cancelApp(id) {
  const confirm = await Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción cancelará tu cita médica.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cancelar'
  });

  if (confirm.isConfirmed) {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' })
    });
    const data = await res.json();
    if (!res.ok) return Swal.fire('Aviso', data.error, 'error');
    
    Swal.fire('Cancelada', data.message, 'success');
    fetchPatientAppointments();
  }
}

async function rescheduleApp(id) {
  const { value: formValues } = await Swal.fire({
    title: '¿Seguro de reagendar? Selecciona nueva fecha y hora',
    html:
      '<input id="swal-date" type="date" class="swal2-input">' +
      '<input id="swal-time" type="time" class="swal2-input">',
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return [
        document.getElementById('swal-date').value,
        document.getElementById('swal-time').value
      ]
    }
  });

  if (formValues && formValues[0] && formValues[1]) {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reschedule', newDate: formValues[0], newTime: formValues[1] })
    });
    const data = await res.json();
    if (!res.ok) return Swal.fire('Aviso', data.error, 'error');

    Swal.fire('Reagendada', data.message, 'success');
    fetchPatientAppointments();
  }
}

// DASHBOARD MÉDICO
async function loadDoctorDashboard() {
  document.getElementById('doctor-dashboard').classList.remove('hidden');
  document.getElementById('doctor-welcome-name').innerText = currentUser.name;
  fetchDoctorAppointments();
}

async function fetchDoctorAppointments() {
  const res = await fetch(`${API_BASE}/appointments`);
  const data = await res.json();
  const docApps = data.filter(a => a.doctorName === currentUser.name);

  const tbody = document.getElementById('doctor-appointments-list');
  tbody.innerHTML = '';

  docApps.forEach(app => {
    tbody.innerHTML += `
      <tr>
        <td>${app.patientName}</td>
        <td>${app.date} ${app.time}</td>
        <td>${app.reason}</td>
        <td>
          <select onchange="updateDocAppStatus('${app.id}', this.value)">
            <option value="Pendiente" ${app.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="Completada" ${app.status === 'Completada' ? 'selected' : ''}>Completada</option>
            <option value="Cancelada" ${app.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
          </select>
        </td>
        <td>
          <input type="text" value="${app.prescription || ''}" id="presc-${app.id}">
          <button onclick="savePrescription('${app.id}')" class="btn-shiny" style="padding: 2px 6px;">Guardar</button>
        </td>
        <td>${app.status}</td>
      </tr>
    `;
  });
}

async function updateDocAppStatus(id, status) {
  await fetch(`${API_BASE}/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'doctor_update', status })
  });
  Swal.fire('Actualizado', 'Estado de la cita actualizado.', 'success');
}

async function savePrescription(id) {
  const prescription = document.getElementById(`presc-${id}`).value;
  await fetch(`${API_BASE}/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'doctor_update', prescription })
  });
  Swal.fire('Guardado', 'Receta/Observación guardada.', 'success');
}

// DASHBOARD ADMINISTRADOR
async function loadAdminDashboard() {
  document.getElementById('admin-dashboard').classList.remove('hidden');
  fetchAdminData();
}

async function fetchAdminData() {
  const usersRes = await fetch(`${API_BASE}/admin/users`);
  const users = await usersRes.json();

  const tbody = document.getElementById('admin-users-list');
  tbody.innerHTML = '';

  users.forEach(u => {
    tbody.innerHTML += `
      <tr>
        <td>${u.ci}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.password}</td>
        <td>
          <button onclick="changeUserPass('${u.id}')" class="btn-shiny" style="padding: 2px 6px;">Cambiar Pass</button>
          <button onclick="deleteUser('${u.id}')" class="btn-shiny btn-danger" style="padding: 2px 6px;">Eliminar</button>
        </td>
      </tr>
    `;
  });

  // Métricas
  const appRes = await fetch(`${API_BASE}/appointments`);
  const apps = await appRes.json();

  document.getElementById('stat-success').innerText = apps.filter(a => a.status === 'Completada').length;
  document.getElementById('stat-cancelled').innerText = apps.filter(a => a.status === 'Cancelada').length;
  document.getElementById('stat-rescheduled').innerText = apps.filter(a => a.status === 'Reagendada').length;
}

async function changeUserPass(userId) {
  const { value: newPassword } = await Swal.fire({
    title: 'Nueva Contraseña',
    input: 'password',
    showCancelButton: true
  });

  if (newPassword) {
    await fetch(`${API_BASE}/admin/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword })
    });
    Swal.fire('Éxito', 'Contraseña restablecida correctamente.', 'success');
    fetchAdminData();
  }
}

async function deleteUser(id) {
  await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' });
  Swal.fire('Eliminado', 'Usuario borrado del sistema.', 'success');
  fetchAdminData();
}

async function handleAddDoctor(e) {
  e.preventDefault();
  const ci = document.getElementById('doc-ci').value;
  const name = document.getElementById('doc-name').value;
  const email = document.getElementById('doc-email').value;
  const pass = document.getElementById('doc-pass').value;
  const specialty = document.getElementById('doc-spec').value;
  const gender = document.getElementById('doc-gender').value;

  const res = await fetch(`${API_BASE}/admin/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ci, name, email, pass, specialty, gender })
  });

  if (res.ok) {
    Swal.fire('Éxito', 'Nuevo médico agregado al sistema.', 'success');
  }
}

function logout() {
  currentUser = null;
  currentRole = null;
  document.getElementById('patient-dashboard').classList.add('hidden');
  document.getElementById('doctor-dashboard').classList.add('hidden');
  document.getElementById('admin-dashboard').classList.add('hidden');
  showRoleSelection();
}