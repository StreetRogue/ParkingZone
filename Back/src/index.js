const express = require('express');
const {dataBase} = require("./dataBase");
const cors = require("cors");
const path = require('path');
const pdfKit = require('../libs/pdfKit.js');

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
    ],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../Front")));

// Rutas
app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../../Front/Pages/login.html"));
});

// Validar Inicio de Sesion
app.post("/validarInicioSesion", async (req, res) => {
    // Validar que los campos no esten vacios
    if (req.body.user && req.body.password) {
        // Se intenta hacer la conexion a la base de datos
        try {
            // Conexion a la base de datos
            const data = await dataBase.iniciarSesion(req.body.user, req.body.password);
            console.log("Conexion a base de datos correcta");
            // Se verifica si el inicio de sesion se hizo correctamente
            if (!data.success) {
                return res.status(400).send({ status: "Error", message: data.message });
            }
            console.log("Inicio de sesión correcto");
            // Se redirige al index del usuario
            return res.send({ status: "ok", message: "Inicio de sesión correcto", redirect: data.redirect });
        } 
        // Si no se ha iniciado sesion, se retorna error
        catch(error) {
            console.log(error.message);
            return res.send({ error: "error", message: error.message });
        }
    }
});

// Registro Entradas
app.post("/validarEntrada", async (req, res) => {
    const { cedula, nombre, placa } = req.body;
    // Validar que los campos no esten vacios
    if (cedula && nombre && placa) {
        // Se intenta hacer la conexion a la base de datos
        try {
            // Conexion a la base de datos
            const conexion = await dataBase.getConnectionUser();

            // Comsulta si el vehiculo ya se encuentra dentro del parqueadero
            let consultaVehiculo = `
                SELECT *
                FROM USER_PROYECTOINGS.EntradaSalida
                INNER JOIN USER_PROYECTOINGS.Vehiculo
                ON EntradaSalida.FechaEntrada = Vehiculo.FechaEntradaVehiculo
                WHERE Vehiculo.PlacaVehiculo like :placa
                AND EntradaSalida.FechaSalida IS NULL
            `;

            const dataVehiculo = await conexion.execute(consultaVehiculo, {placa: placa});

            // Si el vehículo esta dentro del parqueadero, se retorna error
            if (dataVehiculo.rows.length > 0) {
                console.log("El vehículo ya está registrado");
                return res.status(400).send({ status: "Error", message: "Vehículo ya se encuentra en el parqueadero" });
            }

            // Consulta si la cedula ya se encuentra dentro del parqueadero
            let consultaVisitante = `
                SELECT *
                FROM USER_PROYECTOINGS.EntradaSalida
                INNER JOIN USER_PROYECTOINGS.Vehiculo
                ON EntradaSalida.FechaEntrada = Vehiculo.FechaEntradaVehiculo
                INNER JOIN USER_PROYECTOINGS.Visitante
                ON Vehiculo.FechaEntradaVehiculo = Visitante.FechaEntradaVisitante
                WHERE Visitante.CedulaVisitante like :cedula
                AND EntradaSalida.FechaSalida IS NULL
            `;
            const dataVisitante = await conexion.execute(consultaVisitante, {cedula: cedula});

            // Si el visitante esta dentro del parqueadero, se retorna error
            if (dataVisitante.rows.length > 0) {
                console.log("El visitante ya está registrado");
                return res.status(400).send({ status: "Error", message: "El visitante ya se encuentra en el parqueadero" });
            }

            // Validación exitosa
            console.log("Validación exitosa, redirigiendo a selección de zona de parqueo");
            return res.send({ status: "ok", message: "Validación exitosa", redirect: "/Pages/seleccionEspacio.html" });
        } 
        // Si no se ha iniciado sesion, se retorna error
        catch(error) {
            console.log(error.message);
            return res.send({ error: "error", message: error.message });
        }
    } else {
        return res.status(400).send({ status: "Error", message: "Todos los campos son obligatorios" });
    }
});

