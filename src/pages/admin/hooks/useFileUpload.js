/**
 * useFileUpload Hook
 *
 * Custom hook generalizado para manejo de archivos (imágenes, PDFs, etc.)
 * Sigue el patrón DRY (Don't Repeat Yourself) y OOP principles
 *
 * Características:
 * - Convierte archivos a Data URL (base64) para preview inmediato
 * - No requiere servidor async durante la edición
 * - Fallback automático a Blob URL si FileReader falla
 * - Soporte para drag & drop y file picker
 * - Validación de tipo de archivo
 *
 * Uso:
 * ```jsx
 * const { uploading, uploadMessage, handleFile, pickFile, dropFile } = useFileUpload({
 *   onSuccess: (dataUrl) => setData({ ...data, photo: dataUrl }),
 *   accept: 'image/*', // o '.pdf' para PDFs
 *   maxSize: 5 * 1024 * 1024, // 5MB
 * });
 * ```
 */

import { useState, useCallback } from "react";

/**
 * Convierte un File a Data URL (base64)
 * @param {File} file - Archivo a convertir
 * @returns {Promise<string>} Data URL en formato base64
 */
async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = (error) => {
        console.error("[useFileUpload] FileReader error:", error);
        reject(error);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Valida el tipo de archivo
 * @param {File} file - Archivo a validar
 * @param {string} accept - Tipos aceptados (e.g., 'image/*', '.pdf', 'image/jpeg,image/png')
 * @returns {boolean} True si es válido
 */
function validateFileType(file, accept) {
  if (!accept || accept === "*") return true;

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  // Si accept es extensión (.pdf, .jpg, etc.)
  if (accept.startsWith(".")) {
    const extensions = accept.split(",").map((ext) => ext.trim());
    return extensions.some((ext) => fileName.endsWith(ext));
  }

  // Si accept es mime type (image/*, application/pdf, etc.)
  const mimeTypes = accept.split(",").map((type) => type.trim());
  return mimeTypes.some((mimeType) => {
    if (mimeType.endsWith("/*")) {
      // Wildcard: image/* acepta image/jpeg, image/png, etc.
      const prefix = mimeType.slice(0, -2);
      return fileType.startsWith(prefix);
    }
    return fileType === mimeType;
  });
}

/**
 * Formatea el tamaño de archivo en formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (e.g., "2.5 MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Custom Hook para manejo de archivos
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.onSuccess - Callback cuando se procesa exitosamente el archivo (recibe url de archivo)
 * @param {Function} options.onError - Callback cuando ocurre un error (opcional)
 * @param {string} options.accept - Tipos de archivo aceptados (default: '*')
 * @param {number} options.maxSize - Tamaño máximo en bytes (default: 10MB)
 * @param {string} options.uploadPath - Ruta donde guardar en GitHub (ej: 'public/assets/images/products/pdf/')
 * @param {boolean} options.usePreview - Solo preview local (no sube a servidor) - default false
 * @returns {Object} Métodos y estado del upload
 */
export function useFileUpload(options = {}) {
  const {
    onSuccess,
    onError,
    accept = "*",
    maxSize = 10 * 1024 * 1024, // 10MB por defecto
    uploadPath = "public/uploads/", // Ruta por defecto
    usePreview = false, // Si es true, solo preview local (no sube)
  } = options;

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  /**
   * Procesa un archivo: sube a servidor o preview local
   * @param {File} file - Archivo a procesar
   */
  const handleFile = useCallback(
    async (file) => {
      if (!file) {
        setUploadMessage("No se seleccionó ningún archivo");
        return;
      }

      try {
        setUploading(true);
        setUploadMessage("");

        // Validar tipo de archivo
        if (!validateFileType(file, accept)) {
          const message = `Tipo de archivo no permitido. Solo se aceptan: ${accept}`;
          setUploadMessage(message);
          onError?.(new Error(message));
          return;
        }

        // Validar tamaño
        if (file.size > maxSize) {
          const message = `Archivo demasiado grande (${formatFileSize(
            file.size
          )}). Máximo permitido: ${formatFileSize(maxSize)}`;
          setUploadMessage(message);
          onError?.(new Error(message));
          return;
        }

        // Opción 1: Solo preview local (no sube a servidor)
        if (usePreview) {
          try {
            const dataUrl = await fileToDataURL(file);
            onSuccess?.(dataUrl, file);
            setUploadMessage(
              `✓ Preview local: ${file.name} (${formatFileSize(file.size)})`
            );
          } catch (fileReaderError) {
            console.warn(
              "[useFileUpload] FileReader falló, usando Blob URL:",
              fileReaderError
            );
            const blobUrl = URL.createObjectURL(file);
            onSuccess?.(blobUrl, file);
            setUploadMessage(`✓ Preview local (blob): ${file.name}`);
          }
          return;
        }

        // Opción 2: MOCK temporal en lugar de subir al servidor (ya que Firestore Storage se pospuso)
        setUploadMessage(`⏳ Subiendo ${file.name} (MOCK)...`);

        // Simular delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        let fileUrl = "";
        if (file.type.startsWith("image/")) {
          // Si es imagen, generar un string largo de DataURL para que se vea previsualizado y se guarde en Firestore,
          // o podemos usar un placeholder externo. Debido a requerimientos visuales del panel, vamos a usar un placeholder 
          // que permita observar nombre del archivo.
          fileUrl = `https://via.placeholder.com/640x360.png?text=${encodeURIComponent(file.name.substring(0, 15))}`;
        } else {
          // Si es PDF u otro
          fileUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        }

        console.log("[useFileUpload] Upload success (MOCK):", fileUrl);
        onSuccess?.(fileUrl, file);
        setUploadMessage(`✓ Archivo guardado (MOCK): ${file.name}`);
      } catch (error) {
        console.error("[useFileUpload] Error:", error);
        const message = `Error al subir archivo: ${error.message || "Error desconocido"
          }`;
        setUploadMessage(message);
        onError?.(error);
      } finally {
        setUploading(false);
      }
    },
    [accept, maxSize, uploadPath, usePreview, onSuccess, onError]
  );

  /**
   * Handler para input file picker
   * @param {Event} event - Evento onChange del input
   */
  const pickFile = useCallback(
    (event) => {
      const file = event.target?.files?.[0];
      if (file) {
        handleFile(file);
        // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
        event.target.value = "";
      }
    },
    [handleFile]
  );

  /**
   * Handler para drag & drop
   * @param {DragEvent} event - Evento onDrop
   */
  const dropFile = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  /**
   * Handler para prevenir el comportamiento por defecto del drag over
   * @param {DragEvent} event - Evento onDragOver
   */
  const dragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    uploading,
    uploadMessage,
    handleFile,
    pickFile,
    dropFile,
    dragOver,
  };
}

export default useFileUpload;
