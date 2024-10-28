

const { validarForm: validarFormEntrada, setupRegistrarBtn } = require('../../Front/assetsIndex/scriptEntrada');
const { validarForm: validarFormSalida, setupRegistrarSalidaBtn } = require('../../Front/assetsIndex/scriptSalida');
require('../../Front/assetsLogin/script');

// Pruebas de Entrada
describe('Pruebas de entrada', () => {
    beforeAll(() => {
        document.body.innerHTML = `
            <button id="boton-registrar"></button>
            <input id="entrada-cedula" />
            <input id="entrada-nombre" />
            <input id="entrada-placa" />
            <div id="error-campos" style="display:none;"></div>
            <div id="error-cedula" style="display:none;"></div>
            <div id="error-nombre" style="display:none;"></div>
            <div id="error-placa" style="display:none;"></div>
        `;
        setupRegistrarBtn();
    });

    // Pruebas válidas
    test('Debe validar correctamente cuando los datos de entrada son válidos (nombre con espacios)', () => {
        const result = validarFormEntrada('987654321', 'Carlos Andrés', 'XYZ987');
        expect(result).toBe(true);
    });

    test('Debe validar correctamente cuando los datos de entrada son válidos (placa con números y letras)', () => {
        const result = validarFormEntrada('135792468', 'Ana Maria', 'QWE789');
        expect(result).toBe(true);
    });


    // Otras pruebas inválidas
    test('Debe retornar false cuando el nombre contiene caracteres especiales', () => {
        const result = validarFormEntrada('987654321', 'Carlos@Andrés', 'XYZ987');
        expect(result).toBe(false);
    });

    test('Debe retornar false cuando la cédula de entrada excede los 10 caracteres', () => {
        const result = validarFormEntrada('123456789123456789123456789', 'Juan Perez', 'ABC123');
        expect(result).toBe(false);
    });

    test('Debe retornar false cuando la placa de entrada es inválida (faltan letras)', () => {
        const result = validarFormEntrada('135792468', 'Ana Maria', 'AB12');
        expect(result).toBe(false);
    });
});

// Pruebas de Salida
describe('Pruebas de salida', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button id="boton-registrar-salida"></button>
            <input id="salida-cedula" />
            <input id="salida-placa" />
            <div id="error-campos-salida" style="display:none;"></div>
            <div id="error-cedula-salida" style="display:none;"></div>
            <div id="error-placa-salida" style="display:none;"></div>
        `;
        setupRegistrarSalidaBtn();
    });

    // Pruebas válidas
    test('Debe validar correctamente cuando los datos de salida son válidos', () => {
        const result = validarFormSalida('123456789', 'ABC123');
        expect(result).toBe(true);
    });

    test('Debe validar correctamente cuando los datos de salida son válidos (placa con números y letras)', () => {
        const result = validarFormSalida('987654321', 'XYZ987');
        expect(result).toBe(true);
    });


    // Otras pruebas inválidas
    test('Debe retornar false cuando la placa de salida tiene un formato incorrecto', () => {
        const result = validarFormSalida('987654321', '123');
        expect(result).toBe(false);
    });

    test('Debe retornar false cuando la placa de salida contiene caracteres especiales', () => {
        const result = validarFormSalida('135792468', 'XYZ!@#');
        expect(result).toBe(false);
    });
});

// Pruebas de Login
describe('Pruebas de login', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <form class="form-login">
                <input type="text" id="name" />
                <input type="password" id="password" />
                <div id="alerta-error"></div>
                <button type="submit">Login</button>
            </form>
        `;
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    // Pruebas válidas
    test('Debe redirigir a index.html cuando los datos de login son correctos', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ redirect: 'index.html' }),
            })
        );

        document.getElementById('name').value = 'admin1';
        document.getElementById('password').value = '123456';

        delete window.location;
        window.location = { href: 'index.html' };

        const loginForm = document.querySelector('.form-login');
        await loginForm.dispatchEvent(new Event('submit'));

        expect(window.location.href).toBe('index.html');
    });

    test('Debe permitir el acceso cuando las credenciales son correctas (usuario y contraseña válidos)', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ redirect: 'index.html' }),
            })
        );

        document.getElementById('name').value = 'adminPrueba';
        document.getElementById('password').value = 'contrasenia123';

        delete window.location;
        window.location = { href: 'index.html' };

        const loginForm = document.querySelector('.form-login');
        await loginForm.dispatchEvent(new Event('submit'));

        expect(window.location.href).toBe('index.html');
    });

    // Pruebas inválidas
    test('Debe mostrar un error si el campo de usuario está vacío', () => {
        const loginForm = document.querySelector('.form-login');
        const msjError = document.getElementById('alerta-error');
        
        document.getElementById('name').value = '';
        document.getElementById('password').value = 'password123';

        loginForm.dispatchEvent(new Event('submit'));

        expect(msjError.innerHTML).toBe('Todos los campos son obligatorios');
    });

    test('Debe mostrar un error si las credenciales son incorrectas', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({}),
            })
        );

        document.getElementById('name').value = 'admin';
        document.getElementById('password').value = 'wrongpassword';

        const loginForm = document.querySelector('.form-login');
        await loginForm.dispatchEvent(new Event('submit'));

        const msjError = document.getElementById('alerta-error');
        expect(msjError.innerHTML).toBe('Usuario y/o Contraseña incorrecto(s)');
    });

    test('Debe mostrar un error si el campo de contraseña está vacío', () => {
        const loginForm = document.querySelector('.form-login');
        const msjError = document.getElementById('alerta-error');
        
        document.getElementById('name').value = 'admin';
        document.getElementById('password').value = '';

        loginForm.dispatchEvent(new Event('submit'));

        expect(msjError.innerHTML).toBe('Todos los campos son obligatorios');
    });
});

// Limpiar mocks
afterEach(() => {
    jest.clearAllMocks();
});
