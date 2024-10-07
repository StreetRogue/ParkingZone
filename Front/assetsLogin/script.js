document.addEventListener('DOMContentLoaded', function() {
    // Seleccionamos el formulario de login
    const loginForm = document.querySelector('.form-login');

    // Evento cuando se envía el formulario de login
    loginForm.addEventListener('submit', async function(e) {
        
        e.preventDefault(); // Evitar el envío del formulario

        // Obtenemos los valores de los campos
        const user = document.getElementById('name').value;
        const password = document.getElementById('password').value;

        const msjError = document.getElementById('alerta-error');

        // Comprobacion de los campos
        if (user && password) {
            // LLamado al BackEnd
            const res = await fetch("http://localhost:3000/validarInicioSesion", {
                method:"POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user: user,
                    password: password
                })
            });

            // No se ha encontrado el administrador en la base de datos
            if (!res.ok) {
                msjError.innerHTML = "Usuario y/o Contraseña incorrecto(s)";
            }

            const resJson = await res.json();

            // Si los datos son correctos, redireccionamos a landing_page.html
            if (resJson.redirect) {
                window.location.href = resJson.redirect;
            }
        } else  if (!user || !password) {
            msjError.innerHTML = "Todos los campos son obligatorios";
        }
        
    });
});
