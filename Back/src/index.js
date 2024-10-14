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
app.post("/iniciarSesion", async (req, res) => {
    // Validar que los campos no esten vacios
    if (req.body.user && req.body.password) {
        // Conexion a Base de Datos
        const conexion = await dataBase.getConnection();
        let consulta = `SELECT *
            FROM USUARIO
            WHERE NOMBREUSUARIO = '` + req.body.user + `' AND CONTRASENIA = '` + req.body.password + `'`;
        // Realizo la consulta
        const data = await conexion.execute(consulta);

        // Validar que el administrador exista
        if (data.rows.length == 0) {
            console.log("El administrador no existe");
            // Cerrar conexion
            conexion.close();
            return res.status(400).send({ status: "Error" });
        } else {
            console.log("Inicio de sesion correcto");
            // Cerrar conexion
            conexion.close();
            return res.send({ status: "ok", message: "Inicio de sesion correcto", redirect: "/Pages/Index.html" });
        }
    } else {
        return res.status(400).send({ status: "Error" });
    }
});

// Registro Entradas
app.post("/validarRegistro", async (req, res) => {
    const { cedula, nombre, placa } = req.body;
    if (cedula && nombre && placa) {
        // Conexion a Base de Datos
        const conexion = await dataBase.getConnection();

        // Comsulta de verificacion de placa con zona de parqueo ocupada
        let consultaVehiculoZona = `
            SELECT zp.NumeroEspacio, zp.Zona, zp.Estado
            FROM Vehiculo v
            JOIN EntradaSalida es ON v.placa = es.placa
            JOIN ZonaParqueo zp ON es.ID_ZonaParqueo = zp.ID_ZonaParqueo
            WHERE v.placa = '${placa}'
            AND zp.Estado = 'Ocupado'`;

        const dataVehiculo = await conexion.execute(consultaVehiculoZona);

        // Si el vehículo está en una zona de parqueo ocupada, se retorna error
        if (dataVehiculo.rows.length > 0) {
            console.log("El vehículo ya está registrado");
            conexion.close();
            return res.status(400).send({ status: "Error", message: "Vehículo ya se encuentra en el parqueadero" });
        }

        // Consulta de verificacion de cedula con zona de parqueo ocupada
        let consultaVisitanteZona = `
            SELECT zp.NumeroEspacio, zp.Zona, zp.Estado
            FROM Vehiculo v
            JOIN Visitante vi ON v.cedula = vi.cedula
            JOIN EntradaSalida es ON v.placa = es.placa
            JOIN ZonaParqueo zp ON es.ID_ZonaParqueo = zp.ID_ZonaParqueo
            WHERE vi.cedula = '${cedula}'
            AND zp.Estado = 'Ocupado'`;
        const dataVisitante = await conexion.execute(consultaVisitanteZona);

        // Si el visitante está en una zona de parqueo ocupada, se retorna error
        if (dataVisitante.rows.length > 0) {
            console.log("El visitante ya está registrado");
            conexion.close();
            return res.status(400).send({ status: "Error", message: "Visitante ya se encuentra en el parqueadero" });
        }

        // Validación exitosa
        console.log("Validación exitosa, redirigiendo a selección de zona de parqueo");
        conexion.close();
        return res.send({ status: "ok", message: "Validación exitosa", redirect: "/Pages/seleccionEspacio.html" });

    } else {
        return res.status(400).send({ status: "Error", message: "Todos los campos son obligatorios" });
    }
});

// Registro Salidas
app.post("/validarSalida", async (req, res) => {
    const { cedula, placa } = req.body;
    if (cedula && placa) {
        let conexion;
        try {
            // Conexión a Base de Datos
            conexion = await dataBase.getConnection();

            // Consulta para verificar si el vehículo y el visitante están registrados y en el parqueadero
            let consultaSalida = `
                SELECT es.ID_EntradaSalida, zp.ID_ZonaParqueo, zp.Estado
                FROM EntradaSalida es
                JOIN Vehiculo v ON es.placa = v.placa
                JOIN Visitante vi ON v.cedula = vi.cedula
                JOIN ZonaParqueo zp ON es.ID_ZonaParqueo = zp.ID_ZonaParqueo
                WHERE vi.cedula = '${cedula}' AND v.placa = '${placa}' AND zp.Estado = 'Ocupado'`;

            const dataSalida = await conexion.execute(consultaSalida);

            // Si no hay registro, se retorna error
            if (dataSalida.rows.length === 0) {
                console.log("Salida no válida: el vehículo no se encuentra en el parqueadero");
                return res.status(400).send({ status: "Error", message: "El vehículo no se encuentra registrado o ya ha salido." });
            } else {
                // Actualizar fecha del sistema
                let actualizarSalida = `
                    UPDATE EntradaSalida es
                    SET es.FechaSalida = CURRENT_TIMESTAMP
                    WHERE es.placa = '${placa}'
                    AND es.ID_ZonaParqueo = (
                        SELECT e.ID_ZonaParqueo
                        FROM EntradaSalida e
                        JOIN Vehiculo v ON e.placa = v.placa
                        JOIN Visitante vi ON v.cedula = vi.cedula
                        WHERE vi.cedula = '${cedula}'
                        AND v.placa = '${placa}'
                    )`;
                await conexion.execute(actualizarSalida);

                // Actualizar el estado de la zona de parqueo a 'Disponible'
                let actualizarZona = `
                    UPDATE ZonaParqueo
                    SET Estado = 'Disponible'
                    WHERE ID_ZonaParqueo = (
                        SELECT es.ID_ZonaParqueo
                        FROM EntradaSalida es
                        JOIN Vehiculo v ON es.placa = v.placa
                        JOIN Visitante vi ON v.cedula = vi.cedula
                        WHERE vi.cedula = '${cedula}' AND v.placa = '${placa}'
                    )`;
                await conexion.execute(actualizarZona);

                await conexion.commit(); // commit 
                console.log("Salida registrada exitosamente");
                return res.send({ status: "ok", message: "Validación exitosa", redirect: "Index.html#home" });
            }
        } catch (error) {
            console.error("Error al procesar la salida:", error);
            return res.status(500).send({ status: "Error", message: error.message }); // Mostrar mensaje de error más específico
        } finally {
            if (conexion) {
                await conexion.close(); // Asegurarse de cerrar la conexión
            }
        }
    } else {
        return res.status(400).send({ status: "Error", message: "Todos los campos son obligatorios" });
    }
});

