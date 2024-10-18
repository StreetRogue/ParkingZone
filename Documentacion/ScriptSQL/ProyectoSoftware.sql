DROP TABLE USUARIO CASCADE CONSTRAINTS;
DROP TABLE ADMINISTRADOR CASCADE CONSTRAINTS;
DROP TABLE VISITANTE CASCADE CONSTRAINTS;
DROP TABLE ENTRADASALIDA CASCADE CONSTRAINTS;
DROP TABLE FACTURA CASCADE CONSTRAINTS;
DROP TABLE REPORTE CASCADE CONSTRAINTS;
DROP TABLE VEHICULO CASCADE CONSTRAINTS;
DROP TABLE ZONAPARQUEO CASCADE CONSTRAINTS;
DROP TABLE ROL CASCADE CONSTRAINTS;

CREATE TABLE Rol (
    Id_Rol INT PRIMARY KEY,
    nombreRol VARCHAR(50) NOT NULL
);

CREATE TABLE Usuario (
    ID_Usuario INT PRIMARY KEY,
    nombreUsuario VARCHAR(50) NOT NULL,
    contrasenia VARCHAR(50) NOT NULL,
    ID_Rol INT NOT NULL,
    FOREIGN KEY (ID_Rol) REFERENCES Rol(ID_Rol)
);

CREATE TABLE Visitante (
    cedula VARCHAR2(10) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Vehiculo (
    placa VARCHAR(10) PRIMARY KEY,
    cedula VARCHAR2(10) NOT NULL,
    FOREIGN KEY (cedula) REFERENCES Visitante(cedula)
);

CREATE TABLE Reporte (
    ID_Reporte INT PRIMARY KEY,
    Titulo VARCHAR2(100) NOT NULL,
    Descripcion VARCHAR2(300) NOT NULL,
    ID_Usuario INT NOT NULL,
    FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario)
);

CREATE TABLE ZonaParqueo (
    ID_ZonaParqueo VARCHAR2(2) PRIMARY KEY,
    Estado VARCHAR(10) DEFAULT 'Disponible' CHECK (Estado IN ('Disponible', 'Ocupado'))
);

CREATE TABLE EntradaSalida (
    ID_EntradaSalida INT PRIMARY KEY,
    FechaEntrada TIMESTAMP NOT NULL,
    FechaSalida TIMESTAMP,
    placa VARCHAR(10) NOT NULL,
    ID_ZonaParqueo VARCHAR2(2) NOT NULL,
    FOREIGN KEY (placa) REFERENCES Vehiculo(placa),
    FOREIGN KEY (ID_ZonaParqueo) REFERENCES ZonaParqueo(ID_ZonaParqueo)
);

