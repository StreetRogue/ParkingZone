DROP TABLE USUARIO CASCADE CONSTRAINTS;
DROP TABLE VISITANTE CASCADE CONSTRAINTS;
DROP TABLE ENTRADASALIDA CASCADE CONSTRAINTS;
DROP TABLE FACTURA CASCADE CONSTRAINTS;
DROP TABLE REPORTE CASCADE CONSTRAINTS;
DROP TABLE VEHICULO CASCADE CONSTRAINTS;
DROP TABLE ZONAPARQUEO CASCADE CONSTRAINTS;
DROP TABLE ROL CASCADE CONSTRAINTS;

CREATE TABLE Rol (
    ID_Rol INTEGER NOT NULL,
    NombreRol VARCHAR(50) NOT NULL,
    CONSTRAINT pk_Rol PRIMARY KEY (ID_Rol)
);

CREATE TABLE Usuario (
    NombreUsuario VARCHAR(50) NOT NULL,
    ContraseniaUsuario VARCHAR(50) NOT NULL,
    ID_Rol INT NOT NULL,
    CONSTRAINT pk_Usuario PRIMARY KEY (NombreUsuario),
    CONSTRAINT fk_RolUsuario FOREIGN KEY (ID_Rol) REFERENCES Rol(ID_Rol)
);

CREATE TABLE Visitante (
    CedulaVisitante VARCHAR2(10) NOT NULL,
    FechaEntradaVisitante TIMESTAMP NOT NULL,
    NombreVisitante VARCHAR(50) NOT NULL,
    CONSTRAINT pk_Visitante PRIMARY KEY (CedulaVisitante, FechaEntradaVisitante)
);

CREATE TABLE Vehiculo (
    PlacaVehiculo VARCHAR(6) NOT NULL,
    CedulaVisitante VARCHAR2(10) NOT NULL,
    FechaEntradaVehiculo TIMESTAMP NOT NULL,
    CONSTRAINT pk_Vehiculo PRIMARY KEY (PlacaVehiculo, FechaEntradaVehiculo),
    CONSTRAINT fk_VisitanteVehiculo FOREIGN KEY (CedulaVisitante, FechaEntradaVehiculo) REFERENCES Visitante(CedulaVisitante, FechaEntradaVisitante)
);

CREATE TABLE ZonaParqueo (
    ID_ZonaParqueo VARCHAR2(2) NOT NULL,
    EstadoZona VARCHAR(10) DEFAULT 'Disponible' NOT NULL,
    CONSTRAINT pk_ZonaParqueo PRIMARY KEY (ID_ZonaParqueo),
    CONSTRAINT ck_EstadoZona CHECK (EstadoZona IN ('Disponible', 'Ocupado'))
);


CREATE TABLE EntradaSalida (
    FechaEntrada TIMESTAMP NOT NULL,
    FechaSalida TIMESTAMP,
    PlacaVehiculo VARCHAR(6) NOT NULL,
    ID_ZonaParqueoEntrada VARCHAR2(2) NOT NULL,
    CONSTRAINT pk_EntradaSalida PRIMARY KEY (FechaEntrada, PlacaVehiculo),
    CONSTRAINT fk_VehiculoEntradaSalida FOREIGN KEY (PlacaVehiculo, FechaEntrada) REFERENCES Vehiculo(PlacaVehiculo, fechaEntradaVehiculo), 
    CONSTRAINT fk_ZonaParqueoEntradaSalida FOREIGN KEY (ID_ZonaParqueoEntrada) REFERENCES ZonaParqueo(ID_ZonaParqueo)  
);

CREATE TABLE Reporte (
    ID_Reporte INTEGER NOT NULL,
    TituloReporte VARCHAR2(100) NOT NULL,
    DescripcionReporte VARCHAR2(300) NOT NULL,
    NombreUsuarioReporte VARCHAR(50) NOT NULL,
    CONSTRAINT pk_Reporte PRIMARY KEY (ID_Reporte),
    CONSTRAINT fk_UsuarioReporte FOREIGN KEY (NombreUsuarioReporte) REFERENCES Usuario(NombreUsuario)
);

