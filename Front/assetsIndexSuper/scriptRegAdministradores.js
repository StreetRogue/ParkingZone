const registrarBtn = document.getElementById('boton-registrar-admin');
registrarBtn.addEventListener('click', async function(e) {
    e.preventDefault(); // Evitar comportamiento por defecto del botón
    // Obtenemos los valores de los campos
    const userInput = document.getElementById('admin-user');
    const passwordInput = document.getElementById('admin-password');
    const passwordRepInput = document.getElementById('admin-password-rep');
    const msjError = document.getElementById('error-campos-admin');
    
    let user = userInput.value;
    let password = passwordInput.value;
    let passwordRep = passwordRepInput.value;
    
    // Validación de campos
    let validacion = validarForm(user, password, passwordRep);
    if (validacion) {
        // Llamado al BackEnd para validar el registro del visitante y vehículo
        const res = await fetch("http://localhost:3000/crearNuevoAdmin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user: user,
                password: password,
                passwordRep: passwordRep
            })
        });
        
        // Verificar si la respuesta fue exitosa
        const resJson = await res.json();
        if (!res.ok) {
            msjError.innerHTML = resJson.message;
            msjError.style.display = 'block';
            console.log(resJson.message);
        } else {
            const resRol = await fetch("http://localhost:3000/otorgarRol", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user: user
                })
            });
            const resRolJson = await resRol.json();
            if (resRol.ok) {
                userInput.value = "";
                passwordInput.value = "";
                passwordRepInput.value = "";
                window.location.href = resRolJson.redirect;
            }
        }
    }
});

function validarForm(user, password, passwordRep) {
    const expresiones = {
        expUser: /^[a-zA-ZÀ-ÿ\-\_0-9]{1,50}$/,
        expPassword: /^[a-zA-ZÀ-ÿ\s0-9]{8,}$/
    };
    const msjErrorCamp = document.getElementById('error-campos-admin');
    const msjErrorU = document.getElementById('error-user');
    const msjErrorP = document.getElementById('error-password');
    const msjErrorPR = document.getElementById('error-password-rep');
    let alertaActiva = false;

    if (!(user && password && passwordRep)) {
        msjErrorCamp.innerHTML = 'Todos los campos son obligatorios';
        msjErrorCamp.style.display = 'block';
        return false;
    } else {
        msjErrorCamp.style.display = 'none';
        if (!expresiones.expUser.test(user)) {
            msjErrorU.style.display = 'block';
            alertaActiva = true;
        } else {
            msjErrorU.style.display = 'none';
        }
        if (!expresiones.expPassword.test(password)) {
            msjErrorP.style.display = 'block';
            alertaActiva = true;
        } else {
            msjErrorP.style.display = 'none';
        }
        if (passwordRep !== password) {
            msjErrorPR.style.display = 'block';
            alertaActiva = true;
        } else {
            msjErrorPR.style.display = 'none';
        }
    }
    
    return !alertaActiva;
}
