import { parqueaderoExito } from "../Classes/Parqueadero.js";
console.log(parqueaderoExito.obtenerUsuarioActivo());
const registrarBtn = document.getElementById('boton-registrar');
registrarBtn.addEventListener('click', async function(e) {
    e.preventDefault(); // Evitar comportamiento por defecto del botón
    
    // Obtenemos los valores de los campos
    const cedula = document.getElementById('entrada-cedula').value;
    const nombre = document.getElementById('entrada-nombre').value;
    const placa = document.getElementById('entrada-placa').value;
    const msjError = document.getElementById('error-campos');
    
    // Validación de campos
    let validacion = validarForm(cedula, nombre, placa);
    if (validacion) {
        // Llamado al BackEnd para validar el registro del visitante y vehículo
        const res = await fetch("http://localhost:3000/validarEntrada", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cedula: cedula,
                nombre: nombre,
                placa: placa
            })
        });
        
        // Verificar si la respuesta fue exitosa
        const resJson = await res.json();
        if (!res.ok) {
            msjError.innerHTML = resJson.message;
            msjError.style.display = 'block';
            console.log(resJson.message);
        } else if (resJson.redirect) {
            // Redirigir a la página de seleccionEspacio
            localStorage.setItem('nuevoVisitante', JSON.stringify({ cedula: cedula, nombre: nombre }));
            localStorage.setItem('nuevoVehiculo', JSON.stringify({ placa: placa, cedula: cedula }));
            window.location.href = resJson.redirect;
        }
    }
});

// Función de validación de formulario
function validarForm(cedula, nombre, placa) {
    const expresiones = {
        expCedula: /^[0-9]{1,10}$/,
        expNombre: /^[a-zA-ZÀ-ÿ\s]{1,50}$/,
        expPlaca: /^[A-Z]{3}[0-9]{2}[0-9A-Z]{1}$/
    };
    const msjErrorCamp = document.getElementById('error-campos');
    const msjErrorC = document.getElementById('error-cedula');
    const msjErrorN = document.getElementById('error-nombre');
    const msjErrorP = document.getElementById('error-placa');
    let alertaActiva = false;

    if (!(cedula && nombre && placa)) {
        msjErrorCamp.innerHTML = 'Todos los campos son obligatorios';
        msjErrorCamp.style.display = 'block';
        return false;
    } else {
        msjErrorCamp.style.display = 'none';
        if (!expresiones.expCedula.test(cedula)) {
            msjErrorC.style.display = 'block';
            alertaActiva = true;
        } else {
            msjErrorC.style.display = 'none';
        }
        if (!expresiones.expNombre.test(nombre)) {
            msjErrorN.style.display = 'block';
            alertaActiva = true;
        } else {
            msjErrorN.style.display = 'none';
        }
        if (!expresiones.expPlaca.test(placa)) {
            msjErrorP.style.display = 'block';
            alertaActiva = true;
        } else {
            msjErrorP.style.display = 'none';
        }
    }
    
    return !alertaActiva;
}
