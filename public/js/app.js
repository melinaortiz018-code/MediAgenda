let selectedRole = '';
let isRegisterMode = false;

// Médicos pregenerados alineados con las opciones de tu menú HTML (sin tildes en las claves)
const medicosData = { 
    "Medicina General": [{name: "Dra. Elena Espinoza", ci:"1712345671"}, {name: "Dr. Carlos Mendoza", ci:"1712345672"}], 
    "Psicologia": [{name: "Dra. Camila Restrepo", ci:"1712345675"}, {name: "Dr. Fernando Ortiz", ci:"1712345676"}],
    "Nutricion": [{name: "Dra. Mariana Silva", ci:"1712345677"}, {name: "Dr. Alejandro Ríos", ci:"1712345678"}],
    "Odontologia": [{name: "Dra. Valeria Benítez", ci:"1712345673"}, {name: "Dr. Ricardo Alarcón", ci:"1712345674"}]
};

let agendaHorarios = ["08:00 AM", "09:00 AM", "10:30 AM", "11:00 AM", "14:00 PM", "15:00 PM"];

// Citas iniciales simuladas para tus doctores reales
let misCitas = [
    { id: "1", paciente: "María Augusta Flores", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "10:30 AM - 18/07/2026", estado: "Pendiente" },
    { id: "2", paciente: "Pedro José Andrade", especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: "14:00 PM - 19/07/2026", estado: "Pendiente" }
];

// Al dar clic en una tarjeta, forzamos que se guarde el rol de forma estricta
function openModal(role) { 
    selectedRole = role; // Fijamos el rol elegido en la variable global
    document.getElementById('view-roles').classList.add('d-none'); 
    
    const authSection = document.getElementById('auth-section');
    if (authSection) {
        authSection.classList.remove('d-none');
        document.getElementById('auth-title').innerText = `Ingreso: ${role === 'Medico' ? 'Médico' : role}`;
    } else {
        activarPanelRol(role, "Usuario Invitado");
    }
}

// Compatibilidad total con tus tarjetas HTML
function selectRole(role) { openModal(role); }

function backToRoles() { 
    document.getElementById('auth-section').classList.add('d-none'); 
    document.getElementById('view-roles').classList.remove('d-none'); 
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
    activarPanelRol(selectedRole, email); // Ahora selectedRole sí tiene el valor real
}

