import { useEffect, useRef } from 'react';
import ClickSpark from '../reactbits/ClickSpark/ClickSpark.jsx';

const cssVar = (name, fallback) => (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);

// One full-screen spark layer; the page keeps its own click targets.
export default function Spark() {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (e.button !== 0) return;
      ref.current?.spark(e.clientX, e.clientY);
    };
    const onBurst = (e) => ref.current?.spark(e.detail.x, e.detail.y);
    document.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pm:spark', onBurst);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pm:spark', onBurst);
    };
  }, []);
  return (
    <ClickSpark
      ref={ref}
      sparkColor={[cssVar('--accent', '#1f9e6e'), cssVar('--accent-2', '#ef5b3f'), cssVar('--accent-3', '#f2c14e')]}
      sparkCount={10}
      sparkRadius={30}
      sparkSize={12}
      sparkWidth={2}
      duration={520}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
    />
  );
}
