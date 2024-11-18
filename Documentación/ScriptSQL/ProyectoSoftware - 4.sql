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
GRANT SELECT ON ZonaParqueo TO C##ADMINISTRADOR_ROL;

-- CREACIÓN DE USUARIOS
CONNECT system/oracle; 

-- Habilitar Oracle Script
ALTER SESSION SET "_ORACLE_SCRIPT" = true;

-- Creación de usuarios
CREATE USER superadmin_usuario IDENTIFIED BY superadmin123;

CONNECT system/oracle; 
-- Asignar roles a los usuarios
GRANT C##SUPERADMINISTRADOR_ROL TO superadmin_usuario;
GRANT C##ADMINISTRADOR_ROL TO superadmin_usuario WITH ADMIN OPTION;
GRANT DBA TO superadmin_usuario;

CONNECT system/oracle; 
-- Otorgar privilegios de conexión
GRANT CONNECT TO superadmin_usuario;

-- Insertar a la tabla Usuario
INSERT INTO Usuario(nombreUsuario, contraseniaUsuario, ID_rol) 
VALUES ('superadmin_usuario', 'superadmin123', 1);

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

COMMIT;