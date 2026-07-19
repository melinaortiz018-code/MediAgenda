let selectedRole = '';
let isRegisterMode = false;
let currentUser = null;

// Médicos pregenerados alineados con las opciones de tu menú HTML (sin tildes en las claves)
const medicosData = { 
    "Medicina General": [{name: "Dra. Elena Espinoza", ci:"1712345671"}, {name: "Dr. Carlos Mendoza", ci:"1712345672"}], 
    "Psicologia": [{name: "Dra. Camila Restrepo", ci:"1712345675"}, {name: "Dr. Fernando Ortiz", ci:"1712345676"}],
    "Nutricion": [{name: "Dra. Mariana Silva", ci:"1712345677"}, {name: "Dr. Alejandro Ríos", ci:"1712345678"}],
    "Odontologia": [{name: "Dra. Valeria Benítez", ci:"1712345673"}, {name: "Dr. Ricardo Alarcón", ci:"1712345674"}]
};

// Horarios de ejemplo que alimentarán tu lista desplegable
let agendaHorarios = [ 
    "08:00 AM", "09:00 AM", "10:30 AM", "11:00 AM", "14:00 PM", "15:00 PM"
];

// Citas iniciales alineadas con las 5 columnas exactas de tu tabla
let misCitas = [ 
    { id: "1", especialidad: "Medicina General", medico: "Dr. Alejandro Martínez", fechaHora: "10:30 AM - 18/07/2026", estado: "Pendiente" }
];

// Al dar clic en una tarjeta, se muestra el Login correspondiente
function openModal(role) { 
    selectedRole = role; 
    document.getElementById('view-roles').classList.add('d-none'); 
    document.getElementById('auth-section').classList.remove('d-none');
    document.getElementById('auth-title').innerText = `Ingreso: ${role === 'Medico' ? 'Médico' : role}`;
}

function selectRole(role) {
    openModal(role);
}

function backToRoles() { 
    document.getElementById('auth-section').classList.add('d-none'); 
    document.getElementById('view-roles').classList.remove('d-none'); 
    isRegisterMode = false;
    document.getElementById('auth-form').reset();
}

function toggleAuthMode() { 
    isRegisterMode = !isRegisterMode; 
    
    const authTitle = document.getElementById('auth-title');
    const nameGroup = document.getElementById('name-group');
    const ciGroup = document.getElementById('ci-group');
    const btnSubmit = document.getElementById('btn-auth-submit');
    const toggleLink = document.getElementById('toggle-auth-mode');

    if (authTitle) authTitle.innerText = isRegisterMode ? "Registro de Cuenta" : `Ingreso: ${selectedRole}`; 
    if (btnSubmit) btnSubmit.innerText = isRegisterMode ? "Registrarse" : "Ingresar";
    if (toggleLink) toggleLink.innerText = isRegisterMode ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate aquí";

    // Activamos o removemos los campos extras de CI y Nombre de forma dinámica
    if (isRegisterMode) {
        if (nameGroup) nameGroup.classList.remove('d-none');
        if (ciGroup) ciGroup.classList.remove('d-none');
    } else {
        if (nameGroup) nameGroup.classList.add('d-none');
        if (ciGroup) ciGroup.classList.add('d-none');
    }
}

// Función interactiva para el botón del ojito de la contraseña
window.togglePasswordVisibility = function() {
    const passInput = document.getElementById('auth-password');
    if (passInput) {
        passInput.type = passInput.type === "password" ? "text" : "password";
    }
}

function loginExitoso(email) { 
    document.getElementById('auth-section').classList.add('d-none'); 
    activarPanelRol(selectedRole, email);
}

