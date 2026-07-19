let selectedRole = '';
let isRegisterMode = false;

const medicosData = { 
    "Medicina General": [{name: "Dra. Elena Espinoza", ci:"1712345671"}, {name: "Dr. Carlos Mendoza", ci:"1712345672"}], 
    "Psicologia": [{name: "Dra. Camila Restrepo", ci:"1712345675"}, {name: "Dr. Fernando Ortiz", ci:"1712345676"}],
    "Nutricion": [{name: "Dra. Mariana Silva", ci:"1712345677"}, {name: "Dr. Alejandro Ríos", ci:"1712345678"}],
    "Odontologia": [{name: "Dra. Valeria Benítez", ci:"1712345673"}, {name: "Dr. Ricardo Alarcón", ci:"1712345674"}]
};

let agendaHorarios = ["08:00 AM", "09:00 AM", "10:30 AM", "11:00 AM", "14:00 PM", "15:00 PM"];

let misCitas = [
    { id: "1", paciente: "María Augusta Flores", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "10:30 AM - 18/07/2026", estado: "Pendiente" },
    { id: "2", paciente: "Pedro José Andrade", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "14:00 PM - 19/07/2026", estado: "Pendiente" }
];

let citasCanceladasHistorial = 3;

function openModal(role) { 
    selectedRole = role; 
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'flex';
        const authTitle = document.getElementById('auth-title');
        if (authTitle) authTitle.innerText = `Ingreso: ${role === 'Medico' ? 'Médico' : role}`;
    }
}

function selectRole(role) { openModal(role); }

function closeModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.style.display = 'none';
}

function backToRoles() { 
    closeModal();
    isRegisterMode = false;
}

function toggleAuthMode() { 
    isRegisterMode = !isRegisterMode; 
    document.getElementById('auth-title').innerText = isRegisterMode ? "Registro de Cuenta" : `Ingreso: ${selectedRole}`; 
    document.getElementById('btn-auth-submit').innerText = isRegisterMode ? "Registrarse" : "Ingresar";
    document.getElementById('toggle-auth-mode').innerText = isRegisterMode ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate aquí";
    document.getElementById('name-group')?.classList.toggle('d-none', !isRegisterMode);
    document.getElementById('ci-group')?.classList.toggle('d-none', !isRegisterMode);
}

function executeLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    if (!user || !pass) {
        alert("⚠️ Por favor rellenar campos de acceso.");
        return;
    }
    closeModal();
    activarPanelRol(selectedRole, user);
}

function executeRegister() {
    alert("🎉 Cuenta registrada de forma exitosa.");
    toggleAuthMode();
}

function activarPanelRol(role, email) {
    document.getElementById('view-roles')?.classList.add('d-none');
    document.getElementById('view-paciente')?.classList.add('d-none');
    document.getElementById('view-medico')?.classList.add('d-none'); 
    document.getElementById('view-admin')?.classList.add('d-none'); 
    document.getElementById('panel-citas-paciente-seccion')?.classList.add('d-none');

    if(role === 'Paciente') { 
        document.getElementById('view-paciente')?.classList.remove('d-none'); 
        document.getElementById('panel-citas-paciente-seccion')?.classList.remove('d-none'); 
        mostrarBarraSesion(email, "Paciente");
        renderSidebarAppointments(); 
    } else if(role === 'Medico' || role === 'Médico') { 
        document.getElementById('view-medico')?.classList.remove('d-none'); 
        mostrarBarraSesion("Dr. Carlos Mendoza", "Médico");
        renderTablaMedico("Dr. Carlos Mendoza"); 
    } else if(role === 'Admin' || role === 'Administrador') { 
        document.getElementById('view-admin')?.classList.remove('d-none'); 
        mostrarBarraSesion("Administrador General", "Admin");
        renderPanelAdmin(); 
    }
}

function mostrarBarraSesion(nombre, rol) {
    const uDisplay = document.getElementById("user-display");
    const rDisplay = document.getElementById("role-display");
    if (uDisplay) uDisplay.textContent = `Usuario: ${nombre} `;
    if (rDisplay) rDisplay.textContent = rol.toUpperCase();
    const barra = document.getElementById("user-tag");
    if (barra) barra.style.display = "block";
}

function logOut() { 
    document.getElementById('view-roles')?.classList.remove('d-none');
    document.getElementById('view-paciente')?.classList.add('d-none'); 
    document.getElementById('view-medico')?.classList.add('d-none'); 
    document.getElementById('view-admin')?.classList.add('d-none'); 
    document.getElementById('panel-citas-paciente-seccion')?.classList.add('d-none');
    document.getElementById("user-tag").style.display = "none";
}

