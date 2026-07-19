let selectedRole = '';
let isRegisterMode = false;
let usuarioLogueadoActual = '';
let idCitaReagendando = null;

// Base de datos oficial de los 8 médicos fijos
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

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const rangoHorasBase = ["08:00 AM", "09:00 AM", "10:30 AM", "11:00 AM", "14:00 PM", "15:00 PM"];

let agendaSemanalMedicos = {
    "Lunes": { "08:00 AM": true, "09:00 AM": true, "10:30 AM": true, "11:00 AM": true, "14:00 PM": false, "15:00 PM": false },
    "Martes": { "08:00 AM": true, "09:00 AM": true, "10:30 AM": true, "11:00 AM": true, "14:00 PM": true, "15:00 PM": false },
    "Miércoles": { "08:00 AM": true, "09:00 AM": true, "10:30 AM": false, "11:00 AM": false, "14:00 PM": false, "15:00 PM": false },
    "Jueves": { "08:00 AM": true, "09:00 AM": true, "10:30 AM": true, "11:00 AM": true, "14:00 PM": true, "15:00 PM": true },
    "Viernes": { "08:00 AM": true, "09:00 AM": false, "10:30 AM": false, "11:00 AM": true, "14:00 PM": false, "15:00 PM": false }
};

let misCitas = [
    { id: "1", paciente: "María Augusta Flores", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "10:30 AM - Lunes", estado: "Pendiente" },
    { id: "2", paciente: "Pedro José Andrade", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "14:00 PM - Martes", estado: "Pendiente" }
];

let citasCanceladasHistorial = 3;
const CREDENCIALES_ADMIN = { email: "admin@mediagenda.com", pass: "admin123" };

function openModal(role) { 
    selectedRole = role; isRegisterMode = false;
    const authModal = document.getElementById('auth-modal');
    const authTabs = document.getElementById('auth-tabs');
    const authTitle = document.getElementById('auth-title');
    if (authModal) {
        authModal.style.display = 'flex'; switchTab('login');
        if (role === 'Admin' || role === 'Medico') {
            if (authTabs) authTabs.style.display = 'none';
            if (authTitle) { authTitle.style.display = 'block'; authTitle.innerText = role === 'Admin' ? "Ingreso Administrativo" : "Ingreso Médico"; }
        } else {
            if (authTabs) authTabs.style.display = 'flex'; if (authTitle) authTitle.style.display = 'none';
        }
    }
}
function selectRole(role) { openModal(role); }
function closeModal() { const authModal = document.getElementById('auth-modal'); if (authModal) authModal.style.display = 'none'; }

function switchTab(mode) {
    isRegisterMode = (mode === 'register');
    const tabLogin = document.getElementById('tab-login'); const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login-container'); const formRegister = document.getElementById('form-register-container');
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
    if (!email || !pass) { alert("⚠️ Por favor rellenar los campos."); return; }

    if (selectedRole === 'Admin') {
        if (email !== CREDENCIALES_ADMIN.email || pass !== CREDENCIALES_ADMIN.pass) { alert("❌ Credenciales incorrectas."); return; }
        usuarioLogueadoActual = "Administrador";
    } else if (selectedRole === 'Medico') {
        let med = null;
        for (let esp in medicosData) {
            let f = medicosData[esp].find(m => m.email === email && m.pass === pass);
            if (f) { med = f; break; }
        }
        if (!med) { alert("❌ Credenciales incorrectas."); return; }
        usuarioLogueadoActual = med.name;
    } else { usuarioLogueadoActual = email; }
    closeModal(); activarPanelRol(selectedRole, email);
}

function executeRegister() { alert("🎉 Registro exitoso."); switchTab('login'); }

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
        mostrarBarraSesion(usuarioLogueadoActual, "Médico"); renderCalendarioSemanalMedico(); renderTablaMedico(usuarioLogueadoActual); 
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

function updateMedicos() { 
    const esp = document.getElementById('select-esp').value; const selectMed = document.getElementById('select-med');
    if(!selectMed) return; selectMed.innerHTML = ''; 
    if(!esp || !medicosData[esp]) { selectMed.innerHTML = '<option>-- Elige área primero --</option>'; selectMed.disabled = true; return; }
    selectMed.disabled = false;
    let def = document.createElement('option'); def.innerText = "-- Selecciona un médico --"; def.disabled = true; def.selected = true; selectMed.appendChild(def);
    medicosData[esp].forEach(m => { let o = document.createElement('option'); o.value = m.name; o.innerText = m.name; selectMed.appendChild(o); });
}
function updateCalendarioPaciente() { document.getElementById('select-fecha').disabled = false; }
function updateTurnosPaciente() {
    const selectFecha = document.getElementById('select-fecha').value; const selectHor = document.getElementById('select-hor');
    if(!selectHor || !selectFecha) return; selectHor.disabled = false; selectHor.innerHTML = '';
    const fObj = new Date(selectFecha + 'T00:00:00');
    const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dia = nombresDias[fObj.getDay()];
    if (!agendaSemanalMedicos[dia]) { selectHor.innerHTML = '<option disabled selected>-- No hay atención --</option>'; return; }
    for (let h in agendaSemanalMedicos[dia]) {
        if (agendaSemanalMedicos[dia][h]) { let o = document.createElement('option'); o.value = `${h} - ${dia}`; o.innerText = `${h} (${dia})`; selectHor.appendChild(o); }
    }
}

