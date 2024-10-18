// Seleccionamos el botón de registrar
const registrarBtn = document.getElementById('boton-registrar');

// Evento cuando se hace clic en el botón de registrar
registrarBtn.addEventListener('click', async function(e) {
    e.preventDefault(); // Evitar comportamiento por defecto del botón

    // Obtenemos los valores de los campos
    const cedula = document.getElementById('entrada-cedula').value;
    const nombre = document.getElementById('entrada-nombre').value;
    const placa = document.getElementById('entrada-placa').value;
    const msjError = document.getElementById('alerta-error');

    //Validacion de campos
    let validacion = validarForm(cedula, nombre, placa);
    if (validacion) {
        // LLamado al BackEnd para validar el registro del visitante y vehículo
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
        } else if (resJson.redirect) {
            // Redirigir a la página de seleccionEspacio
            window.location.href = resJson.redirect;
        }
    }
    
});

function validarForm (cedula, nombre, placa) {
    const expresiones = {
        expCedula: /^[1-9][0-9]{5,9}$/,
        expNombre: /^[a-zA-ZÀ-ÿ\s]{3,50}$/,
        expPlaca: /^[a-zA-Z]{3}[0-9]{2}[0-9a-zA-Z]{1}$/
    }
    const msjErrorCamp = document.getElementById('error-campos');
    const msjErrorC = document.getElementById('error-cedula');
    const msjErrorN = document.getElementById('error-nombre');
    const msjErrorP = document.getElementById('error-placa');
    let validacion = true;
    if (!(cedula && nombre && placa)) {
        msjErrorCamp.style.display = 'block';
        validacion = false;
    } else {
        msjErrorCamp.style.display = 'none';
        if (!expresiones.expCedula.test(cedula)) {
            msjErrorC.style.display = 'block';
            validacion = false;
        } else {
            msjErrorC.style.display = 'none';
            validacion = true;
        }
        if (!expresiones.expNombre.test(nombre)) {
            msjErrorN.style.display = 'block';
            validacion = false;
        }
        else {
            msjErrorN.style.display = 'none';
            validacion = true;
        }
        if (!expresiones.expPlaca.test(placa)) {
            msjErrorP.style.display = 'block';
            validacion = false;
        } else {
            msjErrorP.style.display = 'none';
            validacion = true;
        }
    }
    return validacion;
}


