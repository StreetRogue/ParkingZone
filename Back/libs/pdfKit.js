const PDFDocument = require("pdfkit");

function generarPDF(dataCallback, endCallback, datos) {
    // Crear un nuevo documento PDF
    const doc = new PDFDocument({ 
        size: [260, 242],
        margin: 10
     });

    doc.on("data", dataCallback);
    doc.on("end", endCallback);

    // Estilo general de la fuente
    doc.font("Courier").fontSize(10);

    // Función para centrar texto en una línea de ancho específico
    function centrarTexto(texto, ancho) {
        const espacios = Math.floor((ancho - texto.length) / 2);
        return " ".repeat(espacios) + texto;
    }

    // Configuración del ancho en caracteres
    const anchoLinea = 40;

    // Función para añadir una línea de texto con borde
    function agregarLineaConBorde(texto) {
        doc.text("*" + texto.padEnd(anchoLinea - 2) + "*");
    }

    // Función para añadir una etiqueta y valor con espaciado adecuado
    function agregarEtiquetaValor(etiqueta, valor) {
        const textoCompleto = `${etiqueta}: ${valor}`;
        const espacios = anchoLinea - textoCompleto.length - 5;
        agregarLineaConBorde(` ${textoCompleto}${" ".repeat(espacios)}`);
    }

    // Iniciar la factura con el diseño
    agregarLineaConBorde("*".repeat(anchoLinea - 2));
    agregarLineaConBorde(centrarTexto("ÉXITO", anchoLinea - 2));
    agregarLineaConBorde("*".repeat(anchoLinea - 2));
    agregarLineaConBorde(centrarTexto("FACTURA ESTACIONAMIENTO", anchoLinea - 2));
    agregarLineaConBorde("*".repeat(anchoLinea - 2));

    agregarEtiquetaValor("Código de Factura", datos.codigo);

    agregarLineaConBorde("*".repeat(anchoLinea - 2));

    agregarLineaConBorde(centrarTexto("Detalles del Vehículo", anchoLinea - 2));
    agregarEtiquetaValor("Placa", datos.placa);
    agregarEtiquetaValor("Entrada", datos.entrada);
    agregarEtiquetaValor("Salida", datos.salida);
    agregarEtiquetaValor("Duración", datos.duracion);

    agregarLineaConBorde("*".repeat(anchoLinea - 2));
    agregarLineaConBorde(centrarTexto("Detalles del Visitante", anchoLinea - 2));
    agregarEtiquetaValor("Nombre", datos.nombre);
    agregarEtiquetaValor("Cédula", datos.cedula);

    agregarLineaConBorde("*".repeat(anchoLinea - 2));
    agregarEtiquetaValor("Valor a Pagar", datos.tarifa);

    agregarLineaConBorde("*".repeat(anchoLinea - 2));
    agregarLineaConBorde(" Gracias por su visita", anchoLinea - 2);
    agregarLineaConBorde("*".repeat(anchoLinea - 2));

    // Finalizar y guardar el PDF
    doc.end();
}

module.exports = {generarPDF};