// Obtener las zonas registradas en la base de datos
app.get("/obtenerZonas", async (req, res) => {
    // Se intenta hacer la conexion a la base de datos
    try {
        // Conexion a la base de datos
        const conexion = await dataBase.getConnectionUser();
        // Se obtienen las zonas de parqueo
        let consulta = `SELECT * FROM USER_PROYECTOINGS.ZonaParqueo`;
        const data = await conexion.execute(consulta);
        res.json(data.rows);
    }
    // Si no se ha iniciado sesion, se retorna error
    catch(error) {
        console.log(error.message);
        return res.send({ error: "error", message: error.message });
    }
    
});

// Agregar nuevo visitante
app.post("/registrarVisitante", async (req, res) => {
    const { cedula, nombre } = req.body;
    // Validar que los campos no esten vacios
    if (cedula && nombre) {
        // Se intenta hacer la conexion a la base de datos
        try {
            // Conexion a la base de datos
            const conexion = await dataBase.getConnectionUser();
            // Consulta para agregar visitante
            let agregarVisitante = `
                INSERT INTO USER_PROYECTOINGS.Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) 
                VALUES (:cedula, CURRENT_TIMESTAMP, :nombre)
            `;
            const data = await conexion.execute(agregarVisitante, {cedula: cedula, nombre:nombre});
            await conexion.commit();
            console.log("Visitante registrado correctamente");
            return res.send({status: "ok"});
        }
        // Si no se ha iniciado sesion, se retorna error
        catch(error) {
            console.log(error.message);
            return res.send({ error: "error", message: error.message });
        }
    }
    console.log("Error al registrar el visitante");
    return res.status(400).send({ status: "error"});
});

// Agregar nuevo vehiculo
app.post("/registrarVehiculo", async (req, res) => {
    const { placa, cedula } = req.body;
    // Se valida que los campos no esten vacios
    if (placa && cedula) {
        // Se intenta hacer la conexion a la base de datos
        try {
            // Conexion a la base de datos
            const conexion = await dataBase.getConnectionUser();
            // Consulta para agregar vehiculo
            let agregarVehiculo = `
                INSERT INTO USER_PROYECTOINGS.Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) 
                VALUES (:placa, :cedula, 
                    (SELECT fechaEntradaVisitante 
                    FROM USER_PROYECTOINGS.Visitante 
                    WHERE cedulaVisitante like :cedula 
                    ORDER BY fechaEntradaVisitante DESC FETCH FIRST 1 ROWS ONLY)
                )
            `;      
            const data = await conexion.execute(agregarVehiculo, {placa: placa, cedula: cedula});
            await conexion.commit();
            console.log("Vehiculo registrado correctamente");
            return res.send({status: "ok"});
        }
        // Si no se ha iniciado sesion, se retorna error
        catch(error) {
            console.log(error.message);
            return res.send({ error: "error", message: error.message });
        }
    }
    console.log("Error al registrar el vehiculo");
    return res.status(400).send({status: "error"});
});

// Registrar la entrada
app.post("/registrarEntrada", async (req, res) => {
    const { placa, zona, estadoZona } = req.body;
    // Se verifica que los campos no esten vacios y la zona seleccionada este disponible
    if (placa && zona && estadoZona == 'Disponible') {
        try {
            // Conexion a la base de  datos
            const conexion = await dataBase.getConnectionUser();
            // Consulta para agregar entrada
            let agregarEntrada = `
                INSERT INTO USER_PROYECTOINGS.EntradaSalida (FechaEntrada, placaVehiculo, ID_ZonaParqueoEntrada)
                VALUES ((
                    SELECT fechaEntradaVehiculo 
                    FROM USER_PROYECTOINGS.Vehiculo 
                    WHERE placaVehiculo like :placa 
                    ORDER BY fechaEntradaVehiculo DESC FETCH FIRST 1 ROWS ONLY), :placa, :zona)
            `;
            const data = await conexion.execute(agregarEntrada, {placa: placa, zona: zona});
            await conexion.commit();
            console.log("Entrada registrada correctamente");
            // Se redirige al index de usuario
            const redirectUrl = dataBase.getRol() === 'Admin' ? "/Pages/IndexAdmin.html#home" : "/Pages/IndexSuperAdmin.html#home";
            return res.send({status: "ok", redirect: redirectUrl});
        } 
        // Si no se ha iniciado sesion, se retorna error
        catch(error) {
            console.log(error.message);
            return res.send({ error: "error", message: error.message });
        }
    }
    console.log("Error al registrar la entrada");
    return res.status(400).send({status: "Error"});
});

