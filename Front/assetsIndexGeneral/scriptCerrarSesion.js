const btnCerrarSesion = document.getElementById("btnCerrarSesion");
btnCerrarSesion.addEventListener("click", async function() {
    const data = await fetch("http://localhost:3000/cerrarSesion");
    const dataJson = await data.json();
    if (dataJson.error) {
        alert(dataJson.message);
        return;
    }
    // Si el backend indica redirección, redirigimos
    if (dataJson.redirect) {
        window.location.href = dataJson.redirect;
    }
});