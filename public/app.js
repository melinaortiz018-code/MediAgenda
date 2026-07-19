let selectedRole = '';
let isRegisterMode = false;

const medicosData = { 
    "Medicina General": [{name: "Dra. Elena Espinoza", ci:"1712345671"}, {name: "Dr. Carlos Mendoza", ci:"1712345672"}], 
    "Psicologia": [{name: "Dra. Camila Restrepo", ci:"1712345675"}, {name: "Dr. Fernando Ortiz", ci:"1712345676"}],
    "Nutricion": [{name: "Dra. Mariana Silva", ci:"1712345677"}, {name: "Dr. Alejandro Ríos", ci:"1712345678"}],
    "Odontologia": [{name: "Dra. Valeria Benítez", ci:"1712345673"}, {name: "Dr. Ricardo Alarcón", ci:"1712345674"}]
};

// Mapeo de estados de disponibilidad de horarios configurados por el médico
let agendaHorariosDisponibles = {
    "08:00 AM": true,
    "09:00 AM": true,
    "10:30 AM": true,
    "11:00 AM": true,
    "14:00 PM": false,
    "15:00 PM": false
};

let misCitas = [
    { id: "1", paciente: "María Augusta Flores", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "10:30 AM - 18/07/2026", estado: "Pendiente" },
    { id: "2", paciente: "Pedro José Andrade", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "14:00 PM - 19/07/2026", estado: "Pendiente" }
];

