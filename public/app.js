let selectedRole = '';
let isRegisterMode = false;
let usuarioLogueadoActual = '';

// Base de datos oficial de los 8 médicos fijos con sus correos y claves corporativas
const medicosData = { 
    "Medicina General": [
        {name: "Dra. Elena Espinoza", ci:"1712345671", email: "elena.espinoza@mediagenda.com", pass: "elena123"}, 
        {name: "Dr. Carlos Mendoza", ci:"1712345672", email: "carlos.mendoza@mediagenda.com", pass: "carlos123"}
    ], 
    "Psicologia": [
        {name: "Dra. Camila Restrepo", ci:"1712345675", email: "camila.restrepo@mediagenda.com", pass: "camila123"}, 
        {name: "Dr. Fernando Ortiz", ci:"1712345676", email: "fernando.ortiz@mediagenda.com", pass: "fernando123"}
    ],
    "Nutricion": [
        {name: "Dra. Mariana Silva", ci:"1712345677", email: "mariana.silva@mediagenda.com", pass: "mariana123"}, 
        {name: "Dr. Alejandro Ríos", ci:"1712345678", email: "alejandro.rios@mediagenda.com", pass: "alejandro123"}
    ],
    "Odontologia": [
        {name: "Dra. Valeria Benítez", ci:"1712345673", email: "valeria.benitez@mediagenda.com", pass: "valeria123"}, 
        {name: "Dr. Ricardo Alarcón", ci:"1712345674", email: "ricardo.alarcon@mediagenda.com", pass: "ricardo123"}
    ]
};

let agendaHorariosDisponibles = {
    "08:00 AM": true, "09:00 AM": true, "10:30 AM": true,
    "11:00 AM": true, "14:00 PM": false, "15:00 PM": false
};

let misCitas = [
    { id: "1", paciente: "María Augusta Flores", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "10:30 AM - 18/07/2026", estado: "Pendiente" },
    { id: "2", paciente: "Pedro José Andrade", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "14:00 PM - 19/07/2026", estado: "Pendiente" }
];

let citasCanceladasHistorial = 3;
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
        if (role === 'Admin' || role === 'Medico') {
            if (authTabs) authTabs.style.display = 'none';
            if (authTitle) { authTitle.style.display = 'block'; authTitle.innerText = role === 'Admin' ? "Ingreso Administrativo" : "Ingreso Médico"; }
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
}
function switchTab(mode) {
    isRegisterMode = (mode === 'register');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login-container');
    const formRegister = document.getElementById('form-register-container');
    if (isRegisterMode) {
        tabLogin?.classList.remove('active'); tabRegister?.classList.add('active');
        if (formLogin) formLogin.style.display = 'none'; if (formRegister) formRegister.classList.remove('d-none');
    } else {
        tabLogin?.classList.add('active'); tabRegister?.classList.remove('active');
        if (formLogin) formLogin.style.display = 'block'; if (formRegister) formRegister.classList.add('d-none');
    }
}

function executeLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!email || !pass) { alert("⚠️ Por favor rellenar los campos de acceso."); return; }

    if (selectedRole === 'Admin') {
        if (email !== CREDENCIALES_ADMIN.email || pass !== CREDENCIALES_ADMIN.pass) {
            alert("❌ Credenciales de Administrador incorrectas."); return;
        }
        usuarioLogueadoActual = "Administrador";
    } else if (selectedRole === 'Medico') {
        // Buscar si el correo ingresado pertenece a alguno de los 8 médicos
        let medicoEncontrado = null;
        for (let esp in medicosData) {
            let encontrado = medicosData[esp].find(m => m.email === email && m.pass === pass);
            if (encontrado) { medicoEncontrado = encontrado; break; }
        }
        if (!medicoEncontrado) {
            alert("❌ Correo o clave de Médico incorrectos.\n\nRevisa la lista de credenciales de tus 8 médicos corporativos.");
            return;
        }
        usuarioLogueadoActual = medicoEncontrado.name;
    } else {
        usuarioLogueadoActual = email;
    }
    closeModal();
    activarPanelRol(selectedRole, email);
}