CREATE TABLE Factura (
    CodigoFactura VARCHAR(50) NOT NULL,
    TiempoEstancia NUMBER(5, 2) NOT NULL,
    TarifaCobro NUMBER(10, 2) NOT NULL,
    FechaEntrada TIMESTAMP NOT NULL,
    PlacaVehiculo VARCHAR2(6) NOT NULL,
    CONSTRAINT pk_Factura PRIMARY KEY (CodigoFactura),
    CONSTRAINT fk_EntradaSalidaFactura FOREIGN KEY (FechaEntrada, PlacaVehiculo) REFERENCES EntradaSalida(FechaEntrada, PlacaVehiculo)
);


-- CREACIÓN DE ROLES
INSERT INTO Rol (Id_Rol, nombreRol)
VALUES (1, 'SuperAdmin');

INSERT INTO Rol (Id_Rol, nombreRol)
VALUES (2, 'Admin');

CONNECT system/oracle;

CREATE ROLE C##SUPERADMINISTRADOR_ROL;
CREATE ROLE C##ADMINISTRADOR_ROL;

-- Privilegios para el rol de SUPERADMINISTRADOR
GRANT SELECT, INSERT, UPDATE, DELETE ON Rol TO C##SUPERADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE, DELETE ON Usuario TO C##SUPERADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE, DELETE ON Visitante TO C##SUPERADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE, DELETE ON Vehiculo TO C##SUPERADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE, DELETE ON Reporte TO C##SUPERADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE, DELETE ON ZonaParqueo TO C##SUPERADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE, DELETE ON EntradaSalida TO C##SUPERADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE, DELETE ON Factura TO C##SUPERADMINISTRADOR_ROL;

-- Privilegios para el rol de ADMINISTRADOR
GRANT SELECT, INSERT ON Visitante TO C##ADMINISTRADOR_ROL;
GRANT SELECT, INSERT ON Vehiculo TO C##ADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE ON EntradaSalida TO C##ADMINISTRADOR_ROL;
GRANT SELECT, INSERT ON Factura TO C##ADMINISTRADOR_ROL;
GRANT SELECT, INSERT ON Reporte TO C##ADMINISTRADOR_ROL;

-- CREACIÓN DE USUARIOS

CONNECT system/oracle; 

-- Habilitar Oracle Script
ALTER SESSION SET "_ORACLE_SCRIPT" = true;

-- Creación de usuarios
CREATE USER superadmin_usuario IDENTIFIED BY superadmin123;
CREATE USER admin_usuario IDENTIFIED BY admin123;

CONNECT system/oracle; 
-- Asignar roles a los usuarios
GRANT C##SUPERADMINISTRADOR_ROL TO superadmin_usuario;
GRANT C##ADMINISTRADOR_ROL TO admin_usuario;

CONNECT system/oracle; 
-- Otorgar privilegios de conexión
GRANT CONNECT TO superadmin_usuario;
GRANT CONNECT TO admin_usuario;

-- PRUEBAS
CONNECT superadmin_usuario/superadmin123;

INSERT INTO USER_PROYECTOINGS.Usuario(nombreUsuario, contraseniaUsuario, ID_Rol)
VALUES ('adminPrueba', 'contrasenia123', 1);


CONNECT admin_usuario/admin123;

INSERT INTO USER_PROYECTOINGS.Usuario (ID_Usuario, nombreUsuario, contrasenia, ID_Rol)
VALUES ('adminPrueba2', 'contrasenia123', 2);

-- TRIGGERS
CREATE OR REPLACE TRIGGER verificarZonaDisponible
BEFORE INSERT ON EntradaSalida
FOR EACH ROW
DECLARE
    v_cont INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_cont
    FROM EntradaSalida
    WHERE (ID_ZonaParqueoEntrada like :NEW.ID_ZonaParqueoEntrada) AND (FechaSalida IS NULL);
    IF v_cont > 0 THEN
        RAISE_APPLICATION_ERROR(-20000, 'Error: La zona de parqueo ya está ocupada.');
    END IF;