function activarPanelRol(role, email) {
    document.getElementById('view-roles').classList.add('d-none');
    if(document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none');
    if(document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if(document.getElementById('panel-citas-paciente-seccion')) document.getElementById('panel-citas-paciente-seccion').classList.add('d-none');

    if(role === 'Paciente') { 
        document.getElementById('view-paciente').classList.remove('d-none'); 
        document.getElementById('panel-citas-paciente-seccion').classList.remove('d-none'); 
        mostrarBarraSesion(email, "Paciente");
        renderSidebarAppointments(); 
    } else if(role === 'Medico') { 
        document.getElementById('view-medico').classList.remove('d-none'); 
        mostrarBarraSesion(email, "Médico");
    }
}

function mostrarBarraSesion(nombre, rol) {
    const barra = document.getElementById("user-tag");
    document.getElementById("user-display").textContent = `Usuario: ${nombre} `;
    document.getElementById("role-display").textContent = rol.toUpperCase();
    if (barra) barra.style.display = "block";
}

function logOut() { 
    document.getElementById('view-roles').classList.remove('d-none'); 
    if(document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none'); 
    if(document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if(document.getElementById('panel-citas-paciente-seccion')) document.getElementById('panel-citas-paciente-seccion').classList.add('d-none');
    document.getElementById("user-tag").style.display = "none";
    document.getElementById('auth-form').reset();
}
// 1. Carga los médicos correspondientes según tu HTML
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
    const selectFecha = document.getElementById('select-fecha');
    if(selectMed.value) {
        selectFecha.disabled = false;
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

// 🔑 NUEVAS ALERTAS INTEGRADAS CON SWEETALERT2
function executeSchedule() {
    const esp = document.getElementById('select-esp').value;
    const medSelect = document.getElementById('select-med');
    const fecha = document.getElementById('select-fecha').value;
    const hora = document.getElementById('select-hor').value;

    if (!esp || !medSelect.value || !fecha || !hora) {
        Swal.fire({ icon: 'warning', title: 'Campos Incompletos', text: 'Por favor, completa todos los pasos antes de agendar.', confirmButtonColor: '#7e57c2' });
        return;
    }

    let medNombre = medSelect.options[medSelect.selectedIndex].text;

    Swal.fire({
        title: '¿Confirmar Reserva?',
        text: `Vas a agendar una cita a las ${hora} con el especialista ${medNombre}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#7e57c2',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, agendar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            misCitas.push({ id: Date.now().toString(), especialidad: esp, medico: medNombre, fechaHora: `${hora} - ${fecha}`, estado: "Pendiente" });
            renderSidebarAppointments();
            Swal.fire({ icon: 'success', title: '¡Excelente!', text: '¡Cita agendada correctamente!', confirmButtonColor: '#7e57c2' });
            
            // Reseteo del formulario
            document.getElementById('select-esp').value = "";
            medSelect.innerHTML = '<option value="">-- Selecciona un área primero --</option>';
            medSelect.disabled = true;
            document.getElementById('select-fecha').value = "";
            document.getElementById('select-fecha').disabled = true;
            document.getElementById('select-hor').innerHTML = '<option value="">-- Elige una fecha primero --</option>';
            document.getElementById('select-hor').disabled = true;
        }
    });
}

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

window.cancelarCita = function(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción cancelará permanentemente tu cita médica programada.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#7e57c2',
        confirmButtonText: 'Sí, cancelar cita',
        cancelButtonText: 'Mantener cita'
    }).then((result) => {
        if (result.isConfirmed) {
            misCitas = misCitas.filter(c => c.id !== id);
            renderSidebarAppointments();
            Swal.fire({ icon: 'success', title: 'Cancelada', text: 'La cita ha sido cancelada correctamente.', confirmButtonColor: '#7e57c2' });
        }
    });
}

window.reagendarCita = function(id) {
    const cita = misCitas.find(c => c.id === id);
    if (!cita) return;

    Swal.fire({
        title: 'Reagendar Horario',
        text: 'Ingresa la nueva fecha y hora para tu consulta:',
        input: 'text',
        inputValue: cita.fechaHora,
        inputPlaceholder: 'Ej: 11:00 AM - 22/07/2026',
        showCancelButton: true,
        confirmButtonColor: '#facc15',
        confirmButtonText: '<span style="color: #451a03">Actualizar Horario</span>',
        cancelButtonText: 'Volver',
        inputValidator: (value) => {
            if (!value) { return '¡Debes escribir un nuevo horario válido!' }
        }
    }).then((result) => {
        if (result.value) {
            cita.fechaHora = result.value;
            renderSidebarAppointments();
            Swal.fire({ icon: 'success', title: '¡Hecho!', text: 'El horario de la cita médica se actualizó con éxito.', confirmButtonColor: '#7e57c2' });
        }
    });
}

function guardarHorarios() {
    const btn = document.getElementById("btnGuardar");
    if (btn) btn.style.display = "none";
    Swal.fire({ icon: 'success', title: 'Cambios Guardados', text: '¡Los cambios en tus horarios se publicaron con éxito!', confirmButtonColor: '#2575fc' });
}

// Controladores de formularios y accesos por correo
document.addEventListener("DOMContentLoaded", () => {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim().toLowerCase();
            const nombreInput = document.getElementById('auth-nombre')?.value || "Usuario Invitado";

            // Restricción de accesos solicitada:
            if (selectedRole === 'Medico' && email !== 'medico@agenda.com') {
                Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'Este correo no está registrado como Médico (Usa: medico@agenda.com).' });
                return;
            }
            if ((selectedRole === 'Admin' || selectedRole === 'Administrador') && email !== 'admin@agenda.com') {
                Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'Este correo no pertenece al área de Administración (Usa: admin@agenda.com).' });
                return;
            }

            if (isRegisterMode) {
                Swal.fire({ icon: 'success', title: '¡Registro Exitoso!', text: `Bienvenido al sistema MediAgenda, ${nombreInput}.` });
            }

            const nombreMostrar = isRegisterMode ? nombreInput : email;
            loginExitoso(nombreMostrar);
        });
    }

    const vistaMedico = document.getElementById("view-medico");
    const botonGuardar = document.getElementById("btnGuardar");
    if (vistaMedico && botonGuardar) {
        vistaMedico.addEventListener("input", () => { botonGuardar.style.display = "inline-block"; });
        vistaMedico.addEventListener("change", () => { botonGuardar.style.display = "inline-block"; });
    }
});