function executeSchedule() {
    const esp = document.getElementById('select-esp').value; const med = document.getElementById('select-med').value;
    const fecha = document.getElementById('select-fecha').value; const hora = document.getElementById('select-hor').value;
    if (!esp || !med || !fecha || !hora) { alert("⚠️ Completa los campos."); return; }

    if (idCitaReagendando !== null) {
        let cita = misCitas.find(c => c.id === idCitaReagendando);
        if (cita) {
            cita.especialidad = esp; cita.medico = med; cita.fechaHora = `${hora} [Modificada]`;
            alert(`🎉 Tu cita ha sido reagendada con éxito al horario: ${hora}`);
        }
        cancelarModoReagendar();
    } else {
        misCitas.push({ id: String(misCitas.length + 1), paciente: "Paciente Activo", especialidad: esp, medico: med, fechaHora: hora, estado: "Pendiente" });
        alert("🎉 Cita agendada de forma exitosa.");
    }
    cancelarModoReagendar();
    renderSidebarAppointments();
}

function iniciarReagendacionGlobal(id) {
    idCitaReagendando = id; let cita = misCitas.find(c => c.id === id); if (!cita) return;
    document.getElementById('view-paciente')?.classList.remove('d-none');
    if(document.getElementById('paciente-action-title')) document.getElementById('paciente-action-title').innerText = `🔄 Reagendando Cita ID: ${id}`;
    if(document.getElementById('btn-paciente-main')) document.getElementById('btn-paciente-main').innerText = "Aplicar Cambio y Reagendar";
    if(document.getElementById('btn-cancelar-reagendar')) document.getElementById('btn-cancelar-reagendar').style.display = "block";
    document.getElementById('select-esp').value = cita.especialidad; updateMedicos();
// --- ⚙️ INTERFAZ GRÁFICA ANALÍTICA DEL ADMINISTRADOR ---
function renderPanelAdmin() {
    try {
        let ag = misCitas.length; 
        let tot = ag + citasCanceladasHistorial;
        let pAg = tot > 0 ? (ag / tot) * 100 : 0; 
        let pCan = tot > 0 ? (citasCanceladasHistorial / tot) * 100 : 0;
        
        const fillAgendadas = document.getElementById('graph-fill-agendadas');
        const fillCanceladas = document.getElementById('graph-fill-canceladas');
        
        if (fillAgendadas) { 
            fillAgendadas.style.width = `${pAg}%`; 
            fillAgendadas.innerText = `${ag} Citas (${Math.round(pAg)}%)`; 
        }
        if (fillCanceladas) { 
            fillCanceladas.style.width = `${pCan}%`; 
            fillCanceladas.innerText = `${citasCanceladasHistorial} Citas (${Math.round(pCan)}%)`; 
        }
        
        const tb = document.getElementById('tabla-usuarios-admin');
        if (tb) {
            tb.innerHTML = `
                <tr><td><strong>admin@mediagenda.com</strong></td><td><span style="background:#343a40; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">ADMINISTRADOR</span></td><td>9999999999</td><td><span style="color:#28a745; font-weight:bold;">🟢 En Línea</span></td></tr>
                <tr><td><strong>medico@mediagenda.com</strong></td><td><span style="background:#007bff; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">MÉDICO</span></td><td>1712345672</td><td><span style="color:#28a745; font-weight:bold;">🟢 En Línea</span></td></tr>
            `;
        }

        const cMed = document.getElementById('admin-lista-medicos-container');
        if (cMed) {
            cMed.innerHTML = '';
            for (let esp in medicosData) {
                medicosData[esp].forEach(m => {
                    let d = document.createElement('div'); 
                    d.style = "display:flex; justify-content:space-between; padding:8px; background:#fff; border:1px solid #ddd; border-radius:6px; margin-bottom:5px;";
                    d.innerHTML = `<div><strong>${m.name}</strong><br><small>${esp} | ${m.email}</small></div><span style="font-weight:bold; font-size:13px; color:#22c55e;">🟢 Monitoreado</span>`;
                    cMed.appendChild(d);
                });
            }
        }
    } catch (e) {
        console.log("Aviso controlado en el panel de administración.");
    }
}

// --- FUNCIÓN ADICIONAL: MOSTRAR/OCULTAR CONTRASEÑA ---
function togglePassword(id, btn) {
    const input = document.getElementById(id);
    if (input) { 
        input.type = input.type === "password" ? "text" : "password"; 
        btn.textContent = input.type === "password" ? "👁️" : "🙈"; 
    }
}

// --- CIERRE COMPLETO DE LOGOUT ---
function logOut() { 
    cancelarModoReagendar(); 
    document.getElementById('view-roles')?.classList.remove('d-none');
    document.getElementById('view-paciente')?.classList.add('d-none'); 
    document.getElementById('view-medico')?.classList.add('d-none'); 
    document.getElementById('view-admin')?.classList.add('d-none'); 
    document.getElementById('panel-citas-paciente-seccion')?.classList.add('d-none');
    document.getElementById("user-tag").style.display = "none";
}
