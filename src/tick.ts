import { useEffect, useRef } from 'react';

export function useTicker(callback: (deltaMs: number) => void, enabled: boolean) {
  const frame = useRef<number>();
  const lastTime = useRef<number>();
  const savedCallback = useRef(callback);

  // Always use the latest callback without re-subscribing
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = (time: number) => {
      if (lastTime.current != null) {
        const delta = time - lastTime.current;
        savedCallback.current(delta);
      }
      lastTime.current = time;
      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      lastTime.current = undefined;
    };
  }, [enabled]);
}
