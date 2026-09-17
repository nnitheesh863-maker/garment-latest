import React from 'react';

export default function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  className,
  sx,
}) {
  const num =
    typeof value === 'number'
      ? value
      : parseFloat(String(value || 0).replace(/[^0-9.-]/g, '')) || 0;

  const formatted =
    decimals > 0
      ? num.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : num.toLocaleString();

  return (
    <span className={className} style={sx}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
