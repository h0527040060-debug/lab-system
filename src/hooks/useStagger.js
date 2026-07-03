/**
 * useStagger — מחזיר style object עם animation-delay מדורג
 * שימוש: <li style={stagger(i)} className="animate-fade-in">
 */
export function useStagger(step = 50, max = 800) {
  return (index) => ({
    animationDelay: `${Math.min(index * step, max)}ms`,
    animationFillMode: 'both',
  });
}
