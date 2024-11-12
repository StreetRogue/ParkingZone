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
    // Validar que los campos no estén vacíos
    if (req.body.user && req.body.password) {
        // Conexión a la base de datos
        
        const data = await dataBase.iniciarSesion(req.body.user, req.body.password);
        console.log("Conexion a base de datos correcta");
        if (!data.success) {
            return res.status(400).send({ status: "Error", message: data.message });
        }
        console.log("Inicio de sesión correcto");
        return res.send({ status: "ok", message: "Inicio de sesión correcto", redirect: data.redirect });
    }
});

// Registro Entradas
app.post("/validarEntrada", async (req, res) => {
    const { cedula, nombre, placa } = req.body;
    if (cedula && nombre && placa) {
        // Conexion a Base de Datos
        const conexion = await dataBase.getConnectionUsuario();

        // Comsulta de verificacion de placa con zona de parqueo ocupada
        let consultaVehiculo = `
            SELECT *
            FROM USER_PROYECTOINGS.EntradaSalida
            INNER JOIN USER_PROYECTOINGS.Vehiculo
            ON EntradaSalida.FechaEntrada = Vehiculo.FechaEntradaVehiculo
            WHERE Vehiculo.PlacaVehiculo = :placa
            AND EntradaSalida.FechaSalida IS NULL
        `;

        const dataVehiculo = await conexion.execute(consultaVehiculo, {placa: placa});

        // Si el vehículo está en una zona de parqueo ocupada, se retorna error
        if (dataVehiculo.rows.length > 0) {
            console.log("El vehículo ya está registrado");
            return res.status(400).send({ status: "Error", message: "Vehículo ya se encuentra en el parqueadero" });
        }

        // Consulta de verificacion de cedula con zona de parqueo ocupada
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

        // Si el visitante está en una zona de parqueo ocupada, se retorna error
        if (dataVisitante.rows.length > 0) {
            console.log("El visitante ya está registrado");
            return res.status(400).send({ status: "Error", message: "El visitante ya se encuentra en el parqueadero" });
        }

        // Validación exitosa
        console.log("Validación exitosa, redirigiendo a selección de zona de parqueo");
        return res.send({ status: "ok", message: "Validación exitosa", redirect: "/Pages/seleccionEspacio.html" });
    } else {
        return res.status(400).send({ status: "Error", message: "Todos los campos son obligatorios" });
    }
});

// Obtener las zonas registradas en la base de datos
app.get("/obtenerZonas", async (req, res) => {
    const conexion = await dataBase.getConnectionUsuario();
    if (conexion) {
        let consulta = `SELECT * FROM USER_PROYECTOINGS.ZonaParqueo`;
        const data = await conexion.execute(consulta);
        res.json(data.rows);
    }
});

// Agregar nuevo visitante
app.post("/registrarVisitante", async (req, res) => {
    const { cedula, nombre } = req.body;
    if (cedula && nombre) {
        const conexion = await dataBase.getConnectionUsuario();
        let agregarVisitante = `
            INSERT INTO USER_PROYECTOINGS.Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) 
            VALUES (:cedula, CURRENT_TIMESTAMP, :nombre)
        `;
        const data = await conexion.execute(agregarVisitante, {cedula: cedula, nombre:nombre});
        await conexion.commit();
        console.log("Visitante registrado correctamente");
        return res.send({status: "ok"});
    }
    console.log("Error al registrar el visitante");
    return res.status(400).send({ status: "Error"});
});

// Agregar nuevo vehiculo
app.post("/registrarVehiculo", async (req, res) => {
    const { placa, cedula } = req.body;
    if (placa && cedula) {
        const conexion = await dataBase.getConnectionUsuario();
        let agregarVehiculo = `
            INSERT INTO USER_PROYECTOINGS.Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) 
            VALUES (:placa, :cedula, (
                SELECT fechaEntradaVisitante 
                FROM USER_PROYECTOINGS.Visitante 
                WHERE cedulaVisitante = :cedula 
                ORDER BY fechaEntradaVisitante DESC FETCH FIRST 1 ROWS ONLY))
        `;      
        const data = await conexion.execute(agregarVehiculo, {placa: placa, cedula: cedula});
        await conexion.commit();
        console.log("Vehiculo registrado correctamente");
        return res.send({status: "ok"});
    }
    console.log("Error al registrar el vehiculo");
    return res.status(400).send({status: "Error"});
});

