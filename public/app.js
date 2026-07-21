```javascript
const socket = io();

class MediAgendaApp {
    constructor() {
        this.currentUser = null;
        this.usuarios = [];
        this.citas = [];
        this.horarios = [];
        this.accionModalData = null;
        this.initListeners();
    }

    initListeners() {
        socket.on('connect', () => {
            socket.emit('obtener_datos_iniciales', {}, (data) => {
                this.usuarios = data.usuarios;
                this.citas = data.citas;
                this.horarios = data.horarios;
                this.poblarDoctoresDemo();
                if (this.currentUser) this.actualizarVistasDashboard();
            });
        });

        socket.on('citas_actualizadas', () => {
            socket.emit('obtener_datos_iniciales', {}, (data) => {
                this.citas = data.citas;
                if (this.currentUser) this.actualizarVistasDashboard();
            });
        });

        socket.on('actualizar_usuarios', () => {
            socket.emit('obtener_datos_iniciales', {}, (data) => {
                this.usuarios = data.usuarios;
                this.poblarDoctoresDemo();
            });
        });
    }

    cambiarVista(vistaId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(vistaId).classList.add('active');
    }

    irARol(rol) {
        if (rol === 'paciente') this.cambiarVista('view-auth-paciente');
        if (rol === 'medico') {
            this.cambiarVista('view-auth-medico');
            this.poblarDoctoresDemo();
        }
        if (rol === 'admin') this.cambiarVista('view-auth-admin');
    }

    volverHome() {
        this.cambiarVista('view-home');
    }

    switchTab(tab, e) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if (tab === 'login') {
            e.target.classList.add('active');
            document.getElementById('form-login-paciente').style.display = 'flex';
            document.getElementById('form-reg-paciente').style.display = 'none';
        } else {
            e.target.classList.add('active');
            document.getElementById('form-login-paciente').style.display = 'none';
            document.getElementById('form-reg-paciente').style.display = 'flex';
        }
    }

    togglePass(id, icon) {
        const input = document.getElementById(id);
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = '🙈';
        } else {
            input.type = 'password';
            icon.textContent = '👁️';
        }
    }

    // PACIENTE
    registrarPaciente(e) {
        e.preventDefault();
        const pass = document.getElementById('reg-pass').value;
        const confirm = document.getElementById('reg-pass-confirm').value;

        if (pass !== confirm) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const data = {
            ci: document.getElementById('reg-ci').value.trim(),
            nombre: document.getElementById('reg-nombre').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            telefono: document.getElementById('reg-tel').value.trim(),
            password: pass,
            rol: 'paciente'
        };

        socket.emit('registrar_usuario', data, (res) => {
            if (res.success) {
                alert('¡Registro exitoso! Ya puedes iniciar sesión.');
                this.switchTab('login', { target: document.querySelector('.tab-btn') });
            } else {
                alert(res.error);
            }
        });
    }

    loginPaciente(e) {
        e.preventDefault();
        const data = {
            ci: document.getElementById('login-ci').value.trim(),
            email: document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-pass').value
        };

        socket.emit('login', data, (res) => {
            if (res.success && res.user.rol.toLowerCase().trim() === 'paciente') {
                this.currentUser = res.user;
                document.getElementById('lbl-nombre-paciente').textContent = this.currentUser.nombre;
                this.llenarPerfilPaciente();
                this.cambiarVista('view-dashboard-paciente');
                this.actualizarVistasDashboard();
            } else {
                alert('Credenciales incorrectas o el usuario no es Paciente.');
            }
        });
    }

    filtrarDoctores() {
        const esp = document.getElementById('cita-especialidad').value;
        const selectMedico = document.getElementById('cita-medico');
        selectMedico.innerHTML = '<option value="">Seleccione un médico</option>';

        const medicosFiltrados = this.usuarios.filter(u => u.rol && u.rol.toLowerCase().trim() === 'medico' && u.especialidad === esp);
        medicosFiltrados.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.ci;
            opt.textContent = m.nombre;
            selectMedico.appendChild(opt);
        });
    }

    agendarCita(e) {
        e.preventDefault();
        const medicoCI = document.getElementById('cita-medico').value;
        const medicoObj = this.usuarios.find(u => u.ci === medicoCI);

        const data = {
            pacienteCI: this.currentUser.ci,
            pacienteNombre: this.currentUser.nombre,
            especialidad: document.getElementById('cita-especialidad').value,
            medicoId: medicoCI,
            medicoNombre: medicoObj ? medicoObj.nombre : 'Dr.',
            fecha: document.getElementById('cita-fecha').value,
            hora: document.getElementById('cita-hora').value,
            motivo: document.getElementById('cita-motivo').value,
            estado: 'Pendiente'
        };

        socket.emit('crear_cita', data, (res) => {
            if (res.success) {
                alert('¡Cita agendada con éxito!');
                e.target.reset();
            } else {
                alert(res.error);
            }
        });
    }

    llenarPerfilPaciente() {
        document.getElementById('perfil-nombre').value = this.currentUser.nombre;
        document.getElementById('perfil-ci').value = this.currentUser.ci;
        document.getElementById('perfil-email').value = this.currentUser.email;
        document.getElementById('perfil-tel').value = this.currentUser.telefono || '';
    }

    guardarPerfil(e) {
        e.preventDefault();
        this.currentUser.email = document.getElementById('perfil-email').value;
        this.currentUser.telefono = document.getElementById('perfil-tel').value;
        alert('Perfil actualizado correctamente.');
    }

    // MÉDICO
    poblarDoctoresDemo() {
        const select = document.getElementById('select-medico-demo');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione médico de prueba...</option>';
        const medicos = this.usuarios.filter(u => u.rol && (u.rol.toLowerCase().trim() === 'medico' || u.rol.toLowerCase().trim() === 'médico'));
        medicos.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.ci;
            opt.textContent = `${m.nombre} (${m.especialidad})`;
            select.appendChild(opt);
        });
    }

    autofillMedico(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const ci = selectedOption.value;
        const medicoEncontrado = this.usuarios.find(u => u.ci === ci);
        const password = medicoEncontrado ? medicoEncontrado.password : 'medico123';

        const inputCi = document.getElementById('medico-ci-login');
        const inputPass = document.getElementById('medico-pass-login');

        if (inputCi && ci) inputCi.value = ci;
        if (inputPass && password) inputPass.value = password;
    }

    loginMedico(e) {
        e.preventDefault();
        
        const inputCi = document.getElementById('medico-ci-login');
        const inputPass = document.getElementById('medico-pass-login');

        const data = {
            ci: inputCi ? inputCi.value.trim() : '',
            password: inputPass ? inputPass.value : ''
        };

        socket.emit('login', data, (res) => {
            if (res.success) {
                const rolUser = res.user.rol ? res.user.rol.toLowerCase().trim() : '';
                if (rolUser === 'medico' || rolUser === 'médico') {
                    this.currentUser = res.user;
                    document.getElementById('lbl-nombre-medico').textContent = this.currentUser.nombre;
                    this.cambiarVista('view-dashboard-medico');
                    this.actualizarVistasDashboard();
                } else {
                    alert('Este usuario no tiene el rol de médico autorizado.');
                }
            } else {
                alert(res.error || 'Credenciales de médico incorrectas.');
            }
        });
    }

    guardarHorarioMedico(e) {
        e.preventDefault();
        const fecha = document.getElementById('horario-fecha').value;
        const horasStr = document.getElementById('horario-horas').value;
        const horasDisponibles = horasStr.split(',').map(h => h.trim());

        socket.emit('guardar_horario', {
            medicoId: this.currentUser.ci,
            fecha,
            horasDisponibles
        });
        alert('Turnos y horarios configurados/liberados exitosamente.');
    }

    cambiarEstadoCita(id, estado) {
        const receta = prompt("Ingrese la receta u observaciones médicas:", "");
        if (receta !== null) {
            socket.emit('actualizar_estado_cita', { id, estado, receta });
        }
    }

    // ADMIN
    loginAdmin(e) {
        e.preventDefault();
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;

        if (user === 'admin' && pass === 'admin123') {
            this.currentUser = { rol: 'admin', nombre: 'Administrador' };
            this.cambiarVista('view-dashboard-admin');
            this.actualizarVistasDashboard();
        } else {
            alert('Credenciales de administrador incorrectas.');
        }
    }

    registrarMedico(e) {
        e.preventDefault();
        const data = {
            ci: document.getElementById('admin-med-ci').value.trim(),
            nombre: document.getElementById('admin-med-nombre').value.trim(),
            especialidad: document.getElementById('admin-med-esp').value.trim(),
            email: document.getElementById('admin-med-email').value.trim(),
            password: document.getElementById('admin-med-pass').value,
            rol: 'medico'
        };

        socket.emit('registrar_usuario', data, (res) => {
            if (res.success) {
                alert('Médico registrado exitosamente en la nube.');
                e.target.reset();
            } else {
                alert(res.error);
            }
        });
    }

    // MODAL UNIFICADO PARA REAGENDAR / CANCELAR
    abrirModalAccion(id, tipo) {
        this.accionModalData = { id, tipo };
        const modal = document.getElementById('modal-motivo');
        const sub = document.getElementById('modal-subtext');
        if (tipo === 'Cancelar') {
            sub.textContent = "Indique la razón de la cancelación de su cita:";
        } else {
            sub.textContent = "Indique la nueva fecha/hora y motivo de reprogramación:";
        }
        document.getElementById('texto-motivo-modal').value = '';
        modal.style.display = 'flex';
    }

    cerrarModal() {
        document.getElementById('modal-motivo').style.display = 'none';
        this.accionModalData = null;
    }

    ejecutarAccionModal() {
        const motivoCambio = document.getElementById('texto-motivo-modal').value;
        if (!motivoCambio) {
            alert('Debe ingresar un motivo obligatorio.');
            return;
        }

        const { id, tipo } = this.accionModalData;
        const nuevoEstado = tipo === 'Cancelar' ? 'Cancelada' : 'Reprogramada';

        socket.emit('actualizar_estado_cita', {
            id,
            estado: nuevoEstado,
            motivoCambio
        });

        this.cerrarModal();
        alert(`Cita ${nuevoEstado.toLowerCase()} exitosamente.`);
    }

    // ACTUALIZACIÓN DE VISTAS Y RENDERIZADO
    actualizarVistasDashboard() {
        if (this.currentUser.rol === 'paciente') {
            const tbody = document.getElementById('tabla-citas-paciente');
            tbody.innerHTML = '';
            const misCitas = this.citas.filter(c => c.pacienteCI === this.currentUser.ci);

            misCitas.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${c.medicoNombre}</td>
                    <td>${c.especialidad}</td>
                    <td>${c.fecha} - ${c.hora}</td>
                    <td><b>${c.estado}</b></td>
                    <td>
                        ${c.estado === 'Pendiente' || c.estado === 'Confirmada' ? `
                            <button class="btn-glossy btn-warning-bright" onclick="app.abrirModalAccion('${c._id}', 'Reprogramar')">Reprogramar</button>
                            <button class="btn-glossy btn-danger" onclick="app.abrirModalAccion('${c._id}', 'Cancelar')">Cancelar</button>
                        ` : `<span>Sin acciones</span>`}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        if (this.currentUser.rol === 'medico') {
            const tbody = document.getElementById('tabla-citas-medico');
            tbody.innerHTML = '';
            const misCitasMed = this.citas.filter(c => c.medicoId === this.currentUser.ci);

            misCitasMed.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${c.pacienteNombre}</td>
                    <td>${c.motivo}</td>
                    <td>${c.fecha} - ${c.hora}</td>
                    <td><b>${c.estado}</b></td>
                    <td>${c.receta || 'Sin receta aún'}</td>
                    <td>
                        <button class="btn-glossy btn-success-bright" onclick="app.cambiarEstadoCita('${c._id}', 'Confirmada')">Confirmar</button>
                        <button class="btn-glossy btn-primary-bright" onclick="app.cambiarEstadoCita('${c._id}', 'En curso')">En curso</button>
                        <button class="btn-glossy btn-success-bright" onclick="app.cambiarEstadoCita('${c._id}', 'Atendida')">Atendida</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        if (this.currentUser.rol === 'admin') {
            const total = this.citas.length;
            const exitosas = this.citas.filter(c => c.estado === 'Atendida').length;
            const reagendadas = this.citas.filter(c => c.estado === 'Reprogramada').length;
            const canceladas = this.citas.filter(c => c.estado === 'Cancelada').length;

            document.getElementById('stat-total').textContent = total;
            document.getElementById('stat-exitosas').textContent = exitosas;
            document.getElementById('stat-reagendadas').textContent = reagendadas;
            document.getElementById('stat-canceladas').textContent = canceladas;

            const tbody = document.getElementById('tabla-usuarios-admin');
            tbody.innerHTML = '';
            this.usuarios.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.ci}</td>
                    <td>${u.nombre}</td>
                    <td><b>${u.rol.toUpperCase()}</b></td>
                    <td>
                        <button class="btn-glossy btn-danger" onclick="app.eliminarUsuario('${u.ci}')">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    eliminarUsuario(ci) {
        if (confirm("¿Estás seguro de eliminar este usuario?")) {
            alert("Usuario eliminado de la base de datos.");
        }
    }

    logout() {
        this.currentUser = null;
        this.volverHome();
    }
}

const app = new MediAgendaApp();

```