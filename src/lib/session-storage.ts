// sessionStorage puede no existir o lanzar (modo privado, cookies bloqueadas). Estas
// funciones nunca fallan: si no se puede leer o escribir, simplemente no hay estado guardado.
// Solo se usa para comodidades de la pestaña (checklist, cronómetro, borrador), nunca para datos
// que deban persistir.

export const readSession = <T>(key: string): T | null => {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
};

export const writeSession = (key: string, value: unknown) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento: no pasa nada.
  }
};

export const removeSession = (key: string) => {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Sin almacenamiento: no pasa nada.
  }
};
