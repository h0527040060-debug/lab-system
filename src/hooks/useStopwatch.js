import { useState, useEffect } from 'react';

// hook להצגת סטופר רץ בזמן אמת
// מקבל startTime (ISO string) ומחזיר {hours, minutes, seconds, totalHours, display}
export const useStopwatch = (startTime) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) {
    return { hours: 0, minutes: 0, seconds: 0, totalHours: 0, display: '00:00:00' };
  }

  const elapsedMs = now - new Date(startTime).getTime();
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const totalHours = elapsedMs / (1000 * 60 * 60);

  const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { hours, minutes, seconds, totalHours, display };
};
