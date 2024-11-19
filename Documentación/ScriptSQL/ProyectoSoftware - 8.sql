DROP TABLE USUARIO CASCADE CONSTRAINTS;
DROP TABLE VISITANTE CASCADE CONSTRAINTS;
DROP TABLE ENTRADASALIDA CASCADE CONSTRAINTS;
DROP TABLE FACTURA CASCADE CONSTRAINTS;
DROP TABLE REPORTE CASCADE CONSTRAINTS;
DROP TABLE VEHICULO CASCADE CONSTRAINTS;
DROP TABLE ZONAPARQUEO CASCADE CONSTRAINTS;
DROP TABLE ROL CASCADE CONSTRAINTS;
DROP TABLE Secuencia CASCADE CONSTRAINTS;

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
    TituloReporte VARCHAR2(500) NOT NULL,
    DescripcionReporte VARCHAR2(300) NOT NULL,
    FechaReporte VARCHAR2(50) NOT NULL,
    HoraReporte VARCHAR2(50) NOT NULL,
    CONSTRAINT pk_Reporte PRIMARY KEY (ID_Reporte)
);

CREATE TABLE Factura (
    CodigoFactura INTEGER NOT NULL,
    PlacaVehiculo VARCHAR2(6) NOT NULL,
    Entrada VARCHAR2(50) NOT NULL,
    Salida VARCHAR2(50) NOT NULL,
    TiempoEstancia VARCHAR2(50) NOT NULL,
    NombreVisitante VARCHAR(50) NOT NULL,
    CedulaVisitante VARCHAR2(10) NOT NULL,
    TarifaCobro NUMBER NOT NULL,
    CONSTRAINT pk_Factura PRIMARY KEY (CodigoFactura)
);

