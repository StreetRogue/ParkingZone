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
    origin: ["http://127.0.0.1:5500", "http://127.0.0.1:5501", "http://127.0.0.1:5502"]
}));

app.use(express.json());

// Rutas
app.post("/iniciarSesion", async (req, res) => {
    // Validar que los campos no esten vacios
    if (req.body.user && req.body.password) {
        // Conexion a Base de Datos
        const conexion = await dataBase.getConnection();
        let consulta = `SELECT *
            FROM ADMINISTRADORES
            WHERE NOMBRE = '` + req.body.user + `' AND CEDULA = ` + req.body.password;
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
            return res.send({status:"ok", message:"Inicio de sesion correcto", redirect:"/Pages/Index.html"});
        }
    } else {
        return res.status(400).send({status:"Error"});
    }

    //console.log(consulta);
});