END;

CREATE OR REPLACE TRIGGER actualizarEstadoZona
AFTER INSERT OR UPDATE ON EntradaSalida
FOR EACH ROW
BEGIN
    IF INSERTING THEN 
        UPDATE ZonaParqueo SET EstadoZona = 'Ocupado' WHERE ID_ZonaParqueo = :NEW.ID_ZonaParqueoEntrada;
    ELSIF UPDATING THEN 
        IF :OLD.FechaSalida IS NULL AND :NEW.FechaSalida > :OLD.FechaEntrada THEN 
            UPDATE ZonaParqueo SET EstadoZona = 'Disponible' WHERE ID_ZonaParqueo = :OLD.ID_ZonaParqueoEntrada;
        ELSIF :OLD.FechaSalida IS NOT NULL THEN
            RAISE_APPLICATION_ERROR(-20001, 'Error: Ya se ha registrado una fecha de salida.');
        ELSE
            RAISE_APPLICATION_ERROR(-20002, 'Error: La fecha de salida debe ser mayor a la fecha de entrada.');
        END IF;
    END IF;
END;


-- INSERCIONES
INSERT INTO Usuario (nombreUsuario, contraseniaUsuario, ID_Rol)
VALUES ('admin1', '123456', 2);

INSERT INTO Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) VALUES ('1059236559', CURRENT_TIMESTAMP, 'Juan Perez');
INSERT INTO Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante)) VALUES ('1012345678', CURRENT_TIMESTAMP, 'Maria Gomez');
INSERT INTO Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) VALUES ('1023456789', CURRENT_TIMESTAMP, 'Pedro Ramirez');
INSERT INTO Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) VALUES ('1034567890', CURRENT_TIMESTAMP, 'Lucia Martinez');
INSERT INTO Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) VALUES ('1045678901', CURRENT_TIMESTAMP, 'Carlos Sanchez');
INSERT INTO Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) VALUES ('1056789012', CURRENT_TIMESTAMP, 'Ana Torres');
INSERT INTO Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) VALUES ('1056789011', CURRENT_TIMESTAMP, 'Penesito');
INSERT INTO Visitante (cedulaVisitante, fechaEntradaVisitante, nombreVisitante) VALUES ('1056789013', CURRENT_TIMESTAMP, 'Qkita');

delete from visitante

INSERT INTO Vehiculo (placaVehiculo, cedulaVisitante, fechaEntradaVehiculo) VALUES (
    'ABC001',
    '1059236559',
    (SELECT fechaEntrada
     FROM Visitante
     WHERE cedula = '1059236559')
);
INSERT INTO Vehiculo (placa, cedula, fechaEntrada) VALUES (
    'ABC002',
    '1012345678',
    (SELECT fechaEntrada
     FROM Visitante
     WHERE cedula = '1012345678')
);
INSERT INTO Vehiculo (placa, cedula, fechaEntrada) VALUES (
    'ABC003',
    '1023456789',
    (SELECT fechaEntrada
     FROM Visitante
     WHERE cedula = '1023456789')
);
INSERT INTO Vehiculo (placa, cedula, fechaEntrada) VALUES (
    'ABC004',
    '1034567890',
    (SELECT fechaEntrada
     FROM Visitante
     WHERE cedula = '1034567890')
);
INSERT INTO Vehiculo (placa, cedula, fechaEntrada) VALUES (
    'ABC005',
    '1045678901',
    (SELECT fechaEntrada
     FROM Visitante
     WHERE cedula = '1045678901')
);
INSERT INTO Vehiculo (placa, cedula, fechaEntrada) VALUES (
    'ABC006',
    '1056789012',
    (SELECT fechaEntrada
     FROM Visitante
     WHERE cedula = '1056789012')
);
INSERT INTO Vehiculo (placa, cedula, fechaEntrada) VALUES (
    'ABC007',
    '1056789011',
    (SELECT fechaEntrada 
     FROM Visitante
     WHERE cedula = '1056789011')
);
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES (
    'QKR69H',
    '1056789013',
    (SELECT fechaEntradaVisitante
     FROM Visitante
     WHERE cedulaVisitante = '1056789013'
     ORDER BY fechaEntradaVisitante DESC
     FETCH FIRST 1 ROWS ONLY)
);

