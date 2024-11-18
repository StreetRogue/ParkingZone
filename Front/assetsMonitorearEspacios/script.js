// Importamos clases
import { parqueaderoExito } from "../Classes/Parqueadero.js";
import { ZonaParqueo } from '../Classes/ZonaParqueo.js';
import { Visitante } from '../Classes/Visitante.js';
import { Vehiculo } from '../Classes/Vehiculo.js';

// Obtenemos los datos del visitante
//const datosVisitante = JSON.parse(localStorage.getItem('nuevoVisitante'));
//const datosVehiculo = JSON.parse(localStorage.getItem('nuevoVehiculo'));

//const nuevoVisitante = new Visitante(datosVisitante.cedula, datosVisitante.nombre);
//const nuevoVehiculo = new Vehiculo(datosVehiculo.placa, datosVehiculo.cedula);

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
parqueaderoExito.agregarZonasParqueo(zonasParqueo);

const alertaLLeno = document.getElementById('alerta-lleno');
const alertaInfo = document.getElementById('alerta-informacion');
const alertaEspacio = document.getElementById('alerta-espacio-no-ocupado');
const btnRegresarLLeno = document.getElementById('regresar-lleno');
const btnRegresarNoOcupado = document.getElementById('regresar-no-ocupado');
const btnRegresarInfo = document.getElementById('regresar-informacion');
const fondo = document.getElementById('overlay');

const nombre = document.getElementById('nombre');
const cedula = document.getElementById('cedula');
const placa = document.getElementById('placa');

let contadorZonasOcupadas = 0;

parqueaderoExito.zonasParqueadero.forEach(function(zona, index) {
    if(zona.estado == "Ocupado") {
        contadorZonasOcupadas++;
    }
});

if(contadorZonasOcupadas == parqueaderoExito.zonasParqueadero.length) {
    alertaLLeno.classList.add('alerta-activa');
    fondo.classList.add('overlay-activo');
    btnRegresarLLeno.addEventListener("click", function () {
        alertaLLeno.classList.remove('alerta-activa');
        fondo.classList.remove('overlay-activo');
    });
}

buttonsA.forEach(function(buttonA, index) {
    const parrafo = buttonA.querySelector("p");
    let zona = parqueaderoExito.zonasParqueadero[index];
    if (zona.estado == 'Disponible') {
        buttonA.onclick = function() {
            alertaEspacio.classList.add('alerta-activa');
            fondo.classList.add('overlay-activo');
            btnRegresarNoOcupado.addEventListener("click", function () {
                alertaEspacio.classList.remove('alerta-activa');
                fondo.classList.remove('overlay-activo');
            });
        };
    } else {
        parrafo.style.backgroundColor = "#FFE701";
        buttonA.onclick = async function() {
            const res = await fetch(`http://localhost:3000/obtenerInfo?zona=${encodeURIComponent(zona.noZona)}`);
            const resJson = await res.json();
            nombre.value = resJson[0][0];
            cedula.value = resJson[0][1];
            placa.value = resJson[0][2];
            alertaInfo.classList.add('alerta-activa');
            fondo.classList.add('overlay-activo');
            btnRegresarInfo.addEventListener("click", function () {
                alertaInfo.classList.remove('alerta-activa');
                fondo.classList.remove('overlay-activo');
            });
        };
    }
});

buttonsB.forEach(function(buttonB, index) {
    const parrafo = buttonB.querySelector("p");
    let zona = parqueaderoExito.zonasParqueadero[index + buttonsA.length];
    if (zona.estado == 'Disponible') {
        buttonB.onclick = function() {
            alertaEspacio.classList.add('alerta-activa');
            fondo.classList.add('overlay-activo');
            btnRegresarNoOcupado.addEventListener("click", function () {
                alertaEspacio.classList.remove('alerta-activa');
                fondo.classList.remove('overlay-activo');
            });
        };
    } else {
        parrafo.style.backgroundColor = "#FFE701";
        buttonB.onclick = async function () {
            const res = await fetch(`http://localhost:3000/obtenerInfo?zona=${encodeURIComponent(zona.noZona)}`);
            const resJson = await res.json();
            nombre.value = resJson[0][0];
            cedula.value = resJson[0][1];
            placa.value = resJson[0][2];
            alertaInfo.classList.add('alerta-activa');
            fondo.classList.add('overlay-activo');
            btnRegresarInfo.addEventListener("click", function () {
                alertaInfo.classList.remove('alerta-activa');
                fondo.classList.remove('overlay-activo');
            });
        };
    }
});

