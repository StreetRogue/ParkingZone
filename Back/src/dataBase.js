const oracledb = require('oracledb');
const dotenv = require('dotenv');
dotenv.config();

class Conexion {
    async iniciarSesion(usuario, contra) {
        const conexion = await oracledb.getConnection({
            user: process.env.USER,
            password: process.env.PASSWORD,
            connectString: process.env.CONNECTSTRING
        });
        
        // Definir la consulta con parámetros
        const consulta = `
            SELECT *
            FROM USUARIO
            WHERE NOMBREUSUARIO = :userName AND CONTRASENIAUSUARIO = :passwordUser
        `;

        // Ejecutar la consulta de forma segura usando parámetros
        const data = await conexion.execute(consulta, { userName: usuario, passwordUser: contra });
        // Validar que el usuario exista
        if (data.rows.length === 0) {
            console.log("El usuario no existe");
            // Cerrar conexión
            await conexion.close();
            return { success: false, message: "Usuario y/o contraseña incorrecto(s)" };
        }
        // Consultar que usuario inicio sesion
        const usuarioInfo = `
            SELECT *
            FROM USUARIO INNER JOIN ROL
            ON USUARIO.ID_ROL = ROL.ID_ROL
            WHERE NOMBREUSUARIO = :userName AND CONTRASENIAUSUARIO = :passwordUser
        `; 
        const dataRol = await conexion.execute(usuarioInfo, { userName: usuario, passwordUser: contra });
        
        // Cerrar conexión
        await conexion.close();
        this.user = usuario;
        this.password = contra;
        this.rol = dataRol.rows[0][4];
        const redirectUrl = this.rol === 'Admin' ? "/Pages/Index.html#home" : "/Pages/IndexSuper.html#home";
        // Redireccionar a la pagina de usuario correspondiente
        return { success: true, redirect: redirectUrl };
    }
    
    async getConnectionUsuario() {
        this.conexionUsuario = await oracledb.getConnection({
            user: this.user,
            password: this.password,
            connectString: process.env.CONNECTSTRING
        });
        
        console.log("Conexion correcta");
        return this.conexionUsuario;
    }

    getRol() {
        return this.rol;
    }
}

const dataBase = new Conexion();

module.exports = {
    dataBase
}