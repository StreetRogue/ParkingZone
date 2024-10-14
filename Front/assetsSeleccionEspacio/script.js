const buttonsA = document.querySelectorAll('.spaceA');
const buttonsB = document.querySelectorAll('.spaceB');
const btnCancelar = document.getElementById("btn-cancelar");

buttonsA.forEach(function(buttonA, index) {
    buttonA.onclick = function() {
        const parrafo = buttonA.querySelector("p");
        if (parrafo.style.backgroundColor === "transparent" || parrafo.style.backgroundColor === "") {
            parrafo.style.backgroundColor = "#FFE701";  // Nuevo color
        } else {
            parrafo.style.backgroundColor = "transparent";  // Regresa al original
        }
    };
});

buttonsB.forEach(function(buttonB, index) {
    buttonB.onclick = function() {
        const parrafo = buttonB.querySelector("p");
        if (parrafo.style.backgroundColor === "transparent" || parrafo.style.backgroundColor === "") {
            parrafo.style.backgroundColor = "#FFE701";  // Nuevo color
        } else {
            parrafo.style.backgroundColor = "transparent";  // Regresa al original
        }
    };
});

// Cancelar entrada al parqueadero

btnCancelar.addEventListener("click", function () {
    window.location.href = "../pages/Index.html#registrar-entrada";
});