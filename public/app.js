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

// --- CREDENCIALES ESTÁTICAS DE ACCESO CONFIGURADAS ---
const CREDENCIALES_MEDICO = { email: "medico@mediagenda.com", pass: "medico123" };
const CREDENCIALES_ADMIN = { email: "admin@mediagenda.com", pass: "admin123" };

function openModal(role) { 
    selectedRole = role; 
    isRegisterMode = false;
    
    const authModal = document.getElementById('auth-modal');
    const authTabs = document.getElementById('auth-tabs');
    const authTitle = document.getElementById('auth-title');

    if (authModal) {
        authModal.style.display = 'flex';
        switchTab('login'); // Forzar que abra en vista de login por defecto

        // Regla especial: Ocultar pestañas de registro si es Administrador
        if (role === 'Admin') {
            if (authTabs) authTabs.style.display = 'none';
            if (authTitle) {
                authTitle.style.display = 'block';
                authTitle.innerText = "Ingreso Administrativo";
            }
        } else {
            if (authTabs) authTabs.style.display = 'flex';
            if (authTitle) authTitle.style.display = 'none';
        }
    }
}

function selectRole(role) { openModal(role); }

function closeModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.style.display = 'none';
    document.getElementById('login-email').value = '';
    document.getElementById('login-pass').value = '';
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-ci').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-pass').value = '';
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
        tabRegister?.classList.remove('active');
        if (formLogin) formLogin.style.display = 'block';
        if (formRegister) formRegister.classList.add('d-none');
    }
}

function executeLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    if (!email || !pass) {
        alert("⚠️ Por favor rellenar los campos de acceso.");
        return;
    }

    // Validación de seguridad de las claves de prueba
    if (selectedRole === 'Admin') {
        if (email !== CREDENCIALES_ADMIN.email || pass !== CREDENCIALES_ADMIN.pass) {
            alert(`❌ Error Administrativo.\n\nPrueba usando:\nCorreo: admin@mediagenda.com\nContraseña: admin123`);
            return;
        }
    } else if (selectedRole === 'Medico') {
        if (email !== CREDENCIALES_MEDICO.email || pass !== CREDENCIALES_MEDICO.pass) {
            alert(`❌ Error del Especialista.\n\nPrueba usando:\nCorreo: medico@mediagenda.com\nContraseña: medico123`);
            return;
        }
    }

    closeModal();
    activarPanelRol(selectedRole, email);
}

function executeRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const ci = document.getElementById('reg-ci').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();

    if (!name || !ci || !email || !pass) {
        alert("⚠️ CAMPOS REQUERIDOS INCOMPLETOS\nPor favor llene los 4 campos del formulario de registro.");
        return;
    }
    alert("🎉 Cuenta registrada de forma exitosa. Ahora puede iniciar sesión.");
    switchTab('login');
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
        tr.innerHTML = `<td><strong>${cita.paciente}</strong></td><td>${cita.fechaHora}</td><td><span style="background:#d1ecf1; color:#0c5460; padding:3px 8px; border-radius:4px;">${cita.estado}</span></td><td><button class="btn-warning" onclick="alert('Atendiendo paciente...')">Atender</button></td>`;
        tbody.appendChild(tr);
    });
}

function renderPanelAdmin() {
    if(document.getElementById('stat-agendadas')) document.getElementById('stat-agendadas').innerText = misCitas.length;
