import { ZonaParqueo } from '../Classes/ZonaParqueo.js';
import {Parqueadero} from '../Classes/Parqueadero.js';
const buttonsA = document.querySelectorAll('.spaceA');
const buttonsB = document.querySelectorAll('.spaceB');
const btnCancelar = document.getElementById("btn-cancelar");

const ZonaA1 = new ZonaParqueo('A1', true);
const ZonaA2= new ZonaParqueo('A2', false);
const ZonaA3= new ZonaParqueo('A3', true);
const ZonaA4 = new ZonaParqueo('A4', true);
const ZonaA5 = new ZonaParqueo('A5', true);
const ZonaA6 = new ZonaParqueo('A6', false);
const ZonaA7 = new ZonaParqueo('A7', true);
const ZonaB1 = new ZonaParqueo('B1', false);
const ZonaB2= new ZonaParqueo('B2', false);
const ZonaB3= new ZonaParqueo('B3', false);
const ZonaB4 = new ZonaParqueo('B4', false);
const ZonaB5 = new ZonaParqueo('B5', true);
const ZonaB6 = new ZonaParqueo('B6', true);
const ZonaB7 = new ZonaParqueo('B7', true);

const zonasParqueo = [ZonaA1,ZonaA2,ZonaA3,ZonaA4,ZonaA5,ZonaA6,ZonaA7,ZonaB1,ZonaB2,ZonaB3,ZonaB4,ZonaB5,ZonaB6,ZonaB7]

const nuevoParqueadero = new Parqueadero(zonasParqueo);

buttonsA.forEach(function(buttonA, index) {
    const parrafo = buttonA.querySelector("p");
    let zona = nuevoParqueadero.zonasParqueadero[index];
    if (!zona.estado) {
        parrafo.style.backgroundColor = "#FFE701";  // Nuevo color
    } else {
        parrafo.style.backgroundColor = "transparent";  // Regresa al original
    }
    buttonA.onclick = function() {
        
    };
});

buttonsB.forEach(function(buttonB, index) {
    const parrafo = buttonB.querySelector("p");
    let zona = nuevoParqueadero.zonasParqueadero[index + buttonsA.length];
    console.log(zona)
    if (!zona.estado) {
        parrafo.style.backgroundColor = "#FFE701";  // Nuevo color
    } else {
        parrafo.style.backgroundColor = "transparent";  // Regresa al original
    }
    buttonB.onclick = function() {
    };
});

// Cancelar entrada al parqueadero

btnCancelar.addEventListener("click", function () {
    window.location.href = "../pages/Index.html#registrar-entrada";
});

