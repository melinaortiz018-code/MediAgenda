let selectedRole = '';
let isRegisterMode = false;
let currentUser = null;

// Médicos pregenerados con consistencia en las claves (sin tildes para evitar fallos de enlace)
const medicosData = {
    "Medicina General": [{name: "Dra. Elena Espinoza (F)", ci:"1712345671"}, {name: "Dr. Carlos Mendoza (M)", ci:"1712345672"}],
    "Odontologia": [{name: "Dra. Valeria Benítez (F)", ci:"1712345673"}, {name: "Dr. Ricardo Alarcón (M)", ci:"1712345674"}],
    "Psicologia": [{name: "Dra. Camila Restrepo (F)", ci:"1712345675"}, {name: "Dr. Fernando Ortiz (M)", ci:"1712345676"}],
    "Pediatria": [{name: "Dra. Mariana Silva (F)", ci:"1712345677"}, {name: "Dr. Alejandro Ríos (M)", ci:"1712345678"}]
};

// Horarios de ejemplo para el Calendario (Mañana)
let agendaHorarios = [
    { id: 1, hora: "08:00 AM", disponible: true },
    { id: 2, hora: "09:00 AM", disponible: false },
    { id: 3, hora: "10:00 AM", disponible: true },
    { id: 4, hora: "11:00 AM", disponible: true },
    { id: 5, hora: "14:00 PM", disponible: false },
    { id: 6, hora: "15:00 PM", disponible: true }
];

// Citas iniciales corregidas ("Pediatria" sin tilde)
let misCitas = [
    { id: 101, especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: new Date(Date.now() + 30 * 60 * 60 * 1000) }, 
    { id: 102, especialidad: "Pediatria", medico: "Dra. Mariana Silva", fechaHora: new Date(Date.now() + 5 * 60 * 60 * 1000) }    
];

function selectRole(role) {
    selectedRole = role;
    document.getElementById('role-selection').classList.add('d-none');
    document.getElementById('auth-section').classList.remove('d-none');
    document.getElementById('auth-title').innerText = `Ingreso: ${role}`;
    
    if(role !== 'Paciente') {
        document.getElementById('toggle-auth-mode').classList.add('d-none');
    } else {
        document.getElementById('toggle-auth-mode').classList.remove('d-none');
    }
}

function backToRoles() {
    document.getElementById('auth-section').classList.add('d-none');
    document.getElementById('role-selection').classList.remove('d-none');
    isRegisterMode = false;
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? "Registro de Paciente" : "Iniciar Sesión";
    document.getElementById('email-group').classList.toggle('d-none', !isRegisterMode);
    document.getElementById('pass-requirements').classList.toggle('d-none', !isRegisterMode);
    document.getElementById('btn-auth-submit').innerText = isRegisterMode ? "Enviar Código de Verificación" : "Ingresar";
}

// Envío de Formulario Auth
const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (isRegisterMode) {
            document.getElementById('auth-section').classList.add('d-none');
            document.getElementById('verification-section').classList.remove('d-none');
        } else {
            loginExitoso();
        }
    });
}

function verifyCode() {
    alert("¡Código Verificado con Éxito!");
    document.getElementById('verification-section').classList.add('d-none');
    loginExitoso();
}

function loginExitoso() {
    document.getElementById('auth-section').classList.add('d-none');
    document.getElementById('dashboard-section').classList.remove('d-none');
    document.getElementById('dashboard-welcome').innerText = `Panel de Control - Rol: ${selectedRole}`;
    
    document.getElementById('view-paciente').classList.add('d-none');
    document.getElementById('view-medico').classList.add('d-none');
    document.getElementById('view-admin').classList.add('d-none');
    document.getElementById('my-appointments-box').classList.add('d-none');

    if(selectedRole === 'Paciente') {
        document.getElementById('view-paciente').classList.remove('d-none');
        document.getElementById('my-appointments-box').classList.remove('d-none');
        renderCalendar();
        renderSidebarAppointments();
    } else if(selectedRole === 'Medico') {
        document.getElementById('view-medico').classList.remove('d-none');
        // Control de protección en caso de que este nodo no exista en el HTML corporativo
        const extraFields = document.getElementById('paciente-extra-fields');
        if (extraFields) extraFields.classList.add('d-none');
    } else if(selectedRole === 'Administrador') {
        document.getElementById('view-admin').classList.remove('d-none');
        const sidebarRight = document.getElementById('sidebar-right');
        if (sidebarRight) sidebarRight.classList.add('d-none');
    }
}

