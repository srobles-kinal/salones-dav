import { useEffect, useRef } from 'react';

/**
 * Ejecuta `callback` en intervalos regulares para mantener los datos frescos
 * sin que el usuario tenga que recargar la página.
 *
 * Características:
 * - Pausa el polling cuando la pestaña no está visible (ahorra llamadas a la API,
 *   importante porque Google Sheets tiene cuota de lecturas).
 * - Al volver a la pestaña, refresca de inmediato.
 * - No dispara mientras una carga previa sigue en curso (evita solapamientos).
 *
 * @param {Function} callback  Función async a ejecutar (típicamente tu `load`)
 * @param {number} intervalMs  Milisegundos entre refrescos (default 20000 = 20s)
 * @param {boolean} enabled    Si false, no hace polling (default true)
 */
export function useAutoRefresh(callback, intervalMs = 20000, enabled = true) {
  const savedCallback = useRef(callback);
  const isRunning = useRef(false);

  // Mantener la referencia al callback más reciente sin reiniciar el intervalo
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      // No solapar si la petición anterior sigue corriendo
      if (isRunning.current) return;
      // No refrescar si la pestaña está oculta
      if (document.hidden) return;
      isRunning.current = true;
      try {
        await savedCallback.current();
      } catch (e) {
        // Silencioso: un fallo de refresco no debe romper la UI
      } finally {
        isRunning.current = false;
      }
    };

    const id = setInterval(tick, intervalMs);

    // Al volver a la pestaña, refrescar de inmediato
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, enabled]);
}