// Registrar Salidas
app.post("/validarSalida", async (req, res) => {
    const { cedula, placa } = req.body;
    // Se verifica que todos los campos esten completos
    if (cedula && placa) {
        // Se intenta hacer la conexion a la base de datos
        try {
            // Conexión a Base de Datos
            const conexion = await dataBase.getConnectionUser();
            console.log("Registro de Salida");

            // Consulta para verificar si el vehículo se encuentra dentro del parqueadero
            let buscarAuto = `
                SELECT * 
                FROM USER_PROYECTOINGS.entradaSalida 
                WHERE placaVehiculo like :placa and FECHASALIDA IS NULL
            `;
            const dataAuto = await conexion.execute(buscarAuto, {placa: placa});
            // Si el vehiculo no se encuentra del parqueadero, lanza un error
            if (dataAuto.rows.length == 0) {
                console.log("No se encuentra un registro de entrada para el vehiculo");
                return res.status(400).send({ status: "Error", message: "No se encontró un registro de entrada para el vehículo" });
            }
            
            // Consulta si el visitante se encuentra en el parqueadero
            let buscarVisitante = `
                SELECT * 
                FROM USER_PROYECTOINGS.entradaSalida 
                INNER JOIN USER_PROYECTOINGS.Visitante 
                on entradaSalida.FECHAENTRADA = Visitante.FECHAENTRADAVISITANTE 
                WHERE cedulaVisitante like :cedula and FECHASALIDA IS NULL
            `;
            // Si el visitante no se encuentra del parqueadero, lanza un error
            const dataVisitante = await conexion.execute(buscarVisitante, {cedula: cedula});
            if (dataVisitante.rows.length == 0) {
                console.log("No se encuentra un registro de entrada para la persona");
                return res.status(400).send({ status: "Error", message: "No se encontró un registro de entrada para la persona" });
            }

            // Verifica la coincidencia de los datos
            let coincidenciaInfo = `
                SELECT * 
                FROM USER_PROYECTOINGS.entradaSalida 
                INNER JOIN USER_PROYECTOINGS.Vehiculo 
                ON entradaSalida.FECHAENTRADA = vehiculo.FECHAENTRADAVEHICULO 
                INNER JOIN USER_PROYECTOINGS.Visitante 
                ON USER_PROYECTOINGS.vehiculo.CEDULAVISITANTE = USER_PROYECTOINGS.visitante.CEDULAVISITANTE 
                WHERE vehiculo.placavehiculo like :placa and visitante.cedulavisitante like :cedula and fechaSalida IS NULL
            `;
            const dataCoincidencia = await conexion.execute(coincidenciaInfo, {placa: placa, cedula: cedula});
            // Si la informacion ingresada no coincide con la de la entrada, lanza un error
            if (dataCoincidencia.rows.length == 0) {
                console.log("La cedula y placa no coinciden con la informacion de registro");
                return res.status(400).send({ status: "Error", message: "La información no coincide con el registro o ya se registro la salida" });
            }

            // Actualizar fecha del sistema
            let actualizarSalida = `
                UPDATE USER_PROYECTOINGS.EntradaSalida es
                SET es.FechaSalida = CURRENT_TIMESTAMP
                WHERE es.placaVehiculo like :placa
                AND es.FECHAENTRADA = (
                    SELECT e.FECHAENTRADA
                    FROM USER_PROYECTOINGS.EntradaSalida e 
                    INNER JOIN USER_PROYECTOINGS.Vehiculo v 
                    ON e.placaVehiculo = v.placaVehiculo 
                    INNER JOIN USER_PROYECTOINGS.Visitante vi 
                    ON v.cedulaVisitante = vi.cedulaVisitante
                    WHERE vi.cedulaVisitante like :cedula AND v.placaVehiculo like :placa
                    ORDER BY e.FECHAENTRADA DESC
                    FETCH FIRST 1 ROWS ONLY
                )
            `;
            await conexion.execute(actualizarSalida, {placa: placa, cedula: cedula});
            await conexion.commit();
            console.log("Salida registrada exitosamente");
            // Se redirige al index del usuario
            const redirectUrl = dataBase.getRol() === 'Admin' ? "/Pages/IndexAdmin.html#home" : "/Pages/IndexSuperAdmin.html#home";
            return res.send({status: "ok", redirect: redirectUrl});
        }
        // Si no se ha iniciado sesion, se retorna error
        catch(error) {
            console.log(error.message);
            return res.send({ error: "error", message: error.message });
        }
    } else {
        return res.status(400).send({ status: "Error", message: "Todos los campos son obligatorios" });
    }
});

