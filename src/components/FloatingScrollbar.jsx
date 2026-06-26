import { useEffect, useRef, useState } from 'react';

export default function FloatingScrollbar({ targetRef }) {
  const barRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const syncing = useRef(false);

  useEffect(() => {
    const el = targetRef?.current;
    if (!el) return;

    const update = () => {
      setScrollWidth(el.scrollWidth);
      setClientWidth(el.clientWidth);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    const onScroll = () => {
      if (syncing.current) return;
      syncing.current = true;
      if (barRef.current) barRef.current.scrollLeft = el.scrollLeft;
      syncing.current = false;
    };
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [targetRef]);

  const onBarScroll = () => {
    if (syncing.current) return;
    syncing.current = true;
    if (targetRef?.current && barRef.current) {
      targetRef.current.scrollLeft = barRef.current.scrollLeft;
    }
    syncing.current = false;
  };

  if (scrollWidth <= clientWidth) return null;

  return (
    <div
      ref={barRef}
      onScroll={onBarScroll}
      className="fixed bottom-0 left-0 right-0 z-40 overflow-x-auto"
      style={{ height: 14, direction: 'ltr' }}
    >
      <div style={{ width: scrollWidth, height: 1 }} />
    </div>
  );
}
