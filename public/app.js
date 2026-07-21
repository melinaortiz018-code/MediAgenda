// --- CONFIGURACIÓN FIREBASE ---
// Sustituye estos valores con los de tu proyecto de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase (Verificando que exista el objeto firebase global via CDN)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const auth = firebase.auth();
    console.log("Firebase Inicializado Correctamente");
} else {
    console.warn("Firebase CDN no cargado. Ejecutando UI en modo local.");
}

// --- BASE DE DATOS PRECARGADA DE MÉDICOS (Mockup para la vista) ---
const doctoresDB = {
    psicologia: [{ id: 'd1', nombre: 'Dra. Ana López' }, { id: 'd2', nombre: 'Dr. Carlos Ruiz' }],
    odontologia: [{ id: 'd3', nombre: 'Dra. María Gómez' }, { id: 'd4', nombre: 'Dr. Luis Torres' }],
    general: [{ id: 'd5', nombre: 'Dra. Sofia Castro' }, { id: 'd6', nombre: 'Dr. Jorge Vera' }],
    pediatria: [{ id: 'd7', nombre: 'Dra. Elena Silva' }, { id: 'd8', nombre: 'Dr. Mario Paz' }]
};

// --- CONTROLADOR DE LA APP ---
const app = {
    // Navegación entre vistas
    showView: (viewId) => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    },

    // Toggle entre Login y Registro de Paciente
    toggleAuthForm: (role) => {
        const loginForm = document.getElementById(`form-${role}-login`);
        const regForm = document.getElementById(`form-${role}-register`);
        if(loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            regForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            regForm.style.display = 'block';
        }
    },

    // Ojo para mostrar/ocultar contraseña
    togglePassword: (inputId, iconElement) => {
        const input = document.getElementById(inputId);
        if (input.type === "password") {
            input.type = "text";
            iconElement.classList.remove('fa-eye');
            iconElement.classList.add('fa-eye-slash');
        } else {
            input.type = "password";
            iconElement.classList.remove('fa-eye-slash');
            iconElement.classList.add('fa-eye');
        }
    },

    // Filtro dinámico de médicos por especialidad
    filterDoctors: () => {
        const especialidad = document.getElementById('appt-specialty').value;
        const doctorSelect = document.getElementById('appt-doctor');
        doctorSelect.innerHTML = '<option value="">Seleccione un médico...</option>';
        
        if(especialidad && doctoresDB[especialidad]) {
            doctorSelect.disabled = false;
            doctoresDB[especialidad].forEach(doc => {
                let opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = doc.nombre;
                doctorSelect.appendChild(opt);
            });
        } else {
            doctorSelect.disabled = true;
        }
    },

    // Modal Obligatorio para Cancelar/Reprogramar (SweetAlert2)
    promptReason: (action) => {
        Swal.fire({
            title: `Motivo para ${action}`,
            input: 'textarea',
            inputLabel: 'Por favor, indique la razón',
            inputPlaceholder: 'Escriba el motivo aquí...',
            inputAttributes: {
                'aria-label': 'Escriba el motivo aquí'
            },
            showCancelButton: true,
            confirmButtonText: action === 'cancelar' ? 'Confirmar Cancelación' : 'Solicitar Reprogramación',
            cancelButtonText: 'Cerrar',
            confirmButtonColor: action === 'cancelar' ? '#ff7a93' : '#b19cd9',
            preConfirm: (reason) => {
                if (!reason) {
                    Swal.showValidationMessage(`Debe ingresar un motivo para ${action}`);
                }
                return reason;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('¡Procesado!', `Su solicitud ha sido enviada. Motivo: ${result.value}`, 'success');
                // Aquí iría el update a Firebase Realtime Database
            }
        });
    }
};

// --- VALIDACIONES DE FORMULARIO (Ejemplo Registro Paciente) ---
document.getElementById('form-patient-register')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = document.getElementById('pat-reg-pwd').value;
    const pwdConf = document.getElementById('pat-reg-pwd-conf').value;

    if (pwd !== pwdConf) {
        Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
        return;
    }

    // Aquí iría la creación de usuario en Firebase Auth: firebase.auth().createUserWithEmailAndPassword(...)
    Swal.fire('Éxito', 'Paciente registrado correctamente', 'success').then(() => {
        app.showView('view-patient-dashboard');
    });
});

document.getElementById('form-book-appointment')?.addEventListener('submit', (e) => {
    e.preventDefault();
    // Lógica para bloquear duplicados en Firebase iría aquí (consulta a DB antes de insertar)
    Swal.fire('Cita Agendada', 'Su cita está Pendiente de confirmación', 'success');
});