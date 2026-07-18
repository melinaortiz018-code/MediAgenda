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
