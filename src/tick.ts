import { useEffect, useRef } from 'react';

export function useTicker(callback: (deltaMs: number) => void, enabled: boolean) {
  const frame = useRef<number>();
  const lastTime = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    const tick = (time: number) => {
      if (lastTime.current != null) {
        const delta = time - lastTime.current;
        callback(delta);
      }
      lastTime.current = time;
      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame.current!);
      lastTime.current = undefined;
    };
  }, [enabled, callback]);
}
