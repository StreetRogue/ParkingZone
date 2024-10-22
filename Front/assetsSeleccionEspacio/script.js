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
let zonaSeleccionada;

console.log(parqueaderoExito.zonasParqueadero[0].estado);

const alertaConfir = document.getElementById('alerta-confirmacion');
const fondo = document.getElementById('overlay');

buttonsA.forEach(function(buttonA, index) {
    const parrafo = buttonA.querySelector("p");
    let zona = parqueaderoExito.zonasParqueadero[index];
    if (zona.estado == 'Disponible') {
        buttonA.onclick = function() {
            zonaSeleccionada = zona;
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
    console.log(zona);
    if (zona.estado == 'Disponible') {
        buttonB.onclick = function() {
            zonaSeleccionada = zona;
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

btnConfirmarSeleccion.addEventListener("click", async function () {
    const resVisitante = await fetch("http://localhost:3000/registrarVisitante", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            cedula: nuevoVisitante.cedula,
            nombre: nuevoVisitante.nombre
        })
    });
    const resVisitanteJson = await resVisitante.json();

    const resVehiculo = await fetch("http://localhost:3000/registrarVehiculo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            cedula: nuevoVisitante.cedula,
            placa: nuevoVehiculo.placa,
        })
    });
    const resVehiculoJson = await resVehiculo.json();

    const resEntrada = await fetch("http://localhost:3000/registrarEntrada", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            placa: nuevoVehiculo.placa,
            zona: zonaSeleccionada.noZona,
            estadoZona: zonaSeleccionada.estado
        })
    });
    const resEntradaJson = await resEntrada.json();
    console.log(resEntrada.ok);
    if (resEntrada.ok) {
        window.location.href = resEntradaJson.redirect;
    }
});

btnCancelarSeleccion.addEventListener("click", function () {
    alertaConfir.classList.remove('alerta-activa');
    fondo.classList.remove('overlay-activo');
});

// Cancelar entrada al parqueadero

btnCancelar.addEventListener("click", function () {
    window.location.href = "../pages/Index.html#registrar-entrada";
});

