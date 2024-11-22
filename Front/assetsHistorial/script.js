// Función para formatear la fecha en formato YYYY-MM-DD
function formatearFecha(fecha) {
    const date = new Date(fecha); 
    const anio = date.getFullYear(); 
    const mes = (date.getMonth() + 1).toString().padStart(2, '0'); 
    const dia = date.getDate().toString().padStart(2, '0'); 
    return `${anio}-${mes}-${dia}`; 
}

// Función para formatear la tarifa $10.000 COP
function formatearTarifa(tarifa) {
    const tarifaNumero = parseFloat(tarifa);
    return `$${tarifaNumero.toLocaleString()} COP`;
}

// Filas de la tabla
let datos = [];

async function obtenerTodo() {
    const res = await fetch(`http://localhost:3000/obtenerMovimientos`);
    const resJson = await res.json();
    if (resJson.error) {
        agregarFilas();
        alert(resJson.message);
        return false;
    }
    datos = [];

    resJson.forEach(function(datosElemento, index) {
        let vehiculo = datosElemento[0] !== null ? datosElemento[0] : "-";
        let cedula = datosElemento[1] !== null ? datosElemento[1] : "-";
        let fechaEntrada = datosElemento[2] !== null ? formatearFecha(datosElemento[2]) : "-";
        let fechaSalida = datosElemento[3] !== null ? formatearFecha(datosElemento[3]) : "-"; 
        let horaEntrada = datosElemento[4] !== null ? datosElemento[4] : "-";
        let horaSalida = datosElemento[5] !== null ? datosElemento[5] : "-";
        let zona = datosElemento[6] !== null ? datosElemento[6] : "-";
        let tarifa = datosElemento[7] !== null ? formatearTarifa(datosElemento[7]) : "-";

        const nuevaFila = {
            vehiculo: vehiculo,
            cedula: cedula,
            fechaEntrada: fechaEntrada,
            fechaSalida: fechaSalida,
            horaEntrada: horaEntrada,
            horaSalida: horaSalida,
            zona: zona,
            tarifa: tarifa
        };
        datos.push(nuevaFila);
    });
    agregarFilas();
}

async function obtenerMovPlaca(placa) {
    console.log("Placa: " + placa);
    if (!(placa.trim() == "")) {
        console.log("Placa No vacia");
        const res = await fetch(`http://localhost:3000/obtenerMovimientosPlaca?placa=${encodeURIComponent(placa)}`);
        const resJson = await res.json();
        if (resJson.error) {
            alert(resJson.message);
            return false;
        }
        if(resJson.status !== "Error") {
            datos = [];
            resJson.forEach(function(datosElemento, index) {
                let vehiculo = datosElemento[0] !== null ? datosElemento[0] : "-";
                let cedula = datosElemento[1] !== null ? datosElemento[1] : "-";
                let fechaEntrada = datosElemento[2] !== null ? formatearFecha(datosElemento[2]) : "-";
                let fechaSalida = datosElemento[3] !== null ? formatearFecha(datosElemento[3]) : "-"; 
                let horaEntrada = datosElemento[4] !== null ? datosElemento[4] : "-";
                let horaSalida = datosElemento[5] !== null ? datosElemento[5] : "-";
                let zona = datosElemento[6] !== null ? datosElemento[6] : "-";
                let tarifa = datosElemento[7] !== null ? formatearTarifa(datosElemento[7]) : "-";
    
                const nuevaFila = {
                    vehiculo: vehiculo,
                    cedula: cedula,
                    fechaEntrada: fechaEntrada,
                    fechaSalida: fechaSalida,
                    horaEntrada: horaEntrada,
                    horaSalida: horaSalida,
                    zona: zona,
                    tarifa: tarifa
                };
                datos.push(nuevaFila);
            });
            agregarFilas();
            return true;
        }
    }
    return false;
}

