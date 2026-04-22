// src/lib/imageCompression.ts
import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen antes de subirla al servidor.
 * Solo procesa archivos con mime image/*. Si no es imagen, devuelve el archivo sin cambios.
 */
export async function compressImage(file: File): Promise<File> {
  // Solo comprimir imágenes
  if (!file.type.startsWith('image/')) return file;

  const options = {
    maxSizeMB: 1,            // Máximo 1 MB
    maxWidthOrHeight: 1920,  // Máximo 1920px en cualquier dimensión
    useWebWorker: true,      // Usar web worker para no bloquear UI
    fileType: file.type as string,
  };

  try {
    const compressed = await imageCompression(file, options);
    // Preservar el nombre original del archivo
    return new File([compressed], file.name, { type: compressed.type });
  } catch (err) {
    console.warn('Error comprimiendo imagen, usando original:', err);
    return file; // Fallback: usar el archivo sin comprimir
  }
}
