import { supabase } from '../config/supabase';
import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen y la convierte a WebP.
 * Si falla la compresión, devuelve el archivo original.
 * @param {File} file
 * @returns {Promise<File>}
 */
export const compressImageToWebP = async (file) => {
    if (!file || !file.type.startsWith('image/')) return file;
    try {
        const compressed = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp',
        });
        const newName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
        return new File([compressed], newName, { type: 'image/webp' });
    } catch (e) {
        console.warn('Compresión de imagen falló, se usará original:', e);
        return file;
    }
};

/**
 * Sube un archivo a un bucket de Supabase y retorna su URL pública.
 */
export const uploadFileToSupabase = async (file, bucket = 'nft-assets', folderRef = 'uploads') => {
    if (!file) {
        throw new Error('No se proporcionó un archivo para subir.');
    }

    // Generar un nombre único para evitar colisiones
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
    const filePath = `${folderRef}/${fileName}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Error subiendo a Supabase:', error.message);
        throw error;
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
};

/**
 * Elimina un archivo de Supabase Storage usando su URL pública.
 * No lanza error si el archivo no existe o la URL no es de Supabase.
 *
 * @param {string} publicUrl - URL pública del archivo en Supabase
 * @param {string} bucket - Nombre del bucket (ej. "nft-assets")
 */
export const deleteFileFromSupabase = async (publicUrl, bucket = 'nft-assets') => {
    if (!publicUrl || typeof publicUrl !== 'string') {
        console.log('[deleteFile] Skipping — URL vacía o inválida:', publicUrl);
        return;
    }

    try {
        const marker = `/object/public/${bucket}/`;
        const idx = publicUrl.indexOf(marker);
        if (idx === -1) {
            console.log('[deleteFile] Skipping — no es URL de Supabase:', publicUrl);
            return;
        }

        const filePath = decodeURIComponent(publicUrl.slice(idx + marker.length));
        console.log('[deleteFile] Intentando borrar:', filePath, 'del bucket:', bucket);

        const { data, error } = await supabase.storage.from(bucket).remove([filePath]);
        if (error) {
            console.error('[deleteFile] Error de Supabase:', error.message, error);
        } else {
            console.log('[deleteFile] ✓ Borrado exitoso:', data);
        }
    } catch (e) {
        console.error('[deleteFile] Excepción inesperada:', e);
    }
};