function loadMedicos() {
    const esp = document.getElementById('select-especialidad').value;
    const selectMed = document.getElementById('select-medico');
    selectMed.innerHTML = '';
    
    if(!esp || !medicosData[esp]) {
        selectMed.innerHTML = '<option value="">Primero elija la especialidad...</option>';
        return;
    }
    
    medicosData[esp].forEach(med => {
        let opt = document.createElement('option');
        opt.value = med.ci;
        opt.innerText = med.name;
        selectMed.appendChild(opt);
    });
}

function renderCalendar() {
    const container = document.getElementById('calendar-container') || document.querySelector('.calendar-grid');
    if (!container) return;
    container.innerHTML = '';
    
    agendaHorarios.forEach(slot => {
        let div = document.createElement('div');
        div.className = `slot-card ${slot.disponible ? 'slot-available' : 'slot-unavailable'}`;
        div.innerText = `${slot.hora}\n${slot.disponible ? 'Disponible' : 'No Disponible'}`;
        if(slot.disponible) {
            div.onclick = () => agendarCasilla(slot);
        }
        container.appendChild(div);
    });
}

function agendarCasilla(slot) {
    const specSelect = document.getElementById('select-especialidad');
    const medSelect = document.getElementById('select-medico');
    
    // CORRECCIÓN: Validación previa a la lectura del índice seleccionado para evitar caídas catastróicas
    if(!specSelect.value || !medSelect.value || medSelect.selectedIndex === -1) {
        alert("Por favor selecciona una especialidad y un médico antes de elegir un horario.");
        return;
    }
    
    let medNombre = medSelect.options[medSelect.selectedIndex].text;
    let confirmacion = confirm(`¿Deseas agendar tu cita a las ${slot.hora} con el especialista ${medNombre}?`);
    
    if(confirmacion) {
        slot.disponible = false;
        misCitas.push({
            id: Date.now(),
            especialidad: specSelect.value,
            medico: medNombre,
            fechaHora: new Date(Date.now() + 48 * 60 * 60 * 1000) 
        });
        renderCalendar();
        renderSidebarAppointments();
    }
}

function renderSidebarAppointments() {
    const container = document.getElementById('appointments-sidebar-list');
    if (!container) return;
    container.innerHTML = '';
    
    misCitas.forEach(cita => {
        let div = document.createElement('div');
        div.className = "p-2 border-bottom mb-2 bg-white rounded";
        div.innerHTML = `
            <strong>${cita.especialidad}</strong><br>
            <small class="text-muted">${cita.medico}</small><br>
            <small class="text-secondary">${cita.fechaHora.toLocaleString()}</small>
            <button class="btn btn-danger btn-sm w-100 mt-1" onclick="intentarCancelarCita(${cita.id})">Cancelar</button>
        `;
        container.appendChild(div);
    });
}

function intentarCancelarCita(id) {
    const cita = misCitas.find(c => c.id === id);
    if (!cita) return;

    const ahora = new Date();
    const diferenciaHoras = (cita.fechaHora - ahora) / (1000 * 60 * 60);

    if (diferenciaHoras < 24) {
        alert("No se puede cancelar. Las citas solo se pueden cancelar con un mínimo de 24 horas de anticipación.");
    } else {
        let seguro = confirm("¿Está seguro de cancelar la cita?");
        if (seguro) {
            misCitas = misCitas.filter(c => c.id !== id);
            alert("Cita cancelada correctamente.");
            renderSidebarAppointments();
        }
    }
}

function logout() {
    location.reload();
}
