// script.js

document.addEventListener('DOMContentLoaded', function() {
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

        // Comprobación de los campos
        if (cedula && nombre && placa) {
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
        } else {
            msjError.innerHTML = "Todos los campos son obligatorios";
        }
    });
});
