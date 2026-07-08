/**
 * Dimensiones intrínsecas de una imagen local (antes de subirla). Best-effort:
 * devuelve null si el archivo no se puede decodificar — width/height son
 * metadatos opcionales del confirm de galería y nunca deben bloquear la subida.
 */
export async function readImageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return size;
    }
  } catch {
    /* decodificación fallida: cae al fallback <img> */
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
