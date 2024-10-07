const express = require('express');
const dataBase = require("./dataBase");
const cors = require("cors");

// Servidor
const app = express();
app.set("port", 3000);
app.listen(app.get("port"));
console.log('Servidor iniciado en ' + app.get("port"));

// Middlewares
app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://127.0.0.1:5502",
        "http://localhost:5501",
        "http://localhost:5500"  
    ]
}));

app.use(express.json());

// Rutas

// Validar Inicio de Sesion
app.post("/validarInicioSesion", async (req, res) => {
    // Validar que los campos no esten vacios
    if (req.body.user && req.body.password) {
        // Conexion a Base de Datos
        const conexion = await dataBase.getConnection();
        let consulta = `SELECT *
            FROM ADMINISTRADOR
            WHERE NOMBREUSUARIO = '` + req.body.user + `' AND CONTRASENIA = '` + req.body.password + `'`;
        // Realizo la consulta
        const data = await conexion.execute(consulta);

        // Validar que el administrador exista
        if (data.rows.length == 0) {
            console.log("El administrador no existe");
            // Cerrar conexion
            conexion.close();
            return res.status(400).send({status:"Error"});
        } else {
            console.log("Inicio de sesion correcto");
            // Cerrar conexion
            conexion.close();
            return res.send({status:"ok", message:"Inicio de sesion correcto", redirect:"Index.html#home"});
        }
    } else {
        return res.status(400).send({status:"Error"});
    }
});

// Registro Entradas
app.post("/validarEntrada", async (req, res) => {
    const { cedula, nombre, placa } = req.body;
    if (cedula && nombre && placa) {
        // Conexion a Base de Datos
        const conexion = await dataBase.getConnection();
        
        // Consulta con INNER JOIN entre Visitante y Vehículo
        let consulta = `
            SELECT V.cedula, V.nombre, Veh.placa
            FROM Visitante V
            INNER JOIN Vehiculo Veh ON V.cedula = Veh.cedula
            WHERE V.cedula = '${cedula}' AND Veh.placa = '${placa}'`;
        
        const data = await conexion.execute(consulta);
        
        // Si el vehículo y el visitante ya están asociados, se retorna error
        if (data.rows.length > 0) {
            console.log("El visitante y el vehículo ya están registrados");
            conexion.close();
            return res.status(400).send({ status: "Error", message: "Visitante y vehículo ya están asociados" });
        } else {
            console.log("Validación exitosa, redirigiendo a selección de zona de parqueo");
            conexion.close();
            return res.send({ status: "ok", message: "Validación exitosa", redirect: "seleccionEspacio.html" });
        }
    } else {
        return res.status(400).send({ status: "Error", message: "Todos los campos son obligatorios" });
    }
});