// Registrar la entrada
app.post("/registrarEntrada", async (req, res) => {
    const { placa, zona, estadoZona } = req.body;
    console.log(placa);
    console.log(zona);
    console.log(estadoZona);
    if (placa && zona && estadoZona == 'Disponible') {
        const conexion = await dataBase.getConnectionUsuario();
        let agregarEntrada = `
            INSERT INTO USER_PROYECTOINGS.EntradaSalida (FechaEntrada, placaVehiculo, ID_ZonaParqueoEntrada)
            VALUES ((
                SELECT fechaEntradaVehiculo 
                FROM USER_PROYECTOINGS.Vehiculo 
                WHERE placaVehiculo = :placa 
                ORDER BY fechaEntradaVehiculo DESC FETCH FIRST 1 ROWS ONLY), :placa, :zona)
        `;
        const data = await conexion.execute(agregarEntrada, {placa: placa, zona: zona});
        await conexion.commit();
        console.log("Entrada registrada correctamente");
        const redirectUrl = dataBase.getRol() === 'Admin' ? "/Pages/Index.html#home" : "/Pages/IndexSuper.html#home";
        return res.send({status: "ok", redirect: redirectUrl});
    }
    console.log("Error al registrar la entrada");
    return res.status(400).send({status: "Error"});
});

