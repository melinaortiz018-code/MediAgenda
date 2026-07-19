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

// Función principal que se ejecuta al hacer clic en las tarjetas de tu HTML
function openModal(role) { 
    selectedRole = role; 
    activarPanelRol(role);
}

// Compatibilidad por si alguna tarjeta llama a selectRole
function selectRole(role) {
    openModal(role);
}

// Alterna las vistas de trabajo reales basados en tus IDs reales del HTML
function activarPanelRol(role) {
    // Ocultamos la pantalla de selección de roles
    if (document.getElementById('view-roles')) {
        document.getElementById('view-roles').classList.add('d-none');
    }

    // Ocultamos preventivamente todos los paneles
    if (document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none');
    if (document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if (document.getElementById('view-admin')) document.getElementById('view-admin').classList.add('d-none');
    if (document.getElementById('my-appointments-box')) document.getElementById('my-appointments-box').classList.add('d-none');

    // Mostramos la interfaz según el rol que diste clic
    if(role === 'Paciente') { 
        if (document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.remove('d-none'); 
        if (document.getElementById('my-appointments-box')) document.getElementById('my-appointments-box').classList.remove('d-none');
        mostrarBarraSesion("Juan Pérez", "Paciente");
        renderCalendar(); 
    } else if(role === 'Medico') { 
        if (document.getElementById('view-medico')) document.getElementById('view-medico').classList.remove('d-none'); 
        mostrarBarraSesion("Dr. Silva", "Médico");
    } else if(role === 'Admin' || role === 'Administrador') { 
        if (document.getElementById('view-admin')) document.getElementById('view-admin').classList.remove('d-none'); 
        mostrarBarraSesion("Administrador", "Admin");
    }
}

// Muestra la barra superior morada de sesión activa
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

// Función para el botón de Cerrar Sesión
function logOut() { 
    if (document.getElementById('view-roles')) document.getElementById('view-roles').classList.remove('d-none'); 
    if (document.getElementById('view-paciente')) document.getElementById('view-paciente').classList.add('d-none'); 
    if (document.getElementById('view-medico')) document.getElementById('view-medico').classList.add('d-none'); 
    if (document.getElementById('view-admin')) document.getElementById('view-admin').classList.add('d-none');
    
    const barra = document.getElementById("user-tag");
    if (barra) barra.style.display = "none";
}

// Control de selección de especialidades y médicos
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