// Registrar nuevo administrador
app.post("/crearNuevoAdmin", async (req, res) => {
    const { user, password, passwordRep } = req.body;
    // Validar que los campos no esten vacíos
    if (user && password && passwordRep) {
        // Se intenta hacer la conexion a la base de datos
        try {
            // Conexion a la base de datos
            const conexion = await dataBase.getConnectionUser();

            // Consulta del usuario
            const consultarAdministrador = `
                SELECT *
                FROM USER_PROYECTOINGS.USUARIO
                WHERE NOMBREUSUARIO like :userName
            `;
            const data = await conexion.execute(consultarAdministrador, { userName: user });
            // Validar que el usuario exista
            if (data.rows.length > 0) {
                console.log("El usuario ya existe");
                // Cerrar conexión
                return res.status(400).send({ status: "Error", message: "El administrador ya está registrado" });
            } 
            // Se valida que las contraseñas coincidan
            if (password === passwordRep) {
                // Consulta para agregar el administrador
                let insertarAdministrador = `
                    INSERT INTO USER_PROYECTOINGS.Usuario(nombreUsuario, contraseniaUsuario, ID_Rol)
                    VALUES (:adminNuevo, :passwordNueva, 2)
                `;
                const dataInsercion = await conexion.execute(insertarAdministrador, { adminNuevo: user, passwordNueva: password });
                console.log("Administrador insertado");

                // Creacion del administrador en la base de datos
                let activarScript = `ALTER SESSION SET "_ORACLE_SCRIPT" = true`;
                await conexion.execute(activarScript);
            
                let crearAdministrador = `CREATE USER ${user} IDENTIFIED BY ${password}`;
                const dataCreacion = await conexion.execute(crearAdministrador);
                console.log("Administrador creado");
                await conexion.commit();
                return res.send({ status: "ok"});
            }
            
        } 
        // Si no se ha iniciado sesion, se retorna error
        catch(error) {
            console.log(error.message);
            return res.send({ error: "error", message: "El superadministrador no ha iniciado sesión." });
        }
        
    }
});

app.post("/otorgarRol", async (req, res) => {
    const { user } = req.body;
    // Se intenta hacer la conexion a la base de datos
    try {
        // Conexion a la base de datos
        const conexion = await dataBase.getConnectionUser();
        // Consulta para otorgar el rol de administrador
        let otorgarRol = `GRANT C##ADMINISTRADOR_ROL TO ${user}`;
        const dataRol = await conexion.execute(otorgarRol);
        console.log("Rol otorgado");
        // Consulta para dar permisos de conexion al administrador a la base de datos
        let permisoConexion = `GRANT CONNECT TO ${user}`;
        const dataConexion = await conexion.execute(permisoConexion);
        console.log("Permiso de conexion otorgado");
        await conexion.commit();
        return res.send({ status: "ok", redirect: "IndexSuperAdmin.html#home"});
    }
    // Si no se ha iniciado sesion, se retorna error
    catch(error) {
        console.log(error.message);
        return res.send({ error: "error", message: "El superadministrador no ha iniciado sesión." });
    }
});