DELETE from vehiculo

INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('A1');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('A2');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('A3');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('A4');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('A5');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('A6');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('A7');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('B1');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('B2');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('B3');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('B4');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('B5');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('B6');
INSERT INTO ZonaParqueo (ID_ZonaParqueo) VALUES ('B7');

delete from zonaParqueo
UPDATE ZonaParqueo SET EstadoZona = 'Disponible';

INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (1, TO_TIMESTAMP('16-10-2024 08:00:00', 'DD-MM-YY HH24:MI:SS'), 'ABC123', 'A1');
INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (2, TO_TIMESTAMP('16-10-2024 08:30:00', 'DD-MM-YY HH24:MI:SS'), 'DEF456', 'A6');
INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (3, TO_TIMESTAMP('16-10-2024 13:00:00', 'DD-MM-YY HH24:MI:SS'), 'GHI789', 'B3');
INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (4, TO_TIMESTAMP('16-10-2024 13:15:00', 'DD-MM-YY HH24:MI:SS'), 'JKL012', 'A2');
INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (5, TO_TIMESTAMP('16-10-2024 15:45:00', 'DD-MM-YY HH24:MI:SS'), 'MNO345', 'B4');
INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (6, TO_TIMESTAMP('16-10-2024 10:00:00', 'DD-MM-YY HH24:MI:SS'), 'PQR678', 'B1');

INSERT INTO EntradaSalida (FechaEntrada, placaVehiculo, ID_ZonaParqueoEntrada)
VALUES ( 
     (SELECT fechaEntradaVehiculo
     FROM Vehiculo
     WHERE placaVehiculo = 'QKR69H'
     ORDER BY fechaEntradaVehiculo DESC
     FETCH FIRST 1 ROWS ONLY),
     'QKR69H', 
     'B1');

SELECT *
FROM entradaSalida
WHERE placaVehiculo = 'ABC123' and FECHASALIDA IS NULL;

SELECT *
FROM entradaSalida INNER JOIN Visitante
on entradaSalida.FECHAENTRADA = Visitante.FECHAENTRADAVISITANTE
WHERE cedulaVisitante = '1059236559' and FECHASALIDA IS NULL;

SELECT *
FROM entradaSalida INNER JOIN Vehiculo
on entradaSalida.FECHAENTRADA = vehiculo.FECHAENTRADAVEHICULO
INNER JOIN Visitante
ON entradaSalida.FECHAENTRADA = Visitante.FECHAENTRADAVISITANTE;
WHERE 

SELECT *
FROM entradaSalida
INNER JOIN Vehiculo
    ON entradaSalida.FECHAENTRADA = vehiculo.FECHAENTRADAVEHICULO
INNER JOIN Visitante
    ON vehiculo.CEDULAVISITANTE = visitante.CEDULAVISITANTE
WHERE vehiculo.placavehiculo = 'ABC123' and visitante.cedulavisitante = '1094981170' and fechaSalida IS NULL

SELECT fechaEntradaVehiculo
FROM Vehiculo
WHERE placaVehiculo = 'QKR69H'

select * from visitante

delete from visitante where NOMBREVISITANTE = 'Chaveztia'

DELETE FROM EntradaSalida WHERE fechaEntrada = '21/10/24 05:48:41,056000000 PM';

UPDATE EntradaSalida SET FechaSalida = CURRENT_TIMESTAMP WHERE ID_EntradaSalida = 10;
UPDATE EntradaSalida SET FechaSalida = '16-10-2024 10:00:00' WHERE ID_EntradaSalida = 1;

delete from entradaSalida;
delete from visitante;
delete from vehiculo;

COMMIT;