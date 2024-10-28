document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.form-login');
    const msjError = document.getElementById('alerta-error');

    // Evento al enviar el formulario de login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Evitar el envío del formulario

        // Obtenemos y limpiamos los valores de los campos
        const user = document.getElementById('name').value.trim();
        const password = document.getElementById('password').value.trim();

        // Validación de campos vacíos
        if (!user || !password) {
            msjError.textContent = "Todos los campos son obligatorios";
            return;
        }

        try {
            // Llamado al Backend usando fetch
            const response = await fetch("http://localhost:3000/validarInicioSesion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user: user,
                    password: password
                })
            });

            if (!response.ok) {
                msjError.textContent = "Usuario y/o Contraseña incorrecto(s)";
                return;
            }

            const responseData = await response.json();

            // Si el backend indica redirección, redirigimos
            if (responseData.redirect) {
                window.location.href = responseData.redirect;
            }
        } catch (error) {
            msjError.textContent = "Error al conectar con el servidor. Intente nuevamente.";
        }
    });
});