document.getElementById('patient-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Evita que la página se recargue

    // 1. Obtener los valores del formulario
    const nombre = document.getElementById('nombre').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;

    // 2. Seleccionar el cuerpo de la tabla
    const tabla = document.getElementById('table-body');

    // 3. Crear una nueva fila con los datos del paciente
    const nuevaFila = document.createElement('tr');
    nuevaFila.innerHTML = `
        <td>${nombre}</td>
        <td>${fecha}</td>
        <td>${hora}</td>
        <td><button class="delete-btn" onclick="eliminarCita(this)">Cancelar</button></td>
    `;

    // 4. Agregar la fila a la tabla y limpiar el formulario
    tabla.appendChild(nuevaFila);
    document.getElementById('patient-form').reset();
});

// Función para eliminar una cita de la tabla
function eliminarCita(boton) {
    if (confirm('¿Estás seguro de cancelar esta cita?')) {
        boton.closest('tr').remove();
    }
}
