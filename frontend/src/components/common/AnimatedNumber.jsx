import React, { useState, useEffect, useRef } from 'react';

export default function AnimatedNumber({ value, suffix = '', prefix = '', duration = 1, className, sx }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  const animate = (target) => {
    let start = 0;
    const end = target;
    if (start === end) { setDisplay(end); return; }
    const increment = end / (60 * duration);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 1000 / 60);
    return timer;
  };

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
    const timer = animate(num);
    return () => timer && clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted = display.toLocaleString();

  return (
    <span ref={ref} className={className} style={sx}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
