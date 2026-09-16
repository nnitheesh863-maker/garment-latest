import React, { useState, useEffect, useRef } from 'react';

export default function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 0.8,
  className,
  sx,
}) {
  const [display, setDisplay] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const target =
      typeof value === 'number'
        ? value
        : parseFloat(String(value || 0).replace(/[^0-9.-]/g, '')) || 0;

    const start = prevValueRef.current;
    const diff = target - start;
    if (diff === 0) {
      setDisplay(target);
      return;
    }

    const startTime = performance.now();
    const durationMs = duration * 1000;
    let animFrameId;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutCubic(progress);
      const currentVal = start + diff * easedProgress;

      setDisplay(currentVal);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(updateCounter);
      } else {
        setDisplay(target);
        prevValueRef.current = target;
      }
    };

    animFrameId = requestAnimationFrame(updateCounter);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [value, duration, decimals]);

  const formatted =
    decimals > 0
      ? display.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(display).toLocaleString();

  return (
    <span className={className} style={sx}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
