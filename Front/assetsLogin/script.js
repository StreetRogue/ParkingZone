const loginForm = document.querySelector('.form-login');
const msjError = document.getElementById('alerta-error');

// Evento al enviar el formulario de login
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault(); // Evitar el envío del formulario

    // Obtenemos y limpiamos los valores de los campos
    const user = document.getElementById('name').value.trim();
    const password = document.getElementById('password').value;

    // Validación de campos vacíos
    if (!user || !password) {
        msjError.textContent = "Todos los campos son obligatorios";
        return;
    }

    // Llamado al Backend usando fetch
    const res = await fetch('http://localhost:3000/validarInicioSesion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: user,
            password: password
        })
    });
    const resData = await res.json();
    if (resData.error) {
        msjError.textContent = resData.message;
        return;
    }
    // Si el backend indica redirección, redirigimos
    if (resData.redirect) {
        window.location.href = resData.redirect;
    }
});
