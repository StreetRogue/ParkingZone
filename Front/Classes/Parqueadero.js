import { Usuario } from "./Usuario.js";

class Parqueadero {
    usuarioActivo(user, password) {
        this.usuario = new Usuario(user,password);
    }

    agregarZonasParqueo(zonasParqueadero) {
        this.zonasParqueadero = zonasParqueadero;
    }

    obtenerUsuarioActivo() {
        return this.usuario;
    }
}

export const parqueaderoExito = new Parqueadero();