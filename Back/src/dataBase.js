const oracledb = require('oracledb');
const dotenv = require('dotenv');
dotenv.config();

async function getConnection() {
    const conexion = await oracledb.getConnection({
        user: process.env.USER,
        password: process.env.PASSWORD,
        connectString: process.env.CONNECTSTRING
    });
    console.log("Conexion a base de datos correcta");
    return conexion;
}

module.exports = {
    getConnection
}