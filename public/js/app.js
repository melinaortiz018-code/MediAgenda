let selectedRole = '';
let currentUser = null;

// Médicos pregenerados alineados con las opciones de tu menú HTML (sin tildes en las claves)
const medicosData = { 
    "Medicina General": [{name: "Dra. Elena Espinoza (F)", ci:"1712345671"}, {name: "Dr. Carlos Mendoza (M)", ci:"1712345672"}], 
    "Odontologia": [{name: "Dra. Valeria Benítez (F)", ci:"1712345673"}, {name: "Dr. Ricardo Alarcón (M)", ci:"1712345674"}], 
    "Psicologia": [{name: "Dra. Camila Restrepo (F)", ci:"1712345675"}, {name: "Dr. Fernando Ortiz (M)", ci:"1712345676"}], 
    "Nutricion": [{name: "Dra. Mariana Silva (F)", ci:"1712345677"}, {name: "Dr. Alejandro Ríos (M)", ci:"1712345678"}]
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

// Citas iniciales con la estructura exacta de tus 5 columnas del HTML
let misCitas = [ 
    { id: "1", especialidad: "Medicina General", medico: "Dr. Alejandro Martínez", fechaHora: "10:30 AM - 18/07/2026", estado: "Pendiente" }
];

// Función principal al hacer clic en las tarjetas de tu HTML
function openModal(role) { 
    selectedRole = role; 
    activarPanelRol(role);
}

function selectRole(role) {
    openModal(role);
}

// Alterna las vistas de trabajo reales basados en tus IDs reales del HTML
function activarPanelRol(role) {
    if (document.getElementById('view-roles')) {
        document.getElementById('view-roles').classList.add('d-none');
    }

    if (document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none');
    if (document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if (document.getElementById('view-admin')) document.getElementById('view-admin').classList.add('d-none');
    
    // CORRECCIÓN: Vinculamos tu ID real del contenedor de la tabla
    const panelCitas = document.getElementById('panel-citas-paciente-seccion');
    if (panelCitas) panelCitas.classList.add('d-none');

    if(role === 'Paciente') { 
        if (document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.remove('d-none'); 
        if (panelCitas) panelCitas.classList.remove('d-none'); // Hacemos visible tu tabla de citas
        mostrarBarraSesion("Juan Pérez", "Paciente");
        renderCalendar(); 
        renderSidebarAppointments(); // Renderiza las filas dinámicas
    } else if(role === 'Medico') { 
        if (document.getElementById('view-medico')) document.getElementById('view-medico').classList.remove('d-none'); 
        mostrarBarraSesion("Dr. Silva", "Médico");
    } else if(role === 'Admin' || role === 'Administrador') { 
        if (document.getElementById('view-admin')) document.getElementById('view-admin').classList.remove('d-none'); 
        mostrarBarraSesion("Administrador", "Admin");
    }
}

function mostrarBarraSesion(nombre, rol) {
    const barra = document.getElementById("user-tag");
    const displayUsuario = document.getElementById("user-display");
    const displayRol = document.getElementById("role-display");
    
    if (barra && displayUsuario && displayRol) {
        displayUsuario.textContent = `Usuario: ${nombre} `;
        displayRol.textContent = rol.toUpperCase();
        barra.style.display = "block";
    }
}

function logOut() { 
    if (document.getElementById('view-roles')) document.getElementById('view-roles').classList.remove('d-none'); 
    if (document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none'); 
    if (document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if (document.getElementById('view-admin')) document.getElementById('view-admin').classList.add('d-none');
    
    const panelCitas = document.getElementById('panel-citas-paciente-seccion');
    if (panelCitas) panelCitas.classList.add('d-none');

    const barra = document.getElementById("user-tag");
    if (barra) barra.style.display = "none";
}

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
        opt.value = med.ci; 
        opt.innerText = med.name.replace(/\s*\(M\)\s*/i, "").replace(/\s*\(F\)\s*/i, ""); 
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
        container.appendChild(div); 
    });
}

// CORRECCIÓN: Renderiza las filas dinámicas respetando tus 5 columnas y estilos CSS inline
function renderSidebarAppointments() {
    const container = document.getElementById('tabla-citas-paciente');
    if (!container) return;
    container.innerHTML = '';
    
    misCitas.forEach(cita => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cita.especialidad}</td>
            <td>${cita.medico}</td>
            <td>${cita.fechaHour || cita.fechaHora}</td>
            <td><span style="background-color: #fef08a; color: #854d0e; padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 0.85rem;">${cita.estado}</span></td>
            <td>
                <button onclick="reagendarCita('${cita.id}')" class="btn-reagendar" style="background-color: #facc15; color: #451a03; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-right: 8px;">Reagendar</button>
                <button onclick="cancelarCita('${cita.id}')" class="btn-cancelar" style="background-color: #ef4444; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; cursor: pointer;">Cancelar Cita</button>
            </td>
        `;
        container.appendChild(tr);
    });
}

// Funciones globales mapeadas a tus clicks de los botones de la tabla
window.cancelarCita = function(id) {
    let seguro = confirm("¿Está seguro de cancelar esta cita médica?");
    if (seguro) {
        misCitas = misCitas.filter(c => c.id !== id);
        renderSidebarAppointments();
        alert("Cita cancelada correctamente.");
    }
}

window.reagendarCita = function(id) {
    alert("Función para reagendar cita activa. Selecciona un nuevo horario en el panel.");
}

// Inicialización del detector de cambios al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    const vistaMedico = document.getElementById("view-medico");
    const botonGuardar = document.getElementById("btnGuardar");
    if (vistaMedico && botonGuardar) {
        vistaMedico.addEventListener("input", () => { botonGuardar.style.display = "block"; });
        vistaMedico.addEventListener("change", () => { botonGuardar.style.display = "block"; });
    }
});

function guardarHorarios() {
    const botonGuardar = document.getElementById("btnGuardar");
    if (botonGuardar) botonGuardar.style.display = "none";
    alert("¡Los cambios se guardaron de manera exitosa!");
}
