import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp — אנימציית מספר עולה מ-0 לערך יעד
 * @param {number} target  — ערך יעד
 * @param {number} duration — משך באלפיות שנייה (ברירת מחדל 700ms)
 */
export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) {
      setValue(target);
      return;
    }
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
