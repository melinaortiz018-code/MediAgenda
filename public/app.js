let selectedRole = '';
let isRegisterMode = false;

// Médicos pregenerados alineados con las opciones de tu menú HTML
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

// Función blindada para abrir modales sin importar los IDs del HTML
function openModal(role) { 
    selectedRole = role; 
    const panelRoles = document.getElementById('view-roles') || document.getElementById('role-selection');
    if (panelRoles) panelRoles.classList.add('d-none'); 
    
    const authSection = document.getElementById('auth-section');
    if (authSection) {
        authSection.classList.remove('d-none');
        const authTitle = document.getElementById('auth-title');
        if (authTitle) authTitle.innerText = `Ingreso: ${role === 'Medico' ? 'Médico' : role}`;
    } else {
        activarPanelRol(role, "Usuario Invitado");
    }
}

function selectRole(role) { openModal(role); }

function backToRoles() { 
    document.getElementById('auth-section').classList.add('d-none'); 
    const panelRoles = document.getElementById('view-roles') || document.getElementById('role-selection');
    if (panelRoles) panelRoles.classList.remove('d-none');
    isRegisterMode = false;
    document.getElementById('auth-form').reset();
}

function toggleAuthMode() { 
    isRegisterMode = !isRegisterMode; 
    document.getElementById('auth-title').innerText = isRegisterMode ? "Registro de Cuenta" : `Ingreso: ${selectedRole}`; 
    document.getElementById('btn-auth-submit').innerText = isRegisterMode ? "Registrarse" : "Ingresar";
    document.getElementById('toggle-auth-mode').innerText = isRegisterMode ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate aquí";
    document.getElementById('name-group')?.classList.toggle('d-none', !isRegisterMode);
    document.getElementById('ci-group')?.classList.toggle('d-none', !isRegisterMode);
}

function loginExitoso(email) { 
    document.getElementById('auth-section').classList.add('d-none'); 
    activarPanelRol(selectedRole, email);
}

function activarPanelRol(role, email) {
    const rSelection = document.getElementById('view-roles') || document.getElementById('role-selection');
    if (rSelection) rSelection.classList.add('d-none');
    
    if(document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none');
    if(document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if(document.getElementById('view-admin')) document.getElementById('view-admin').classList.add('d-none'); 
    if(document.getElementById('panel-citas-paciente-seccion')) document.getElementById('panel-citas-paciente-seccion').classList.add('d-none');

    if(role === 'Paciente') { 
        document.getElementById('view-paciente')?.classList.remove('d-none'); 
        document.getElementById('panel-citas-paciente-seccion')?.classList.remove('d-none'); 
        mostrarBarraSesion(email, "Paciente");
        renderSidebarAppointments(); 
    } else if(role === 'Medico' || role === 'Médico') { 
        document.getElementById('view-medico')?.classList.remove('d-none'); 
        mostrarBarraSesion("Dr. Carlos Mendoza", "Médico");
        renderTablaMedico("Dr. Carlos Mendoza"); 
        renderCalendarioMedico(); 
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
    const rSelection = document.getElementById('view-roles') || document.getElementById('role-selection');
    if (rSelection) rSelection.classList.remove('d-none');
    
    if(document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none'); 
    if(document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if(document.getElementById('view-admin')) document.getElementById('view-admin').classList.add('d-none'); 
    if(document.getElementById('panel-citas-paciente-seccion')) document.getElementById('panel-citas-paciente-seccion').classList.add('d-none');
    document.getElementById("user-tag").style.display = "none";
    document.getElementById('auth-form').reset();
}

// 1. Carga de Especialidades y Desbloqueo del Flujo del Paciente
function updateMedicos() { 
    const esp = document.getElementById('select-esp').value; 
    const selectMed = document.getElementById('select-med'); 
    if(!selectMed) return;
    selectMed.innerHTML = ''; 
    const claveEsp = esp.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if(!claveEsp || !medicosData[claveEsp]) { 
        selectMed.innerHTML = '<option value="" selected disabled>-- Selecciona un área primero --</option>'; 
        selectMed.disabled = true;
        return; 
    } 
    selectMed.disabled = false;
    let optDefecto = document.createElement('option');
    optDefecto.value = ""; optDefecto.innerText = "-- Selecciona un médico --";
    optDefecto.disabled = true; optDefecto.selected = true;
    selectMed.appendChild(optDefecto);

    medicosData[claveEsp].forEach(med => { 
        let opt = document.createElement('option'); 
        opt.value = med.ci; opt.innerText = med.name; 
        selectMed.appendChild(opt); 
    });
}

function updateCalendarioPaciente() {
    const selectMed = document.getElementById('select-med');
    if(selectMed && selectMed.value) {
        const selectFecha = document.getElementById('select-fecha');
        if (selectFecha) selectFecha.disabled = false;
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

// 2. Reserva de Turnos desde la Interfaz del Usuario (Función completada de forma segura)
function executeSchedule() {
    const esp = document.getElementById('select-esp').value;
    const medSelect = document.getElementById('select-med');
    const fecha = document.getElementById('select-fecha').value;
    const hora = document.getElementById('select-hor').value;

    if (!esp || !medSelect.value || !fecha || !hora) {
        alert("⚠️ CAMPOS INCOMPLETOS\nPor favor, completa todos los pasos antes de agendar.");
        return;
    }

    let medNombre = medSelect.options[medSelect.selectedIndex].text;
    if (confirm(`📋 ¿CONFIRMAR RESERVA?\n\nVas a agendar una cita a las ${hora} con el especialista ${medNombre}. ¿Proceder?`)) {
        misCitas.push({
            id: String(misCitas.length + 1),
            paciente: "Paciente Autenticado",
            especialidad: esp,
            medico: medNombre,
            fechaHora: `${hora} - ${fecha}`,
            estado: "Pendiente"
        });
        alert("🎉 Cita agendada de forma exitosa.");
        renderSidebarAppointments();
    }
}

// --- 🛠️ NUEVAS FUNCIONES DE ENLACE DE RENDERIZADO (RESOLUCIÓN DEL ERROR) ---

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
    
    // Filtrar citas correspondientes a este médico
    const citasFiltradas = misCitas.filter(c => c.medico === medicoNombre);
    
    if (citasFiltradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#888;">No hay citas asignadas para hoy.</td></tr>`;
        return;
    }
    citasFiltradas.forEach(cita => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cita.paciente}</strong></td>
            <td>${cita.fechaHora}</td>