app.get("/redireccionarPagina", (req, res) => {
    // Se redirige al index del usuario
    const redirectUrl = dataBase.getRol() === 'Admin' ? "/Pages/IndexAdmin.html#home" : "/Pages/IndexSuperAdmin.html#home";
    return res.send({redirect: redirectUrl});
});

app.get("/generarFactura", async (req, res) => {
    // Se intenta conectar a la base de datos
    try {
        // Conexion a la base de datos
        const conexion = await dataBase.getConnectionUser();
        console.log("Generando factura");
        // Consulta para obtener el codigo de la factura
        let obtenerCodFactura = `
            SELECT ValorActual
            FROM USER_PROYECTOINGS.Secuencia
            WHERE NombreSecuencia like 'seqFactura'
        `;
        const dataCodigo = await conexion.execute(obtenerCodFactura);
        console.log(dataCodigo.rows[0]);
        // Consulta para obtener la factura a partir de su codigo unico
        let infoFactura = `
            SELECT *
            FROM USER_PROYECTOINGS.Factura
            WHERE CodigoFactura = ${dataCodigo.rows[0]}
        `;
        const dataFactura = await conexion.execute(infoFactura);
        console.log(dataFactura.rows[0]);
    
        // Se guarda toda la informacion de la factura en constantes
        const codigo = dataFactura.rows[0][0];
        const placa = dataFactura.rows[0][1];
        const entrada = dataFactura.rows[0][2];
        const salida = dataFactura.rows[0][3];
        const duracion = dataFactura.rows[0][4];
        const nombre = dataFactura.rows[0][5];
        const cedula = dataFactura.rows[0][6];
        const tarifa = dataFactura.rows[0][7];
    
        // Se guarda la informacion de la factura en un array
        const datos = {
            codigo: codigo,
            placa: placa,
            entrada: entrada,
            salida: salida,
            duracion: duracion,
            nombre: nombre,
            cedula: cedula,
            tarifa: tarifa,
        };
    
        console.log(datos);
    
        // Obtén el valor de milisegundos desde el 1 de enero de 1970
        let milisegundos = Date.now();
    
        // Convierte los milisegundos a una fecha normal
        let fecha = new Date(milisegundos);
    
        // Obtén el día, mes, año, hora, minutos y segundos
        let dia = fecha.getDate();
        let mes = fecha.getMonth() + 1;
        let anio = fecha.getFullYear();
        let hora = fecha.getHours();
        let minutos = fecha.getMinutes();
        let segundos = fecha.getSeconds();
    
        // Formatea la hora en formato de 12 horas
        let ampm = hora >= 12 ? 'PM' : 'AM';
        hora = hora % 12; // Convertir a formato de 12 horas
        hora = hora ? hora : 12; // La hora 0 debe ser 12
        minutos = minutos < 10 ? '0' + minutos : minutos; // Asegura que los minutos tengan dos dígitos
        segundos = segundos < 10 ? '0' + segundos : segundos; // Asegura que los segundos tengan dos dígitos
    
        // Formatea el día y el mes para que siempre tengan dos dígitos
        dia = dia < 10 ? '0' + dia : dia;
        mes = mes < 10 ? '0' + mes : mes;
    
        // Construye la fecha con el formato deseado
        let fechaFormateada = `${dia}/${mes}/${anio} ${hora}:${minutos}:${segundos} ${ampm}`;
    
        // Se genera el nombre de la factura con la fecha de generacion formateada
        const nombreFactura = `Factura-${fechaFormateada}.pdf`;
    
        // Se construye el pdf de la factura para descargarse
        const stream = res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment;filename=${nombreFactura}`
        });
        pdfKit.generarPDF(
            (chunck) => stream.write(chunck),
            () => stream.end(),
            datos
        );
    } 
    // Si no se ha iniciado sesion, se retorna error
    catch(error) {
        console.log(error.message);
        return res.send({ error: "error", message: error.message });
    }
});

app.get("/obtenerInfo", async (req, res) => {
    const { zona } = req.query;
    // Se intenta conectar a la base de datos
    try {
        // Conexion a la base de datos
        const conexion = await dataBase.getConnectionUser();
        console.log("Obteniendo info " + zona);
        // Consulta para obtener la informacion de la entrada
        let consulta = `
            SELECT NombreVisitante, CedulaVisitante, PlacaVehiculo
            FROM USER_PROYECTOINGS.EntradaSalida 
            INNER JOIN USER_PROYECTOINGS.Visitante
            ON EntradaSalida.FechaEntrada = Visitante.FechaEntradaVisitante
            WHERE FechaSalida IS NULL AND ID_ZonaParqueoEntrada = :zonaInfo
        `;
        const data = await conexion.execute(consulta, {zonaInfo: zona});
        res.json(data.rows);
    }
    // Si no se ha iniciado sesion, se retorna error
    catch(error) {
        console.log(error.message);
        return res.send({ error: "error", message: error.message });
    }
});

app.get("/obtenerMovimientos", async (req, res) => {
    // Se intenta la conexion a la base de datos
    try {
        // Conexion a la base de datos
        const conexion = await dataBase.getConnectionUser();
        console.log("Obteniendo Movimientos ");
        // Consulta para obtener los movimientos dentro del parqueadero
        let consulta = `
            SELECT EntradaSalida.PlacaVehiculo, Visitante.CedulaVisitante, FechaEntrada, FechaSalida,
            TO_CHAR(FechaEntrada, 'HH12:MI:SS AM'), TO_CHAR(FechaSalida, 'HH12:MI:SS AM'),
            ID_ZonaParqueoEntrada, TarifaCobro
            FROM USER_PROYECTOINGS.EntradaSalida
            LEFT JOIN USER_PROYECTOINGS.Factura
            ON TO_CHAR(EntradaSalida.FechaEntrada, 'DD/MM/YYYY HH12:MI:SS AM') = Factura.Entrada
            INNER JOIN USER_PROYECTOINGS.Visitante
            ON EntradaSalida.FechaEntrada like Visitante.FechaEntradaVisitante
        `;
        console.log(consulta);
        const data = await conexion.execute(consulta);
        console.log(data.rows);
        res.json(data.rows);
    }
    // Si no se ha iniciado sesion, se retorna error
    catch(error) {
        console.log(error.message);
        return res.send({ error: "error", message: error.message });
    }
});

app.get("/obtenerMovimientosPlaca", async (req, res) => {
    const { placa } = req.query;
    // Se intenta la conexion a la base de datos
    try {
        // Conexion a la base de datos
        const conexion = await dataBase.getConnectionUser();
        console.log("Obteniendo Movimientos Placa");
        // Se intenta relizar la consulta
        try {
            // Consulta para obtener los movimientos de una placa
            let consulta = `
                SELECT EntradaSalida.PlacaVehiculo, Visitante.CedulaVisitante, FechaEntrada, FechaSalida,
                TO_CHAR(FechaEntrada, 'HH12:MI:SS AM'), TO_CHAR(FechaSalida, 'HH12:MI:SS AM'),
                ID_ZonaParqueoEntrada, TarifaCobro
                FROM USER_PROYECTOINGS.EntradaSalida
                LEFT JOIN USER_PROYECTOINGS.Factura
                ON TO_CHAR(EntradaSalida.FechaEntrada, 'DD/MM/YYYY HH12:MI:SS AM') = Factura.Entrada
                INNER JOIN USER_PROYECTOINGS.Visitante
                ON EntradaSalida.FechaEntrada = Visitante.FechaEntradaVisitante
                WHERE EntradaSalida.PlacaVehiculo like :placaBusqueda
            `;
            const data = await conexion.execute(consulta, {placaBusqueda: placa});
            res.json(data.rows);
        } catch {
            res.json({status: "error"});
        }
    } 
    // Si no se ha iniciado sesion, se retorna error
    catch(error) {
        console.log(error.message);
        return res.send({ error: "error", message: error.message });
    }
    
});

app.get("/obtenerMovimientosCedula", async (req, res) => {
    const { cedula } = req.query;
    // Se intenta la conexion a la base de datos
    try {
        const conexion = await dataBase.getConnectionUser();
        console.log("Obteniendo Movimientos Cedula");
        // Se intenta realizar la consulta
        try {
            // Consulta para obtener el movimiento de una cedula
            let consulta = `
                SELECT EntradaSalida.PlacaVehiculo, Visitante.CedulaVisitante, FechaEntrada, FechaSalida,
                TO_CHAR(FechaEntrada, 'HH12:MI:SS AM'), TO_CHAR(FechaSalida, 'HH12:MI:SS AM'),
                ID_ZonaParqueoEntrada, TarifaCobro
                FROM USER_PROYECTOINGS.EntradaSalida
                LEFT JOIN USER_PROYECTOINGS.Factura
                ON TO_CHAR(EntradaSalida.FechaEntrada, 'DD/MM/YYYY HH12:MI:SS AM') = Factura.Entrada
                INNER JOIN USER_PROYECTOINGS.Visitante
                ON EntradaSalida.FechaEntrada = Visitante.FechaEntradaVisitante
                WHERE Visitante.CedulaVisitante = :cedulaBusqueda
            `;
            console.log(consulta);
            const data = await conexion.execute(consulta, {cedulaBusqueda: cedula});
            res.json(data.rows);

        } catch {
            res.json({status: "Error"});
        }
    }
    // Si no se ha iniciado sesion, se retorna error
    catch(error) {
        console.log(error.message);
        return res.send({ error: "error", message: error.message });
    }
});

app.get("/obtenerReportes", async (req, res) => {
    // Se intenta la conexion a la base de datos
    try {
        // Conexion a la base de datos
        const conexion = await dataBase.getConnectionUser();
        console.log("Obteniendo Reportes");
        // Se intenta realizar la consulta
        try {
            // Se obtenien todos los reportes registrados
            let consulta = `
                SELECT *
                FROM USER_PROYECTOINGS.Reporte
                ORDER BY ID_Reporte
            `;
            console.log(consulta);
            const data = await conexion.execute(consulta);
            res.json(data.rows);

        } catch(error) {
            console.log(error.message);
            res.json({status: "error"});
        }
    } 
    // Si no se ha iniciado sesion, se retorna error
    catch(error) {
        console.log(error.message);
        return res.send({ error: "error", message: error.message });
    }
});

app.get("/agregarReporte", async (req, res) => {
    const { titulo, descripcion } = req.query;
     // Se intenta la conexion a la base de datos
    try {
        const conexion = await dataBase.getConnectionUser();
        console.log("Agregando Reporte");
        // Se intenta hacer la consulta
        try {
            // Consulta para agregar reporte
            let consulta = `
                BEGIN
                    USER_PROYECTOINGS.crearReporte(:tituloReporte, :descripcionReporte);
                END;
            `;
            const data = await conexion.execute(consulta, {tituloReporte: titulo, descripcionReporte: descripcion});
            console.log(data);
            await conexion.commit();
            res.json({status: "ok"});
        } catch(error) {
            console.log(error.message);
            res.json({status: "error", message: error.message});
        }
    } 
    // Si no se ha iniciado sesion, se retorna error
    catch(error) {
        console.log(error.message);
        return res.send({ error: "error", message: error.message });
    }
});