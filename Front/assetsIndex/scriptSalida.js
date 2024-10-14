document.addEventListener('DOMContentLoaded', function() {
    // Seleccionamos el botón de registrarSalida
    const registrarSalidaBtn = document.getElementById('boton-registrar-salida');

    // Evento cuando se hace clic en el botón de registrar
    registrarSalidaBtn.addEventListener('click', async function(e) {
        e.preventDefault(); // Evitar comportamiento por defecto del botón

        // Obtenemos los valores de los campos
        const cedulaSalida = document.getElementById('salida-cedula').value;
        const placaSalida = document.getElementById('salida-placa').value;

        const msjErrorSalida = document.getElementById('alerta-error-salida');
        msjErrorSalida.innerHTML = ""; // Limpiar mensajes de error anteriores

        // Comprobación de los campos
        if (cedulaSalida && placaSalida) {
            // LLamado al BackEnd para validar el registro del visitante y vehículo
            const res = await fetch("http://localhost:3000/validarSalida", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cedula: cedulaSalida,
                    placa: placaSalida
                })
            });

            const resJson = await res.json();
            if (!res.ok) {
                msjErrorSalida.innerHTML = resJson.message;
            } else if (resJson.redirect) {
                window.location.href = resJson.redirect;
            }
        } else {
            msjErrorSalida.innerHTML = "Todos los campos son obligatorios";
        }
    });
});