let citasCanceladasHistorial = 3;

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
        switchTab('login');

        // Ocultar la opción de registrarse tanto para Administradores como para Médicos
        if (role === 'Admin' || role === 'Medico') {
            if (authTabs) authTabs.style.display = 'none';
            if (authTitle) {
                authTitle.style.display = 'block';
                authTitle.innerText = role === 'Admin' ? "Ingreso Administrativo" : "Ingreso Médico";
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
    if(document.getElementById('reg-name')) document.getElementById('reg-name').value = '';
    if(document.getElementById('reg-ci')) document.getElementById('reg-ci').value = '';
    if(document.getElementById('reg-email')) document.getElementById('reg-email').value = '';
    if(document.getElementById('reg-pass')) document.getElementById('reg-pass').value = '';
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
        renderConfiguracionSlotsMedico();
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
    
    // El paciente solo puede ver los horarios que el médico habilitó en su agenda
    for (let hora in agendaHorariosDisponibles) {
        if (agendaHorariosDisponibles[hora] === true) {
            let opt = document.createElement('option');
            opt.value = hora; opt.innerText = `${hora} - Disponible`;
            selectHor.appendChild(opt);
        }
    }
}

function executeSchedule() {
    const esp = document.getElementById('select-esp').value;
    const medSelect = document.getElementById('select-med');
    const fecha = document.getElementById('select-fecha').value;
    const hora = document.getElementById('select-hor').value;

    if (!esp || !medSelect.value || !fecha || !hora) {
        alert("⚠️ SOLICITUD INCOMPLETA\nPor favor, completa todas las opciones antes de agendar.");
        return;
    }

    let medNombre = medSelect.options[medSelect.selectedIndex].text;
    if (confirm(`📋 ¿CONFIRMAR RESERVA?\n\n¿Proceder a organizar una cita a las ${hora} con ${medNombre}?`)) {
        misCitas.push({
            id: String(misCitas.length + 1),
            paciente: "Paciente Certificado Activo",
            especialidad: esp,
            medico: medNombre,
            fechaHora: `${hora} - ${fecha}`,
            estado: "Pendiente"
        });
        alert("🎉 Cita registrada de forma exitosa.");
        renderSidebarAppointments();
    }
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
// --- INTERFAZ INTERACTIVA DEL MÉDICO ---

function renderConfiguracionSlotsMedico() {
    const container = document.getElementById('medico-slots-config-container');
    if (!container) return;
    container.innerHTML = '';

    for (let hora in agendaHorariosDisponibles) {
        let btn = document.createElement('button');
        btn.type = 'button';
        let estaActivo = agendaHorariosDisponibles[hora];
        
        btn.className = estaActivo ? 'time-slot-btn active-slot' : 'time-slot-btn inactive-slot';
        btn.innerText = `${hora} [${estaActivo ? 'ACTIVO' : 'OCULTO'}]`;
        
        // Alternar el estado al hacer clic en el botón de la cuadrícula
        btn.onclick = function() {
            agendaHorariosDisponibles[hora] = !agendaHorariosDisponibles[hora];
            renderConfiguracionSlotsMedico();
        };
        container.appendChild(btn);
    }
}

function guardarDisponibilidadMedico() {
    alert("💾 Configuración de disponibilidad guardada de manera exitosa en la nube central.");
}

function renderTablaMedico(medicoNombre) {
    const tbody = document.getElementById('tabla-citas-medico');
    if (!tbody) return; tbody.innerHTML = '';
    
    const filtro = document.getElementById('medico-filtro-agenda').value;
    
    // Filtrar la simulación de citas planificadas según el rango escogido (Diario, Semanal, Mensual)
    let citasFiltradas = misCitas.filter(c => c.medico === medicoNombre);
    
    if (filtro === 'diario') {
        citasFiltradas = citasFiltradas.filter(c => c.fechaHora.includes("18/07/2026"));
    }

    if (citasFiltradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888;">No hay citas registradas para este rango de planificación.</td></tr>`;
        return;
    }

    citasFiltradas.forEach(cita => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cita.paciente}</strong></td>
            <td>${cita.especialidad}</td>
            <td>${cita.fechaHora} [Planificación ${filtro.toUpperCase()}]</td>
            <td><span style="background:#d1ecf1; color:#0c5460; padding:3px 8px; border-radius:4px;">${cita.estado}</span></td>
            <td><button class="btn-warning" onclick="alert('Abriendo consulta...')">Atender</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- RENDIMIENTO Y ANALÍTICA GRÁFICA DEL ADMINISTRADOR ---

function renderPanelAdmin() {
    let agendadasCount = misCitas.length;
    let totalOperaciones = agendadasCount + citasCanceladasHistorial;
    
    // Cálculo seguro de los porcentajes gráficos reales
    let porcAgendadas = totalOperaciones > 0 ? (agendadasCount / totalOperaciones) * 100 : 0;
    let porcCanceladas = totalOperaciones > 0 ? (citasCanceladasHistorial / totalOperaciones) * 100 : 0;

    // Pintar barras de progreso gráficas dinámicamente
    const fillAgendadas = document.getElementById('graph-fill-agendadas');
    const fillCanceladas = document.getElementById('graph-fill-canceladas');

    if (fillAgendadas) {
        fillAgendadas.style.width = `${porcAgendadas}%`;
        fillAgendadas.innerText = `${agendadasCount} Citas (${Math.round(porcAgendadas)}%)`;
    }
    if (fillCanceladas) {
        fillCanceladas.style.width = `${porcCanceladas}%`;
        fillCanceladas.innerText = `${citasCanceladasHistorial} Citas (${Math.round(porcCanceladas)}%)`;
    }

    // Dibujar listado de usuarios de control del sistema (Usuario y Rol)
    const tbodyUsers = document.getElementById('tabla-usuarios-admin');
    if (tbodyUsers) {
        tbodyUsers.innerHTML = `
            <tr><td><strong>admin@mediagenda.com</strong></td><td><span style="background:#343a40; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">ADMINISTRADOR</span></td><td>9999999999</td><td><span style="color:#28a745; font-weight:bold;">🟢 En Línea</span></td></tr>
            <tr><td><strong>medico@mediagenda.com</strong></td><td><span style="background:#007bff; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">MÉDICO</span></td><td>1712345672</td><td><span style="color:#28a745; font-weight:bold;">🟢 En Línea</span></td></tr>
            <tr><td><strong>paciente_prueba@correo.com</strong></td><td><span style="background:#6c757d; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">PACIENTE</span></td><td>1712345675</td><td><span style="color:#6c757d;">⚫ Fuera de línea</span></td></tr>
        `;
    }

    // Dibujar los 8 médicos fijos supervisados
    const containerMedicos = document.getElementById('admin-lista-medicos-container');
    if (containerMedicos) {
        containerMedicos.innerHTML = '';
        for (let especialidad in medicosData) {
            medicosData[especialidad].forEach(medico => {
                let div = document.createElement('div');
                div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:#fff; border:1px solid #ddd; border-radius:8px;";
                div.innerHTML = `<div><strong style="color:#4a148c;">${medico.name}</strong><br><small style="color:#666;">${especialidad}</small></div><span style="font-weight:bold; font-size:13px; color:#22c55e;">🟢 Monitoreado</span>`;
                containerMedicos.appendChild(div);
            });
        }
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