CREATE TABLE Factura (
    ID_Factura INT PRIMARY KEY,
    CodigoFactura VARCHAR(50) NOT NULL UNIQUE,
    TiempoEstancia DECIMAL(5, 2) NOT NULL,
    TarifaCobro DECIMAL(10, 2) NOT NULL,
    ID_EntradaSalida INT NOT NULL UNIQUE,
    FOREIGN KEY (ID_EntradaSalida) REFERENCES EntradaSalida(ID_EntradaSalida)
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

INSERT INTO USER_PROYECTOINGS.Usuario(ID_Usuario, nombreUsuario, contrasenia, ID_Rol)
VALUES (1, 'adminPrueba', 'contraseña123', 1);


CONNECT admin_usuario/admin123;

INSERT INTO USER_PROYECTOINGS.Usuario (ID_Usuario, nombreUsuario, contrasenia, ID_Rol)
VALUES (2, 'adminPrueba2', 'contraseña123', 2);

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
    WHERE (ID_ZonaParqueo like :NEW.ID_ZonaParqueo) AND (FechaSalida IS NULL);
    IF v_cont > 0 THEN
        RAISE_APPLICATION_ERROR(-20000, 'Error: La zona de parqueo ya está ocupada.');
    END IF;
END;

CREATE OR REPLACE TRIGGER actualizarEstadoZona
AFTER INSERT OR UPDATE ON EntradaSalida
FOR EACH ROW
BEGIN
    IF INSERTING THEN 
        UPDATE ZonaParqueo SET Estado = 'Ocupado' WHERE ID_ZonaParqueo = :NEW.ID_ZonaParqueo;
    ELSIF UPDATING THEN 
        IF :OLD.FechaSalida IS NULL AND :NEW.FechaSalida > :OLD.FechaEntrada THEN 
            UPDATE ZonaParqueo SET Estado = 'Disponible' WHERE ID_ZonaParqueo = :OLD.ID_ZonaParqueo;
        ELSIF :OLD.FechaSalida IS NOT NULL THEN
            RAISE_APPLICATION_ERROR(-20001, 'Error: Ya se ha registrado una fecha de salida.');
        ELSE
            RAISE_APPLICATION_ERROR(-20002, 'Error: La fecha de salida debe ser mayor a la fecha de entrada.');
        END IF;
    END IF;
END;


-- INSERCIONES
INSERT INTO Usuario (ID_Usuario, nombreUsuario, contrasenia, ID_Rol)
VALUES (1, 'admin1', '123456', 2);

INSERT INTO Visitante (cedula, nombre) VALUES ('1059236559', 'Juan Perez');
INSERT INTO Visitante (cedula, nombre) VALUES ('1012345678', 'Maria Gomez');
INSERT INTO Visitante (cedula, nombre) VALUES ('1023456789', 'Pedro Ramirez');
INSERT INTO Visitante (cedula, nombre) VALUES ('1034567890', 'Lucia Martinez');
INSERT INTO Visitante (cedula, nombre) VALUES ('1045678901', 'Carlos Sanchez');
INSERT INTO Visitante (cedula, nombre) VALUES ('1056789012', 'Ana Torres');
INSERT INTO Visitante (cedula, nombre) VALUES ('1056789011', 'Penesito');

INSERT INTO Vehiculo (placa, cedula) VALUES ('ABC123', '1059236559');
INSERT INTO Vehiculo (placa, cedula) VALUES ('DEF456', '1012345678');
INSERT INTO Vehiculo (placa, cedula) VALUES ('GHI789', '1023456789');
INSERT INTO Vehiculo (placa, cedula) VALUES ('JKL012', '1034567890');
INSERT INTO Vehiculo (placa, cedula) VALUES ('MNO345', '1045678901');
INSERT INTO Vehiculo (placa, cedula) VALUES ('PQR678', '1056789012');
INSERT INTO Vehiculo (placa, cedula) VALUES ('QKRIK69', '1056789011');

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

UPDATE ZonaParqueo SET Estado = 'Disponible' WHERE ID_ZonaParqueo LIKE 'B2';

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
INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (7, TO_TIMESTAMP('16-10-2024 10:00:00', 'DD-MM-YY HH24:MI:SS'), 'QKRIK69', 'B2');
INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (8, TO_TIMESTAMP('16-10-2024 10:00:00', 'DD-MM-YY HH24:MI:SS'), 'QKRIK69', 'B2');
INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (9, TO_TIMESTAMP('16-10-2024 10:00:00', 'DD-MM-YY HH24:MI:SS'), 'QKRIK69', 'B2');
INSERT INTO EntradaSalida (ID_EntradaSalida, FechaEntrada, placa, ID_ZonaParqueo)
VALUES (10, TO_TIMESTAMP('16-10-2024 10:00:00', 'DD-MM-YY HH24:MI:SS'), 'QKRIK69', 'B2');


DELETE FROM EntradaSalida;

UPDATE EntradaSalida SET FechaSalida = '16-10-2024 10:00:00' WHERE ID_EntradaSalida = 10;
UPDATE EntradaSalida SET FechaSalida = '16-10-2024 10:00:00' WHERE ID_EntradaSalida = 1;

COMMIT;