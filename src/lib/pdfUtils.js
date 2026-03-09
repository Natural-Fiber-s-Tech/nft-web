import * as pdfjsLib from 'pdfjs-dist';
// Importar el worker como URL estática. Vite lo empaquetará correctamente.
import PdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configurar el worker ANTES de cualquier uso
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorkerUrl;

/**
 * Genera una imagen WebP a partir de la primera página de un archivo PDF
 * @param {File} file - El archivo PDF original
 * @returns {Promise<File>} Archivo de imagen generado (WebP)
 */
export async function generatePdfThumbnail(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Carga el documento en memoria usando PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        // Extrae la página 1
        const page = await pdf.getPage(1);

        // Escala la vista para tener una resolución aceptable (1.5x para calidad web)
        const viewport = page.getViewport({ scale: 1.5 });

        // Renderiza en un canvas invisible
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Limpiar la página de memoria
        page.cleanup();

        // Convierte el canvas a archivo WebP
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("No se pudo crear la imagen a partir del PDF."));
                    return;
                }
                const newName = file.name.replace(/\.[^/.]+$/, "") + "_thumbnail.webp";
                const imageFile = new File([blob], newName, { type: 'image/webp' });
                resolve(imageFile);
            }, 'image/webp', 0.85);
        });
    } catch (error) {
        console.error("Error generando thumbnail de PDF:", error);
        throw error;
    }
}