async function obtenerMovCedula(cedula) {
    if (!(cedula.trim() === "")) {
        const res = await fetch(`http://localhost:3000/obtenerMovimientosCedula?cedula=${encodeURIComponent(cedula)}`);
        const resJson = await res.json();
        if (resJson.error) {
            alert(resJson.message);
            return false;
        }
        if(res.ok) {
            datos = [];
            resJson.forEach(function(datosElemento, index) {
                let vehiculo = datosElemento[0] !== null ? datosElemento[0] : "-";
                let cedula = datosElemento[1] !== null ? datosElemento[1] : "-";
                let fechaEntrada = datosElemento[2] !== null ? formatearFecha(datosElemento[2]) : "-";
                let fechaSalida = datosElemento[3] !== null ? formatearFecha(datosElemento[3]) : "-"; 
                let horaEntrada = datosElemento[4] !== null ? datosElemento[4] : "-";
                let horaSalida = datosElemento[5] !== null ? datosElemento[5] : "-";
                let zona = datosElemento[6] !== null ? datosElemento[6] : "-";
                let tarifa = datosElemento[7] !== null ? formatearTarifa(datosElemento[7]) : "-";
        
                const nuevaFila = {
                    vehiculo: vehiculo,
                    cedula: cedula,
                    fechaEntrada: fechaEntrada,
                    fechaSalida: fechaSalida,
                    horaEntrada: horaEntrada,
                    horaSalida: horaSalida,
                    zona: zona,
                    tarifa: tarifa
                };
                datos.push(nuevaFila);
            });
            agregarFilas();
            return true;
        }
    }
    return false;
}

const filtroSelect = document.getElementById("filter");
const inputBusqueda = document.getElementById("search-input");
const btnBusqueda = document.getElementById("search-icon");

// Detectar la tecla Enter
inputBusqueda.addEventListener("keypress", async (event) => {
    const opcionSeleccionada = filtroSelect.value;
    if (event.key === "Enter") {
        if (opcionSeleccionada == "todos") {
            await obtenerTodo(inputBusqueda.value);
        } else if (opcionSeleccionada == "placa") {
            if (!(await obtenerMovPlaca(inputBusqueda.value.toUpperCase()))) {
                datos = [];
                agregarFilas();
            }
        } else if(opcionSeleccionada == "cedula") {
            if (!(await obtenerMovCedula(inputBusqueda.value))) {
                datos = [];
                agregarFilas();
            }
        }
    }
});

// Detectar clic en el botón
btnBusqueda.addEventListener("click", async () => {
    const opcionSeleccionada = filtroSelect.value;
    console.log(opcionSeleccionada);
    if (opcionSeleccionada == "todos") {
        await obtenerTodo(inputBusqueda.value);
    } else if (opcionSeleccionada == "placa") {
        if (!(await obtenerMovPlaca(inputBusqueda.value.toUpperCase()))) {
            datos = [];
            agregarFilas();
        }
    } else if(opcionSeleccionada == "cedula") {
        if (!(await obtenerMovCedula(inputBusqueda.value))) {
            datos = [];
            agregarFilas();
        }
    }
});

// Función para agregar filas dinámicamente a la tabla
function agregarFilas() {
    const tbody = document.querySelector(".table-container table tbody"); 

    // Limpiar la tabla antes de agregar nuevas filas
    tbody.innerHTML = "";

    if (datos.length > 0) {
        // Iteramos sobre los datos y creamos filas
        datos.forEach((dato) => {
            const fila = document.createElement("tr");

            // Creamos celdas para cada dato
            fila.innerHTML = `
                <td>${dato.vehiculo}</td>
                <td>${dato.cedula}</td>
                <td>${dato.fechaEntrada}</td>
                <td>${dato.fechaSalida}</td>
                <td>${dato.horaEntrada}</td>
                <td>${dato.horaSalida}</td>
                <td>${dato.zona}</td>
                <td>${dato.tarifa}</td>
            `;

            // Agregamos la fila al cuerpo de la tabla
            tbody.appendChild(fila);
        });
    } else {
        const fila = document.createElement("tr"); // Creamos una nueva fila
            // Creamos celdas para cada dato
            fila.innerHTML = `
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            // Agregamos la fila al cuerpo de la tabla
            tbody.appendChild(fila);
    }
}

// Llamamos a la función al cargar la página
document.addEventListener("DOMContentLoaded", obtenerTodo());