// Registrar Salidas
app.post("/validarSalida", async (req, res) => {
    const { cedula, placa } = req.body;
    if (cedula && placa) {
        // Conexión a Base de Datos
        const conexion = await dataBase.getConnectionUsuario();
        console.log("Registro de Salida");

        // Consulta para verificar si el vehículo
        let buscarAuto = `
            SELECT * 
            FROM USER_PROYECTOINGS.entradaSalida 
            WHERE placaVehiculo = :placa and FECHASALIDA IS NULL
        `;
        const dataAuto = await conexion.execute(buscarAuto, {placa: placa});
        if (dataAuto.rows.length == 0) {
            console.log("No se encuentra un registro de entrada para el vehiculo");
            return res.status(400).send({ status: "Error", message: "No se encontró un registro de entrada para el vehiculo" });
        } else {
            // Consulta si el visitante se encuentra en el parqueadero
            let buscarVisitante = `
                SELECT * 
                FROM USER_PROYECTOINGS.entradaSalida 
                INNER JOIN USER_PROYECTOINGS.Visitante 
                on entradaSalida.FECHAENTRADA = Visitante.FECHAENTRADAVISITANTE 
                WHERE cedulaVisitante = :cedula and FECHASALIDA IS NULL
            `;
            const dataVisitante = await conexion.execute(buscarVisitante, {cedula: cedula});
            if (dataVisitante.rows.length == 0) {
                console.log("No se encuentra un registro de entrada para la persona");
                return res.status(400).send({ status: "Error", message: "No se encontró un registro de entrada para la persona" });
            }
        }
        
        // Verifica la coincidencia de los datos
        let coincidenciaInfo = `
            SELECT * 
            FROM USER_PROYECTOINGS.entradaSalida 
            INNER JOIN USER_PROYECTOINGS.Vehiculo 
            ON entradaSalida.FECHAENTRADA = vehiculo.FECHAENTRADAVEHICULO 
            INNER JOIN USER_PROYECTOINGS.Visitante 
            ON USER_PROYECTOINGS.vehiculo.CEDULAVISITANTE = USER_PROYECTOINGS.visitante.CEDULAVISITANTE 
            WHERE vehiculo.placavehiculo = :placa and visitante.cedulavisitante = :cedula and fechaSalida IS NULL
        `;
        const dataCoincidencia = await conexion.execute(coincidenciaInfo, {placa: placa, cedula: cedula});
        if (dataCoincidencia.rows.length == 0) {
            console.log("La cedula y placa no coinciden con la informacion de registro");
            return res.status(400).send({ status: "Error", message: "La información no coincide con el registro o ya se registro la salida" });
        } else {
            // Actualizar fecha del sistema
            let actualizarSalida = `
                UPDATE USER_PROYECTOINGS.EntradaSalida es
                SET es.FechaSalida = CURRENT_TIMESTAMP
                WHERE es.placaVehiculo = :placa
                AND es.FECHAENTRADA = (
                    SELECT e.FECHAENTRADA
                    FROM USER_PROYECTOINGS.EntradaSalida e 
                    INNER JOIN USER_PROYECTOINGS.Vehiculo v 
                    ON e.placaVehiculo = v.placaVehiculo 
                    INNER JOIN USER_PROYECTOINGS.Visitante vi 
                    ON v.cedulaVisitante = vi.cedulaVisitante
                    WHERE vi.cedulaVisitante = :cedula AND v.placaVehiculo = :placa
                    ORDER BY e.FECHAENTRADA DESC
                    FETCH FIRST 1 ROWS ONLY
                )`;
            await conexion.execute(actualizarSalida, {placa: placa, cedula: cedula});
            console.log("Fecha Salida Actualizada");
            // Actualizar el estado de la zona de parqueo a 'Disponible'
            let actualizarZona = `
                UPDATE USER_PROYECTOINGS.ZonaParqueo
                SET EstadoZona = 'Disponible'
                WHERE ID_ZonaParqueo = (
                    SELECT es.ID_ZONAPARQUEOENTRADA
                    FROM USER_PROYECTOINGS.EntradaSalida es 
                    INNER JOIN USER_PROYECTOINGS.Vehiculo v 
                    ON es.placaVehiculo = v.placaVehiculo 
                    INNER JOIN USER_PROYECTOINGS.Visitante vi 
                    ON v.cedulaVisitante = vi.cedulaVisitante
                    WHERE vi.cedulaVisitante = :cedula AND v.placaVehiculo = :placa
                    FETCH FIRST 1 ROWS ONLY
                )`;
            await conexion.execute(actualizarZona, {cedula: cedula, placa: placa});
            await conexion.commit();
            console.log("Zona actualizada");
            console.log("Salida registrada exitosamente");
            const redirectUrl = dataBase.getRol() === 'Admin' ? "/Pages/Index.html#home" : "/Pages/IndexSuper.html#home";
            return res.send({status: "ok", redirect: redirectUrl});
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
        // Conexion a la base de datos
        const conexion = await dataBase.getConnectionUsuario();

        // Definir la consulta con parámetros
        const consultarAdministrador = `
            SELECT *
            FROM USER_PROYECTOINGS.USUARIO
            WHERE NOMBREUSUARIO = :userName
        `;
        // Ejecutar la consulta de forma segura usando parámetros
        const data = await conexion.execute(consultarAdministrador, { userName: user });
        // Validar que el usuario exista
        if (data.rows.length > 0) {
            console.log("El usuario ya existe");
            // Cerrar conexión
            return res.status(400).send({ status: "Error", message: "Usuario ingresado ya está registrado" });
        } else {
            // Consultar que usuario inicio sesion
            if (password == passwordRep) {
                let insertarAdministrador = `
                INSERT INTO USER_PROYECTOINGS.Usuario(nombreUsuario, contraseniaUsuario, ID_Rol)
                VALUES (:adminNuevo, :passwordNueva, 2)`;
                const dataInsercion = await conexion.execute(insertarAdministrador, { adminNuevo: user, passwordNueva: password });
                console.log("Administrador insertado");

                let activarScript = `ALTER SESSION SET "_ORACLE_SCRIPT" = true`;
                await conexion.execute(activarScript);
            
                let crearAdministrador = `CREATE USER ${user} IDENTIFIED BY ${password}`;
                const dataCreacion = await conexion.execute(crearAdministrador);
                console.log("Administrador creado");
                await conexion.commit();
                return res.send({ status: "ok"});
            }
        }
    }
});

app.post("/otorgarRol", async (req, res) => {
    const { user } = req.body;
    const conexion = await dataBase.getConnectionUsuario();
    let otorgarRol = `GRANT C##ADMINISTRADOR_ROL TO ${user}`;
    const dataRol = await conexion.execute(otorgarRol);
    console.log("Rol otorgado");
    let permisoConexion = `GRANT CONNECT TO ${user}`;
    const dataConexion = await conexion.execute(permisoConexion);
    console.log("Permiso de conexion otorgado");
    await conexion.commit();
    return res.send({ status: "ok", redirect: "IndexSuper.html#home"});
});

app.get("/redireccionarPagina", (req, res) => {
    const redirectUrl = dataBase.getRol() === 'Admin' ? "/Pages/Index.html#home" : "/Pages/IndexSuper.html#home";
    return res.send({redirect: redirectUrl});
});

app.get("/generarFactura", async (req, res) => {
    const conexion = await dataBase.getConnectionUsuario();
    let obtenerCodFactura = `
        SELECT ValorActual
        FROM USER_PROYECTOINGS.Secuencia
        WHERE NombreSecuencia like 'seqFactura'
    `;
    const dataCodigo = await conexion.execute(obtenerCodFactura);
    console.log(dataCodigo.rows[0]);
    let infoFactura = `
        SELECT *
        FROM USER_PROYECTOINGS.Factura
        WHERE CodigoFactura = ${dataCodigo.rows[0]}
    `;
    const dataFactura = await conexion.execute(infoFactura);
    console.log(dataFactura.rows[0]);

    const codigo = dataFactura.rows[0][0];
    const placa = dataFactura.rows[0][1];
    const entrada = dataFactura.rows[0][2];
    const salida = dataFactura.rows[0][3];
    const duracion = dataFactura.rows[0][4];
    const nombre = dataFactura.rows[0][5];
    const cedula = dataFactura.rows[0][6];
    const tarifa = dataFactura.rows[0][7];

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
    let mes = fecha.getMonth() + 1; // Los meses van de 0 a 11
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

    const nombreFactura = `Factura-${fechaFormateada}.pdf`;

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment;filename=${nombreFactura}`
    });
    pdfKit.generarPDF(
        (chunck) => stream.write(chunck),
        () => stream.end(),
        datos
    );
});