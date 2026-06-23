import { useEffect, useState } from 'react';

export const useLactationTimer = (horaSalidaEstimada) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const ms = new Date(horaSalidaEstimada).getTime() - Date.now();
      setRemaining(Math.max(0, ms));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [horaSalidaEstimada]);

  const totalMs = 30 * 60 * 1000;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return {
    remaining,
    isExpired: remaining <= 0,
    formatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    percent: Math.max(0, Math.min(100, (remaining / totalMs) * 100)),
  };
};