// CORRECCIÓN: Activación forzada de paneles quitando el bloqueo invisible
function activarPanelRol(role, email) {
    // Escondemos absolutamente todo para limpiar la pantalla de mezclas
    document.getElementById('view-roles').classList.add('d-none');
    if(document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none');
    if(document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if(document.getElementById('view-admin')) document.getElementById('view-admin').classList.add('d-none'); 
    if(document.getElementById('panel-citas-paciente-seccion')) document.getElementById('panel-citas-paciente-seccion').classList.add('d-none');

    // Evaluamos el rol guardado para encender la vista correcta
    if (role === 'Paciente') { 
        document.getElementById('view-paciente')?.classList.remove('d-none'); 
        document.getElementById('panel-citas-paciente-seccion')?.classList.remove('d-none'); 
        mostrarBarraSesion(email, "Paciente");
        renderSidebarAppointments(); 
    } else if (role === 'Medico' || role === 'Médico') { 
        document.getElementById('view-medico')?.classList.remove('d-none'); 
        mostrarBarraSesion("Dr. Carlos Mendoza", "Médico");
        renderTablaMedico("Dr. Carlos Mendoza"); // Carga los pacientes del doctor
    } else if (role === 'Admin' || role === 'Administrador') {
        document.getElementById('view-admin')?.classList.remove('d-none');
        mostrarBarraSesion("Administrador General", "Admin");
        renderPanelAdmin(); // Carga las estadísticas coloridas
    }
}

function mostrarBarraSesion(nombre, rol) {
    document.getElementById("user-display").textContent = `Usuario: ${nombre} `;
    document.getElementById("role-display").textContent = rol.toUpperCase();
    const barra = document.getElementById("user-tag");
    if (barra) barra.style.display = "block";
}

function logOut() { 
    document.getElementById('view-roles').classList.remove('d-none'); 
    if(document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none'); 
    if(document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if(document.getElementById('view-admin')) document.getElementById('view-admin').classList.add('d-none'); 
    if(document.getElementById('panel-citas-paciente-seccion')) document.getElementById('panel-citas-paciente-seccion').classList.add('d-none');
    document.getElementById("user-tag").style.display = "none";
    document.getElementById('auth-form').reset();
}
// 1. Control de Selección de Especialidades y Médicos del Paciente
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
    if(selectMed.value) document.getElementById('select-fecha').disabled = false;
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

// 2. Reserva de Consulta Médica desde el Formulario
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
    let confirmacion = confirm(`📋 ¿CONFIRMAR RESERVA?\n\nVas a agendar una cita a las ${hora} con el especialista ${medNombre}.\n\n¿Deseas continuar?`);
    
    if (confirmacion) {
        misCitas.push({ id: Date.now().toString(), paciente: "Juan Pérez", especialidad: esp, medico: medNombre, fechaHora: `${hora} - ${fecha}`, estado: "Pendiente" });
        renderSidebarAppointments();
        alert("✅ ¡ÉXITO!\nCita médica agendada correctamente.");
        
        document.getElementById('select-esp').value = "";
        medSelect.innerHTML = '<option value="">-- Selecciona un área primero --</option>';
        medSelect.disabled = true;
        document.getElementById('select-fecha').value = "";
        document.getElementById('select-fecha').disabled = true;
        document.getElementById('select-hor').innerHTML = '<option value="">-- Elige una fecha primero --</option>';
        document.getElementById('select-hor').disabled = true;
    }
}

// 3. Renderizado de las Tablas de Gestión Operativa
function renderSidebarAppointments() {
    const container = document.getElementById('tabla-citas-paciente');
    if (!container) return;
    container.innerHTML = '';
    
    misCitas.forEach(cita => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cita.especialidad}</strong></td>
            <td>${cita.medico}</td>
            <td>${cita.fechaHora}</td>
            <td><span style="background-color: #fef08a; color: #854d0e; padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 0.85rem;">${cita.estado}</span></td>
            <td>
                <button onclick="reagendarCita('${cita.id}')" class="btn-reagendar" style="background-color: #facc15; color: #451a03; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-right: 8px;">Reagendar</button>
                <button onclick="cancelarCita('${cita.id}')" class="btn-cancelar" style="background-color: #ef4444; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; cursor: pointer;">Cancelar Cita</button>
            </td>
        `;
        container.appendChild(tr);
    });
}

function renderTablaMedico(nombreMedico) {
    const container = document.getElementById('tabla-citas-medico');
    if (!container) return;
    container.innerHTML = '';

    const citasDelDia = misCitas.filter(c => c.medico === nombreMedico);

    if (citasDelDia.length === 0) {
        container.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #777; padding: 15px;">No tienes pacientes programados para este periodo.</td></tr>`;
        return;
    }

    citasDelDia.forEach(cita => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cita.paciente}</strong></td>
            <td>${cita.especialidad}</td>
            <td>${cita.fechaHora}</td>
            <td>
                <button onclick="atenderPaciente('${cita.id}')" style="background-color: #2575fc; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">Atender</button>
            </td>
        `;
        container.appendChild(tr);
    });
}

function renderPanelAdmin() {
    // Sincroniza dinámicamente el contador total de la tabla en el HTML
    const totalCitasContador = document.getElementById('admin-citas-totales');
    if (totalCitasContador) {
        totalCitasContador.textContent = misCitas.length;
    }
}

// 4. Acciones de Control de Citas y Consultas del Personal
window.cancelarCita = function(id) {
    if (confirm("❌ ¿CANCELAR CITA MÉDICA?\n\nEsta acción cancelará permanentemente tu cita programada.\n\n¿Estás seguro?")) {
        misCitas = misCitas.filter(c => c.id !== id);
        renderSidebarAppointments();
    }
}

window.reagendarCita = function(id) {
    const cita = misCitas.find(c => c.id === id);
    if (!cita) return;

    let nuevaFecha = prompt("🔄 REAGENDAR HORARIO\n\nIngresa la nueva fecha y hora para tu consulta:", cita.fechaHora);
    if (nuevaFecha && nuevaFecha.trim() !== "") {
        cita.fechaHora = nuevaFecha;
        renderSidebarAppointments();
    }
}

window.atenderPaciente = function(id) {
    alert("🩺 Iniciando consulta médica...\nAbriendo Historial Clínico del Paciente.");
    misCitas = misCitas.filter(c => c.id !== id);
    renderTablaMedico("Dr. Carlos Mendoza");
}

function guardarHorarios() {
    const btn = document.getElementById("btnGuardar");
    if (btn) btn.style.display = "none";
    alert("💾 ¡CAMBIOS GUARDADOS!\nLos cambios en tus horarios se publicaron con éxito.");
}

window.togglePasswordVisibility = function() {
    const passInput = document.getElementById('auth-password');
    if (passInput) passInput.type = passInput.type === "password" ? "text" : "password";
}

// 5. Escuchador de Inicialización y Control de Envío de Autenticación
document.addEventListener("DOMContentLoaded", () => {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim().toLowerCase();
            const nombreInput = document.getElementById('auth-nombre')?.value || "Usuario Invitado";

            if (selectedRole === 'Medico' && email !== 'medico@agenda.com') {
                alert("❌ ACCESO DENEGADO\nEste correo no está registrado como Médico (Usa: medico@agenda.com).");
                return;
            }
            if ((selectedRole === 'Admin' || selectedRole === 'Administrador') && email !== 'admin@agenda.com') {
                alert("❌ ACCESO DENEGADO\nEste correo no pertenece a Administración (Usa: admin@agenda.com).");
                return;
            }

            if (isRegisterMode) alert(`¡Registro Exitoso!\nBienvenido a MediAgenda, ${nombreInput}.`);
            loginExitoso(isRegisterMode ? nombreInput : email);
        });
    }

    const vistaMedico = document.getElementById("view-medico");
    const botonGuardar = document.getElementById("btnGuardar");
    if (vistaMedico && botonGuardar) {
        vistaMedico.addEventListener("input", () => { botonGuardar.style.display = "inline-block"; });
        vistaMedico.addEventListener("change", () => { botonGuardar.style.display = "inline-block"; });
    }
});
