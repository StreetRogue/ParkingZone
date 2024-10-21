// Importamos clases
import {ZonaParqueo} from '../Classes/ZonaParqueo.js';
import {Parqueadero} from '../Classes/Parqueadero.js';
import {Visitante} from '../Classes/Visitante.js';
import {Vehiculo} from '../Classes/Vehiculo.js';

const datosVisitante = JSON.parse(localStorage.getItem('nuevoVisitante'));
const datosVehiculo = JSON.parse(localStorage.getItem('nuevoVehiculo'));

const nuevoVisitante = new Visitante(datosVisitante.cedula, datosVisitante.nombre);
const nuevoVehiculo = new Vehiculo(datosVehiculo.placa, datosVehiculo.cedula);

console.log(nuevoVisitante.nombre);
console.log(nuevoVehiculo.placa);

const buttonsA = document.querySelectorAll('.spaceA');
const buttonsB = document.querySelectorAll('.spaceB');
const btnCancelar = document.getElementById("btn-cancelar");

// Se obtienen las zonas de la base de datos
const zonas = await fetch("http://localhost:3000/obtenerZonas");
const zonasJson = await zonas.json();

// Array donde se guardaran las zonas instanciadas
const zonasParqueo = [];

// Instanciacion de las zonas
zonasJson.forEach(function(zona, index) {
    zonasParqueo.push(new ZonaParqueo(zonasJson[index][0], zonasJson[index][1]));
});

// Se agregan las zonas al parqueadero
const parqueaderoExito = new Parqueadero(zonasParqueo);

const alertaConfir = document.getElementById('alerta-confirmacion');
const fondo = document.getElementById('overlay');

buttonsA.forEach(function(buttonA, index) {
    const parrafo = buttonA.querySelector("p");
    let zona = parqueaderoExito.zonasParqueadero[index];
    if (zona.estado == 'Disponible') {
        buttonA.onclick = function() {
            alertaConfir.classList.add('alerta-activa');
            fondo.classList.add('overlay-activo');
        };
    } else {
        parrafo.style.backgroundColor = "#FFE701";  // Nuevo color
    }
});

buttonsB.forEach(function(buttonB, index) {
    const parrafo = buttonB.querySelector("p");
    let zona = parqueaderoExito.zonasParqueadero[index + buttonsA.length];
    if (zona.estado == 'Disponible') {
        buttonB.onclick = function() {
            alertaConfir.classList.add('alerta-activa');
            fondo.classList.add('overlay-activo');
        };
    } else {
        parrafo.style.backgroundColor = "#FFE701";  // Nuevo color
    }
});

// Cancelar confirmacion del espacio
const btnConfirmarSeleccion = document.getElementById('confirmar-seleccion');
const btnCancelarSeleccion = document.getElementById('cancelar-seleccion');

btnCancelarSeleccion.addEventListener("click", function () {
    alertaConfir.classList.remove('alerta-activa');
    fondo.classList.remove('overlay-activo');
})

// Cancelar entrada al parqueadero

btnCancelar.addEventListener("click", function () {
    window.location.href = "../pages/Index.html#registrar-entrada";
});

