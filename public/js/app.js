// 1. Monitorear cambios en la interfaz en tiempo real
document.addEventListener("DOMContentLoaded", () => {
    const contenedorMedico = document.getElementById("view-medico");
    const botonGuardar = document.getElementById("btnGuardar");

    if (contenedorMedico && botonGuardar) {
        // Muestra el botón cuando el usuario escribe o interactúa
        contenedorMedico.addEventListener("input", () => {
            botonGuardar.style.display = "block"; 
        });
        
        // Muestra el botón cuando cambia un selector (select/checkbox)
        contenedorMedico.addEventListener("change", () => {
            botonGuardar.style.display = "block";
        });
    }
});

// 2. Función para procesar y salvar los datos en el sistema
function guardarHorarios() {
    console.log("Procesando el guardado de horarios...");

    // [AQUÍ] Irá tu lógica para recolectar datos de la tabla y enviarlos al servidor

    // Una vez guardado con éxito, ocultamos el botón de nuevo
    const botonGuardar = document.getElementById("btnGuardar");
    if (botonGuardar) {
        botonGuardar.style.display = "none";
    }

    alert("¡Cambios guardados correctamente!");
}
/// Función para cancelar la cita con alertas consecutivas
function cancelarCita(idCita) {
    // 1. Primer cartel interactivo de confirmación
    const usuarioSeguro = confirm("¿Estás seguro de que deseas cancelar esta cita?");
    
    if (usuarioSeguro) {
        // 2. Hace la petición real al servidor Express pasando el ID de la cita
        fetch(`/auth/cancelar-cita/${idCita}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (response.ok) {
                // 3. Segundo cartel consecutivo avisando del éxito
                alert("Su cita ha sido cancelada exitosamente.");
                window.location.reload(); // Recarga la tabla de inmediato
            } else {
                alert("Hubo un error al intentar cancelar la cita en el servidor.");
            }
        })
        .catch(error => {
            console.error("Error al cancelar:", error);
            alert("No se pudo conectar con el servidor.");
        });
    }
}

// Función para reagendar la cita que te envía al formulario del calendario
function reagendarCita(idCita) {
    window.location.href = `/auth/reagendar-cita?id=${idCita}`;
}

// Hacerlas disponibles globalmente para que el index.html las pueda leer
window.cancelarCita = cancelarCita;
window.reagendarCita = reagendarCita;

        // Hacemos la petición real al servidor Express
        fetch(`/auth/cancelar-cita/${idCita}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (response.ok) {
                alert("Su cita ha sido cancelada exitosamente.");
                window.location.reload(); // Recarga la tabla automáticamente para ver el cambio
            } else {
                alert("Hubo un error al intentar cancelar la cita.");
            }
        })
        .catch(error => console.error("Error:", error));
    }
}

// Función para reagendar la cita (te redirige a escoger una fecha a futuro)
function reagendarCita(idCita) {
    // Te envía a la ruta del formulario pasando el ID de la cita para saber cuál modificar
    window.location.href = `/auth/reagendar-cita?id=${idCita}`;
}

