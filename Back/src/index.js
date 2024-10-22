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
app.get("/", (req, res) => {
    res.sendFile("/Pages/login.html");
})

// Validar Inicio de Sesion
app.post("/validarInicioSesion", async (req, res) => {
    // Validar que los campos no esten vacios
    if (req.body.user && req.body.password) {
        // Conexion a Base de Datos
        const conexion = await dataBase.getConnection();
        let consulta = `
            SELECT *
            FROM USUARIO
            WHERE NOMBREUSUARIO = '` + req.body.user + `' AND CONTRASENIAUSUARIO = '` + req.body.password + `'`;
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

            return res.send({ status: "ok", message: "Inicio de sesion correcto", redirect: "/Pages/Index.html#home" });

        }
    } else {
        return res.status(400).send({ status: "Error" });
    }
});

// Registro Entradas
app.post("/validarEntrada", async (req, res) => {
    const { cedula, nombre, placa } = req.body;
    if (cedula && nombre && placa) {
        // Conexion a Base de Datos
        const conexion = await dataBase.getConnection();

        // Comsulta de verificacion de placa con zona de parqueo ocupada
        let consultaVehiculoZona = `
            SELECT *
            FROM Vehiculo v INNER JOIN EntradaSalida es 
            ON v.placaVehiculo = es.placaVehiculo INNER JOIN ZonaParqueo zp 
            ON es.ID_ZonaParqueoEntrada = zp.ID_ZonaParqueo
            WHERE v.placaVehiculo = '${placa}'
            AND zp.EstadoZona = 'Ocupado'`;

        const dataVehiculo = await conexion.execute(consultaVehiculoZona);

        // Si el vehículo está en una zona de parqueo ocupada, se retorna error
        if (dataVehiculo.rows.length > 0) {
            console.log("El vehículo ya está registrado");
            conexion.close();
            return res.status(400).send({ status: "Error", message: "Vehículo ya se encuentra en el parqueadero" });
        }

        // Consulta de verificacion de cedula con zona de parqueo ocupada
        let consultaVisitanteZona = `
            SELECT *
            FROM Vehiculo v INNER JOIN Visitante vi 
            ON v.cedulaVisitante = vi.cedulaVisitante
            INNER JOIN EntradaSalida es 
            ON v.placaVehiculo = es.placaVehiculo INNER JOIN ZonaParqueo zp ON 
            es.ID_ZonaParqueoEntrada = zp.ID_ZonaParqueo
            WHERE vi.cedulaVisitante = '${cedula}'
            AND zp.EstadoZona = 'Ocupado'`;
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

// Obtener las zonas registradas en la base de datos
app.get("/obtenerZonas", async (req, res) => {
    const conexion = await dataBase.getConnection();
    let consulta = `SELECT * FROM ZonaParqueo`;
    const data = await conexion.execute(consulta);
    res.json(data.rows);
});

app.post("/registrarVisitante", async (req, res) => {
    const {cedula, nombre} = req.body;
    if (cedula && nombre) {
        const conexion = await dataBase.getConnection();
        let agregarVisitante = `INSERT INTO Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) VALUES ('${cedula}', CURRENT_TIMESTAMP, '${nombre}')`;
        const data = await conexion.execute(agregarVisitante);
        await conexion.commit();
        console.log("Visitante registrado correctamente");
        return res.send({status: "ok"});
    }
    console.log("Error al registrar el visitante");
    return res.status(400).send({ status: "Error"});
});

app.post("/registrarVehiculo", async (req, res) => {
    const {placa, cedula} = req.body;
    if (placa && cedula) {
        const conexion = await dataBase.getConnection();
        let agregarVehiculo = `INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('${placa}', '${cedula}', (SELECT fechaEntradaVisitante FROM Visitante WHERE cedulaVisitante = '${cedula}' ORDER BY fechaEntradaVisitante DESC FETCH FIRST 1 ROWS ONLY))`;      
        const data = await conexion.execute(agregarVehiculo);
        await conexion.commit();
        console.log("Vehiculo registrado correctamente");
        return res.send({status: "ok"});
    }
    console.log("Error al registrar el vehiculo");
    return res.status(400).send({status: "Error"});
});

app.post("/registrarEntrada", async (req, res) => {
    const {placa, zona, estadoZona} = req.body;
    console.log(placa);
    console.log(zona);
    console.log(estadoZona);
    if (placa && zona && estadoZona == 'Disponible') {
        const conexion = await dataBase.getConnection();
        let agregarEntrada = `INSERT INTO EntradaSalida (FechaEntrada, placaVehiculo, ID_ZonaParqueoEntrada)
        VALUES ((SELECT fechaEntradaVehiculo FROM Vehiculo WHERE placaVehiculo = '${placa}' ORDER BY fechaEntradaVehiculo DESC FETCH FIRST 1 ROWS ONLY), '${placa}', '${zona}')`;
        const data = await conexion.execute(agregarEntrada);
        await conexion.commit();
        console.log("Entrada registrada correctamente");
        return res.send({status: "ok", redirect: "/Pages/Index.html#home"});
    }
    console.log("Error al registrar la entrada");
    return res.status(400).send({status: "Error"});
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
                SELECT es.FECHAENTRADA, zp.ID_ZonaParqueo, zp.EstadoZona
                FROM EntradaSalida es INNER JOIN Vehiculo v 
                ON es.placaVehiculo = v.placaVehiculo INNER JOIN Visitante vi
                ON v.cedulaVisitante = vi.cedulaVisitante INNER JOIN ZonaParqueo zp 
                ON es.ID_ZonaParqueoEntrada = zp.ID_ZonaParqueo
                WHERE vi.cedulaVisitante = '${cedula}' AND v.placaVehiculo = '${placa}' AND zp.EstadoZona = 'Ocupado'`;

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
                    WHERE es.placaVehiculo = '${placa}'
                    AND es.FECHAENTRADA = (
                        SELECT e.FECHAENTRADA
                        FROM EntradaSalida e INNER JOIN Vehiculo v 
                        ON e.placaVehiculo = v.placaVehiculo INNER JOIN Visitante vi 
                        ON v.cedulaVisitante = vi.cedulaVisitante
                        WHERE vi.cedulaVisitante = '${cedula}' AND v.placaVehiculo = '${placa}'
                    )`;
                await conexion.execute(actualizarSalida);

                // Actualizar el estado de la zona de parqueo a 'Disponible'
                let actualizarZona = `
                    UPDATE ZonaParqueo
                    SET EstadoZona = 'Disponible'
                    WHERE ID_ZonaParqueo = (
                        SELECT es.ID_ZONAPARQUEOENTRADA
                        FROM EntradaSalida es INNER JOIN Vehiculo v 
                        ON es.placaVehiculo = v.placaVehiculo INNER JOIN Visitante vi 
                        ON v.cedulaVisitante = vi.cedulaVisitante
                        WHERE vi.cedulaVisitante = '${cedula}' AND v.placaVehiculo = '${placa}'
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

