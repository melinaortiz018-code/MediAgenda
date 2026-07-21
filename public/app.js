// --- CONFIGURACIÓN FIREBASE (Prototipo) ---
if (typeof firebase !== 'undefined') {
    // firebase.initializeApp(firebaseConfig); // Descomentar cuando tengas tus credenciales
    console.log("Firebase listo para configurar");
}

const doctoresDB = {
    psicologia: [{ id: 'd1', nombre: 'Dra. Ana López' }, { id: 'd2', nombre: 'Dr. Carlos Ruiz' }],
    odontologia: [{ id: 'd3', nombre: 'Dra. María Gómez' }, { id: 'd4', nombre: 'Dr. Luis Torres' }],
    general: [{ id: 'd5', nombre: 'Dra. Sofia Castro' }, { id: 'd6', nombre: 'Dr. Jorge Vera' }],
    pediatria: [{ id: 'd7', nombre: 'Dra. Elena Silva' }, { id: 'd8', nombre: 'Dr. Mario Paz' }]
};

const app = {
    // Función para mostrar vistas y ocultar las demás
    showView: (viewId) => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    },

    // Alternar entre login y registro (Paciente)
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

    // Mostrar/Ocultar contraseña
    togglePassword: (inputId, iconElement) => {
        const input = document.getElementById(inputId);
        if (input.type === "password") {
            input.type = "text";
            iconElement.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = "password";
            iconElement.classList.replace('fa-eye-slash', 'fa-eye');
        }
    },

    // Filtro de médicos
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

    // Alerta modal
    promptReason: (action) => {
        Swal.fire({
            title: `Motivo para ${action}`,
            input: 'textarea',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: action === 'cancelar' ? '#ff7a93' : '#b19cd9',
            preConfirm: (reason) => {
                if (!reason) Swal.showValidationMessage(`Debe ingresar un motivo`);
                return reason;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('¡Procesado!', `Proceso completado.`, 'success');
            }
        });
    }
};

// --- LISTENERS DE FORMULARIOS PARA ENTRAR A LOS DASHBOARDS ---

// Login Paciente
document.getElementById('form-patient-login')?.addEventListener('submit', (e) => {
    e.preventDefault();
    Swal.fire('Bienvenido', 'Accediendo al portal paciente...', 'success').then(() => {
        app.showView('view-patient-dashboard');
    });
});

// Registro Paciente
document.getElementById('form-patient-register')?.addEventListener('submit', (e) => {
    e.preventDefault();
    Swal.fire('Registro Exitoso', 'Iniciando sesión...', 'success').then(() => {
        app.showView('view-patient-dashboard');
    });
});

// Login Médico
document.getElementById('form-doctor-login')?.addEventListener('submit', (e) => {
    e.preventDefault();
    Swal.fire('Bienvenido Dr.', 'Cargando agenda de hoy...', 'success').then(() => {
        app.showView('view-doctor-dashboard');
    });
});

// Login Administrador
document.getElementById('form-admin-login')?.addEventListener('submit', (e) => {
    e.preventDefault();
    Swal.fire('Acceso Autorizado', 'Entrando al panel de control...', 'success').then(() => {
        app.showView('view-admin-dashboard');
    });
});