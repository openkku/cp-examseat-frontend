import { useEffect, useRef, useState } from 'react';

/** Tweens from the currently shown value to target over duration ms (easeOutQuad). */
export function useAnimatedNumber(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    const startValue = shown.current;
    const change = target - startValue;
    if (change === 0) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress);
      const value = progress < 1 ? Math.floor(startValue + change * easedProgress) : target;

      shown.current = value;
      setCurrent(value);
      if (progress < 1) animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return current;
}