function executeRegister() {
    alert("🎉 Cuenta de Paciente registrada con éxito."); switchTab('login');
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
        mostrarBarraSesion(email, "Paciente"); renderSidebarAppointments(); 
    } else if(role === 'Medico') { 
        document.getElementById('view-medico')?.classList.remove('d-none'); 
        mostrarBarraSesion(usuarioLogueadoActual, "Médico");
        renderConfiguracionSlotsMedico(); renderTablaMedico(usuarioLogueadoActual); 
    } else if(role === 'Admin') { 
        document.getElementById('view-admin')?.classList.remove('d-none'); 
        mostrarBarraSesion("Administrador General", "Admin"); renderPanelAdmin(); 
    }
}

function mostrarBarraSesion(nombre, rol) {
    document.getElementById("user-display").textContent = `Usuario: ${nombre} `;
    document.getElementById("role-display").textContent = rol.toUpperCase();
    document.getElementById("user-tag").style.display = "block";
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
    const selectMed = document.getElementById('select-med'); if(!selectMed) return;
    selectMed.innerHTML = ''; 
    if(!esp || !medicosData[esp]) { 
        selectMed.innerHTML = '<option value="" selected disabled>-- Selecciona un área primero --</option>'; selectMed.disabled = true; return; 
    } 
    selectMed.disabled = false;
    let optDefecto = document.createElement('option'); optDefecto.value = ""; optDefecto.innerText = "-- Selecciona un médico --"; optDefecto.disabled = true; optDefecto.selected = true; selectMed.appendChild(optDefecto);
    medicosData[esp].forEach(med => { 
        let opt = document.createElement('option'); opt.value = med.name; opt.innerText = med.name; selectMed.appendChild(opt); 
    });
}
function updateCalendarioPaciente() { document.getElementById('select-fecha').disabled = false; }
function updateTurnosPaciente() {
    const selectHor = document.getElementById('select-hor'); if(!selectHor) return;
    selectHor.disabled = false; selectHor.innerHTML = '<option value="" selected disabled>-- Elige un turno disponible --</option>';
    for (let hora in agendaHorariosDisponibles) {
        if (agendaHorariosDisponibles[hora] === true) {
            let opt = document.createElement('option'); opt.value = hora; opt.innerText = `${hora} - Disponible`; selectHor.appendChild(opt);
        }
    }
}
function executeSchedule() {
    const esp = document.getElementById('select-esp').value; const medSelect = document.getElementById('select-med');
    const fecha = document.getElementById('select-fecha').value; const hora = document.getElementById('select-hor').value;
    if (!esp || !medSelect.value || !fecha || !hora) { alert("⚠️ Por favor complete todos los pasos."); return; }
    misCitas.push({ id: String(misCitas.length + 1), paciente: "Paciente Activo", especialidad: esp, medico: medSelect.value, fechaHora: `${hora} - ${fecha}`, estado: "Pendiente" });
    alert("🎉 Cita agendada de forma exitosa."); renderSidebarAppointments();
}
// --- INTERFAZ DEL PACIENTE CON BOTÓN CANCELAR ---
function renderSidebarAppointments() {
    const tbody = document.getElementById('tabla-citas-paciente'); if (!tbody) return; tbody.innerHTML = '';
    misCitas.forEach(cita => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cita.id}</td><td>${cita.especialidad}</td><td>${cita.medico}</td><td>${cita.fechaHora}</td>
            <td><span style="background:#fff3cd; color:#856404; padding:3px 8px; border-radius:4px;">${cita.estado}</span></td>
            <td><button class="btn-danger" onclick="cancelarCitaGlobal('${cita.id}', 'Paciente')">Cancelar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- INTERFAZ DEL MÉDICO CON BOTÓN CANCELAR ---
function renderConfiguracionSlotsMedico() {
    const container = document.getElementById('medico-slots-config-container'); if (!container) return; container.innerHTML = '';
    for (let hora in agendaHorariosDisponibles) {
        let btn = document.createElement('button'); btn.type = 'button'; let estaActivo = agendaHorariosDisponibles[hora];
        btn.className = estaActivo ? 'time-slot-btn active-slot' : 'time-slot-btn inactive-slot'; btn.innerText = `${hora} [${estaActivo ? 'ACTIVO' : 'OCULTO'}]`;
        btn.onclick = function() { agendaHorariosDisponibles[hora] = !agendaHorariosDisponibles[hora]; renderConfiguracionSlotsMedico(); };
        container.appendChild(btn);
    }
}
function guardarDisponibilidadMedico() { alert("💾 Configuración de disponibilidad guardada de manera exitosa."); }

function renderTablaMedico(medicoNombre) {
    const tbody = document.getElementById('tabla-citas-medico'); if (!tbody) return; tbody.innerHTML = '';
    const filtro = document.getElementById('medico-filtro-agenda').value;
    let citasFiltradas = misCitas.filter(c => c.medico === medicoNombre);
    if (filtro === 'diario') citasFiltradas = citasFiltradas.filter(c => c.fechaHora.includes("18/07/2026"));
    
    if (citasFiltradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888;">No hay citas registradas para este rango.</td></tr>`; return;
    }
    citasFiltradas.forEach(cita => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cita.paciente}</strong></td><td>${cita.especialidad}</td><td>${cita.fechaHora}</td>
            <td><span style="background:#d1ecf1; color:#0c5460; padding:3px 8px; border-radius:4px;">${cita.estado}</span></td>
            <td>
                <button class="btn-warning" onclick="alert('Atendiendo consulta...')">Atender</button>
                <button class="btn-danger" style="margin-left:5px;" onclick="cancelarCitaGlobal('${cita.id}', 'Medico')">Cancelar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- FUNCIÓN GLOBAL PARA CANCELAR CITAS Y ACTUALIZAR MÉTRICAS ---
function cancelarCitaGlobal(id, rolEjecutor) {
    if (confirm("❌ ¿Está seguro de que desea cancelar esta cita médica?")) {
        misCitas = misCitas.filter(c => c.id !== id);
        citasCanceladasHistorial++; // Sube el contador analítico del Administrador
        alert("Cita cancelada con éxito del flujo activo.");
        if (rolEjecutor === 'Paciente') renderSidebarAppointments();
        if (rolEjecutor === 'Medico') renderTablaMedico(usuarioLogueadoActual);
    }
}

// --- INTERFAZ GRÁFICA DEL ADMINISTRADOR ---
function renderPanelAdmin() {
    let agendadasCount = misCitas.length; let totalOperaciones = agendadasCount + citasCanceladasHistorial;
    let porcAgendadas = totalOperaciones > 0 ? (agendadasCount / totalOperaciones) * 100 : 0;
    let porcCanceladas = totalOperaciones > 0 ? (citasCanceladasHistorial / totalOperaciones) * 100 : 0;
    
    const fillAgendadas = document.getElementById('graph-fill-agendadas');
    const fillCanceladas = document.getElementById('graph-fill-canceladas');
    if (fillAgendadas) { fillAgendadas.style.width = `${porcAgendadas}%`; fillAgendadas.innerText = `${agendadasCount} Citas (${Math.round(porcAgendadas)}%)`; }
    if (fillCanceladas) { fillCanceladas.style.width = `${porcCanceladas}%`; fillCanceladas.innerText = `${citasCanceladasHistorial} Citas (${Math.round(porcCanceladas)}%)`; }

    const tbodyUsers = document.getElementById('tabla-usuarios-admin');
    if (tbodyUsers) {
        tbodyUsers.innerHTML = `
            <tr><td><strong>admin@mediagenda.com</strong></td><td><span style="background:#343a40; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">ADMINISTRADOR</span></td><td>9999999999</td><td><span style="color:#28a745; font-weight:bold;">🟢 En Línea</span></td></tr>
            <tr><td><strong>carlos.mendoza@mediagenda.com</strong></td><td><span style="background:#007bff; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">MÉDICO</span></td><td>1712345672</td><td><span style="color:#28a745; font-weight:bold;">🟢 En Línea</span></td></tr>
        `;
    }

    const containerMedicos = document.getElementById('admin-lista-medicos-container');
    if (containerMedicos) {
        containerMedicos.innerHTML = '';
        for (let especialidad in medicosData) {
            medicosData[especialidad].forEach(medico => {
                let div = document.createElement('div'); div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:#fff; border:1px solid #ddd; border-radius:8px;";
                div.innerHTML = `<div><strong style="color:#4a148c;">${medico.name}</strong><br><small style="color:#666;">${especialidad} | ${medico.email}</small></div><span style="font-weight:bold; font-size:13px; color:#22c55e;">🟢 Monitoreado</span>`;
                containerMedicos.appendChild(div);
            });
        }
    }
}

function togglePassword(inputId, buttonEl) {
    const input = document.getElementById(inputId);
    if (input) { input.type = input.type === "password" ? "text" : "password"; buttonEl.textContent = input.type === "password" ? "👁️" : "🙈"; }
}
