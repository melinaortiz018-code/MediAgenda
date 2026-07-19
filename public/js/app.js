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

// Citas iniciales simuladas
let misCitas = [ 
    { id: 101, especialidad: "Medicina General", medico: "Dr. Carlos Mendoza", fechaHora: new Date(Date.now() + 30 * 60 * 60 * 1000) }
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
    
    // CORRECCIÓN: Buscamos y mostramos la caja de citas agendadas removiendo d-none si existe
    const panelCitas = document.getElementById('my-appointments-box') || document.querySelector('.panel-box table')?.parentElement;
    if (panelCitas) panelCitas.classList.add('d-none');

    if(role === 'Paciente') { 
        if (document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.remove('d-none'); 
        if (panelCitas) panelCitas.classList.remove('d-none'); 
        mostrarBarraSesion("Juan Pérez", "Paciente");
        renderCalendar(); 
        renderSidebarAppointments();
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
    
    const panelCitas = document.getElementById('my-appointments-box') || document.querySelector('.panel-box table')?.parentElement;
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
        
        // CORRECCIÓN: Limpiamos los indicadores '(M)' y '(F)' para que el paciente vea el nombre limpio
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

// Renderiza la lista o tabla de citas agendadas del paciente
function renderSidebarAppointments() {
    const container = document.getElementById('appointments-sidebar-list') || document.querySelector('#my-appointments-box tbody');
    if (!container) return;
    container.innerHTML = '';
    
    misCitas.forEach(cita => {
        if(container.tagName === 'TBODY') {
            // Estructura en caso de que uses una tabla formal
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${cita.especialidad}</strong></td>
                <td>${cita.medico}</td>
                <td>${cita.fechaHora.toLocaleString()}</td>
                <td><button class="btn-danger" onclick="intentarCancelarCita(${cita.id})">Cancelar</button></td>
            `;
            container.appendChild(tr);
        } else {
            // Estructura en caso de bloques divs
            let div = document.createElement('div');
            div.className = "p-2 border-bottom mb-2 bg-white rounded";
            div.innerHTML = `
                <strong>${cita.especialidad}</strong><br>
                <small>${cita.medico}</small><br>
                <small>${cita.fechaHora.toLocaleString()}</small>
            `;
            container.appendChild(div);
        }
    });
}

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