function updateMedicos() { 
    const esp = document.getElementById('select-esp').value; 
    const selectMed = document.getElementById('select-med'); 
    if(!selectMed) return;
    selectMed.innerHTML = ''; 

    if(!esp || !medicosData[esp]) { 
        selectMed.innerHTML = '<option value="" selected disabled>-- Selecciona un área primero --</option>'; 
        selectMed.disabled = true;
        return; 
    } 
    selectMed.disabled = false;
    let optDefecto = document.createElement('option');
    optDefecto.value = ""; optDefecto.innerText = "-- Selecciona un médico --";
    optDefecto.disabled = true; optDefecto.selected = true;
    selectMed.appendChild(optDefecto);

    medicosData[esp].forEach(med => { 
        let opt = document.createElement('option'); 
        opt.value = med.name; opt.innerText = med.name; 
        selectMed.appendChild(opt); 
    });
}

function updateCalendarioPaciente() {
    const selectMed = document.getElementById('select-med');
    if(selectMed && selectMed.value) {
        document.getElementById('select-fecha').disabled = false;
    }
}

function updateTurnosPaciente() {
    const selectFecha = document.getElementById('select-fecha').value;
    const selectHor = document.getElementById('select-hor');
    if(!selectHor) return;
    if(!selectFecha) { selectHor.disabled = true; return; }

    selectHor.disabled = false;
    selectHor.innerHTML = '<option value="" selected disabled>-- Elige un turno disponible --</option>';
    agendaHorarios.forEach(hora => {
        let opt = document.createElement('option');
        opt.value = hora; opt.innerText = `${hora} - Disponible`;
        selectHor.appendChild(opt);
    });
}

function executeSchedule() {
    alert("🎉 Cita agendada con éxito.");
}

function renderSidebarAppointments() {
    const tbody = document.getElementById('tabla-citas-paciente');
    if (!tbody) return; tbody.innerHTML = '';
    misCitas.forEach(cita => {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td>${cita.id}</td><td>${cita.especialidad}</td><td>${cita.medico}</td><td>${cita.fechaHora}</td><td><span style="background:#fff3cd; color:#856404; padding:3px 8px; border-radius:4px;">${cita.estado}</span></td>`;
        tbody.appendChild(tr);
    });
}

function renderTablaMedico(medicoNombre) {
    const tbody = document.getElementById('tabla-citas-medico');
    if (!tbody) return; tbody.innerHTML = '';
    misCitas.forEach(cita => {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${cita.paciente}</strong></td><td>${cita.fechaHora}</td><td><span style="background:#d1ecf1; color:#0c5460; padding:3px 8px; border-radius:4px;">${cita.estado}</span></td><td><button class="btn-warning" onclick="alert('Atendiendo...')">Atender</button></td>`;
        tbody.appendChild(tr);
    });
}

function renderPanelAdmin() {
    if(document.getElementById('stat-agendadas')) document.getElementById('stat-agendadas').innerText = misCitas.length;
    if(document.getElementById('stat-canceladas')) document.getElementById('stat-canceladas').innerText = citasCanceladasHistorial;

    const tbodyUsers = document.getElementById('tabla-usuarios-admin');
    if (tbodyUsers) {
        tbodyUsers.innerHTML = `
            <tr><td><strong>admin_global</strong></td><td><span style="background:#343a40; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">ADMIN</span></td><td>9999999999</td><td><span style="color:#28a745; font-weight:bold;">🟢 En Línea</span></td></tr>
        `;
    }

    const containerMedicos = document.getElementById('admin-lista-medicos-container');
    if (containerMedicos) {
        containerMedicos.innerHTML = '';
        for (let especialidad in medicosData) {
            medicosData[especialidad].forEach(medico => {
                let div = document.createElement('div');
                div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:#fff; border:1px solid #ddd; border-radius:8px;";
                div.innerHTML = `<div><strong style="color:#4a148c;">${medico.name}</strong><br><small style="color:#666;">${especialidad}</small></div><span style="font-weight:bold; font-size:13px; color:#22c55e;">🟢 Conectado</span>`;
                containerMedicos.appendChild(div);
            });
        }
    }
}
function switchTab(mode) {
    isRegisterMode = (mode === 'register');
    
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login-container');
    const formRegister = document.getElementById('form-register-container');

    if (isRegisterMode) {
        tabLogin?.classList.remove('active');
        tabRegister?.classList.add('active');
        if (formLogin) formLogin.style.display = 'none';
        if (formRegister) formRegister.classList.remove('d-none');
    } else {
        tabLogin?.classList.add('active');
        tabRegister?.classList.remove('remove');
        if (formLogin) formLogin.style.display = 'block';
        if (formRegister) formRegister.classList.add('d-none');
    }
}

function togglePassword(inputId, buttonEl) {
    const input = document.getElementById(inputId);
    if (input) {
        if (input.type === "password") {
            input.type = "text";
            buttonEl.textContent = "🙈";
        } else {
            input.type = "password";
            buttonEl.textContent = "👁️";
        }
    }
}