CREATE TABLE Secuencia (
    NombreSecuencia VARCHAR2(50),
    ValorActual NUMBER
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
GRANT SELECT, INSERT, UPDATE, DELETE ON Secuencia TO C##SUPERADMINISTRADOR_ROL;
GRANT EXECUTE ON crearReporte TO C##SUPERADMINISTRADOR_ROL;

-- Privilegios para el rol de ADMINISTRADOR
GRANT SELECT, INSERT ON Visitante TO C##ADMINISTRADOR_ROL;
GRANT SELECT, INSERT ON Vehiculo TO C##ADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE ON EntradaSalida TO C##ADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE ON Factura TO C##ADMINISTRADOR_ROL;
GRANT SELECT, INSERT ON Reporte TO C##ADMINISTRADOR_ROL;
GRANT SELECT, UPDATE ON ZonaParqueo TO C##ADMINISTRADOR_ROL;
GRANT SELECT, INSERT, UPDATE ON Secuencia TO C##ADMINISTRADOR_ROL;
GRANT EXECUTE ON crearReporte TO C##ADMINISTRADOR_ROL;

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

-- Creacion de la secuencia para el codigo de la factura
CREATE SEQUENCE seqFactura
MINVALUE 0
START WITH 0
INCREMENT BY 1;

SELECT seqFactura.NEXTVAL
FROM DUAL;

CREATE SEQUENCE seqReporte
MINVALUE 0
START WITH 0
INCREMENT BY 1;

SELECT seqReporte.NEXTVAL
FROM DUAL;

-- ALTER SEQUENCE seqFactura RESTART;
-- ALTER SEQUENCE seqReporte RESTART;

-- Insertar la secuencia a la tabla
INSERT INTO Secuencia (NombreSecuencia) VALUES ('seqFactura');
INSERT INTO Secuencia (NombreSecuencia) VALUES ('seqReporte');

-- Paquetes
CREATE OR REPLACE PACKAGE infoHoras AS
    fechaEntrada EntradaSalida.FechaEntrada%TYPE;
    fechaSalida EntradaSalida.FechaSalida%TYPE;
END;

-- Funciones y Procedimientos
CREATE OR REPLACE FUNCTION calcularEstancia(v_entrada EntradaSalida.FechaEntrada%TYPE)
RETURN Factura.TiempoEstancia%TYPE 
IS
    v_tiempoEstancia Factura.TiempoEstancia%TYPE;
BEGIN
    SELECT 
    (EXTRACT(DAY FROM (FechaSalida - FechaEntrada)) * 24 + EXTRACT(HOUR FROM (FechaSalida - FechaEntrada))) || ' horas ' ||
    EXTRACT(MINUTE FROM (FechaSalida - FechaEntrada) DAY TO SECOND) || ' minutos' AS "Tiempo Estancia"
    INTO v_tiempoEstancia
    FROM 
        EntradaSalida
    WHERE 
        FechaEntrada = v_entrada;
    
    RETURN v_tiempoEstancia;
END;

CREATE OR REPLACE FUNCTION calcularTarifa(v_entrada EntradaSalida.FechaEntrada%TYPE)
RETURN Factura.TiempoEstancia%TYPE 
IS
    v_horasEstancia NUMBER;
    v_tarifaCobro Factura.TarifaCobro%TYPE := 2000;
BEGIN
    SELECT EXTRACT(DAY FROM (FechaSalida - FechaEntrada)) * 24 + EXTRACT(HOUR FROM (FechaSalida - FechaEntrada))
    INTO v_horasEstancia
    FROM EntradaSalida
    WHERE fechaEntrada = v_entrada;
    
    IF (v_horasEstancia IS NOT NULL AND v_horasEstancia > 1) THEN
        v_tarifaCobro := v_horasEstancia * 2000;
    END IF;
    
    RETURN v_tarifaCobro;
END;

CREATE OR REPLACE PROCEDURE crearFactura
IS
    v_codigoFactura Factura.CodigoFactura%TYPE;
    v_placaVehiculo Factura.PlacaVehiculo%TYPE;
    v_entrada Factura.Entrada%TYPE;
    v_salida Factura.Salida%TYPE;
    v_tiempoEstancia Factura.TiempoEstancia%TYPE;
    v_nombreVisitante Factura.NombreVisitante%TYPE;
    v_cedulaVisitante Factura.CedulaVisitante%TYPE;
    v_tarifaCobro Factura.TarifaCobro%TYPE;
BEGIN
    SELECT seqFactura.NEXTVAL 
    INTO v_codigoFactura
    FROM DUAL;
    
    UPDATE Secuencia
    SET ValorActual = v_codigoFactura
    WHERE NombreSecuencia like 'seqFactura';
    
    SELECT PlacaVehiculo
    INTO v_placaVehiculo
    FROM EntradaSalida
    WHERE fechaEntrada = infoHoras.fechaEntrada;
    DBMS_OUTPUT.PUT_LINE('PLACA: ' || v_placaVehiculo);
    
    SELECT TO_CHAR(infoHoras.fechaEntrada, 'DD/MM/YYYY') || ' ' || TO_CHAR(infoHoras.fechaEntrada, 'HH12:MI:SS AM')
    INTO v_entrada
    FROM EntradaSalida
    WHERE fechaEntrada = infoHoras.fechaEntrada;
    DBMS_OUTPUT.PUT_LINE('entrada: ' || v_entrada);
    
    SELECT TO_CHAR(infoHoras.fechaSalida, 'DD/MM/YYYY') || ' ' || TO_CHAR(infoHoras.fechaSalida, 'HH12:MI:SS AM')
    INTO v_salida
    FROM EntradaSalida
    WHERE fechaSalida = infoHoras.fechaSalida;
    DBMS_OUTPUT.PUT_LINE('salida: ' || v_salida);
    
    v_tiempoEstancia := calcularEstancia(infoHoras.fechaEntrada);
    DBMS_OUTPUT.PUT_LINE('tiempoEstancia: ' || v_tiempoEstancia);
    
    SELECT NombreVisitante, CedulaVisitante
    INTO v_nombreVisitante, v_cedulaVisitante
    FROM EntradaSalida INNER JOIN Visitante
    ON EntradaSalida.FechaEntrada = Visitante.FechaEntradaVisitante
    WHERE fechaSalida = infoHoras.fechaSalida;
    DBMS_OUTPUT.PUT_LINE('nombreVisitante: ' || v_nombreVisitante || ' cedulaVisitante: ' || v_cedulaVisitante);
    
    v_tarifaCobro := calcularTarifa(infoHoras.fechaEntrada);
    DBMS_OUTPUT.PUT_LINE('tarifaCobro: ' || v_tarifaCobro);
    
    INSERT INTO Factura VALUES (v_codigoFactura, v_placaVehiculo, v_entrada, v_salida, v_tiempoEstancia, v_nombreVisitante, v_cedulaVisitante, v_tarifaCobro);
END;

CREATE OR REPLACE PROCEDURE crearReporte(v_titulo Reporte.TituloReporte%TYPE, v_descripcion Reporte.DescripcionReporte%TYPE)
IS
    v_idReporte Reporte.ID_Reporte%TYPE;
BEGIN
    SELECT seqReporte.NEXTVAL 
    INTO v_idReporte
    FROM DUAL;
    
    UPDATE Secuencia
    SET ValorActual = v_idReporte
    WHERE NombreSecuencia like 'seqReporte';

    INSERT INTO Reporte (ID_Reporte, TituloReporte, DescripcionReporte, FechaReporte, HoraReporte) 
    VALUES (v_idReporte, v_titulo, v_descripcion, TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD'), TO_CHAR(CURRENT_TIMESTAMP, 'HH12:MI:SS AM'));
END;

-- Triggers
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

CREATE OR REPLACE TRIGGER obtenerFechas
BEFORE UPDATE ON EntradaSalida
FOR EACH ROW
BEGIN
    DBMS_OUTPUT.PUT_LINE('entrada: ' || :OLD.FechaEntrada);
    DBMS_OUTPUT.PUT_LINE('Salida: ' || :NEW.FechaSalida);
    infoHoras.fechaEntrada := :OLD.FechaEntrada;
    infoHoras.fechaSalida := :NEW.FechaSalida;
END;

CREATE OR REPLACE TRIGGER codFactura
AFTER UPDATE OF FechaSalida ON EntradaSalida
BEGIN
    crearFactura;
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

INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1012345678', TIMESTAMP '2024-11-01 08:30:00', 'Juan Pérez');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1023456789', TIMESTAMP '2024-11-01 09:00:00', 'Maria Rodríguez');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1034567890', TIMESTAMP '2024-11-02 10:15:00', 'Carlos Gómez');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1045678901', TIMESTAMP '2024-11-02 11:00:00', 'Ana Martínez');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1056789012', TIMESTAMP '2024-11-03 08:45:00', 'Luis Torres');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1067890123', TIMESTAMP '2024-11-03 09:30:00', 'Elena Jiménez');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1078901234', TIMESTAMP '2024-11-04 10:00:00', 'Roberto Castro');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1089012345', TIMESTAMP '2024-11-04 11:30:00', 'Claudia Vargas');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1090123456', TIMESTAMP '2024-11-05 08:00:00', 'Pedro López');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1101234567', TIMESTAMP '2024-11-05 09:15:00', 'Lucía Morales');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1112345678', TIMESTAMP '2024-11-06 10:45:00', 'Andrés Díaz');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1123456789', TIMESTAMP '2024-11-06 11:15:00', 'Carmen Gutiérrez');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1134567890', TIMESTAMP '2024-11-07 08:30:00', 'Manuel Pérez');
INSERT INTO Visitante (CedulaVisitante, FechaEntradaVisitante, NombreVisitante) VALUES ('1145678901', TIMESTAMP '2024-11-07 09:45:00', 'Paula Sandoval');

INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('ABC123', '1012345678', TIMESTAMP '2024-11-01 08:30:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('DEF456', '1023456789', TIMESTAMP '2024-11-01 09:00:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('GHI789', '1034567890', TIMESTAMP '2024-11-02 10:15:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('JKL012', '1045678901', TIMESTAMP '2024-11-02 11:00:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('MNO345', '1056789012', TIMESTAMP '2024-11-03 08:45:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('PQR678', '1067890123', TIMESTAMP '2024-11-03 09:30:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('STU901', '1078901234', TIMESTAMP '2024-11-04 10:00:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('VWX234', '1089012345', TIMESTAMP '2024-11-04 11:30:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('YZA567', '1090123456', TIMESTAMP '2024-11-05 08:00:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('BCD890', '1101234567', TIMESTAMP '2024-11-05 09:15:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('EFG123', '1112345678', TIMESTAMP '2024-11-06 10:45:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('HIJ456', '1123456789', TIMESTAMP '2024-11-06 11:15:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('KLM789', '1134567890', TIMESTAMP '2024-11-07 08:30:00');
INSERT INTO Vehiculo (PlacaVehiculo, CedulaVisitante, FechaEntradaVehiculo) VALUES ('NOP012', '1145678901', TIMESTAMP '2024-11-07 09:45:00');

INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-01 08:30:00', 'ABC123', 'A1');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-01 09:00:00', 'DEF456', 'A2');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-02 10:15:00', 'GHI789', 'A3');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-02 11:00:00', 'JKL012', 'A4');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-03 08:45:00', 'MNO345', 'A5');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-03 09:30:00', 'PQR678', 'A6');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-04 10:00:00', 'STU901', 'A7');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-04 11:30:00', 'VWX234', 'B1');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-05 08:00:00', 'YZA567', 'B2');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-05 09:15:00', 'BCD890', 'B3');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-06 10:45:00', 'EFG123', 'B4');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-06 11:15:00', 'HIJ456', 'B5');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-07 08:30:00', 'KLM789', 'B6');
INSERT INTO EntradaSalida (FechaEntrada, PlacaVehiculo, ID_ZonaParqueoEntrada) VALUES (TIMESTAMP '2024-11-07 09:45:00', 'NOP012', 'B7');

--EXECUTE crearReporte('Robo', 'Robo de pertenencias dentro de un vehículo estacionado');

COMMIT;