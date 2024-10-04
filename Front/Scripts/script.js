// Script para el menú sticky cuando se hace scroll
class NavbarScroll {
    constructor(navbarId, scrollLimit) {
        this.navbar = document.getElementById(navbarId);
        this.scrollLimit = scrollLimit;
        this.init();
    }

    init() {
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    handleScroll() {
        if (window.scrollY > this.scrollLimit) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    }
}

// Instanciamos la clase NavbarScroll para el menú sticky
const navbarScroll = new NavbarScroll('navbar', 50);

// Script para mostrar/ocultar el menú en pantallas pequeñas
const menuIcon = document.getElementById('menu-icon');
const mobileMenu = document.getElementById('mobile-menu');

menuIcon.addEventListener('click', function () {
    mobileMenu.classList.toggle('hidden'); // Alternar la clase hidden para mostrar u ocultar el menú
});

// Script para ocultar el menú móvil al cambiar de tamaño de pantalla
window.addEventListener('resize', function () {
    if (window.innerWidth >= 768) {
        // Si el tamaño de la pantalla es mayor o igual a 768px, ocultar el menú móvil
        mobileMenu.classList.add('hidden');
    }
});



