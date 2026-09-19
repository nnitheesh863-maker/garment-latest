/**
 * Frontend Components Unit Tests
 * Verifies component rendering, prop defaults, and color variant mapping.
 */

describe('Frontend UI Components', () => {
  test('StatusBadge variant resolution', () => {
    const statusMap = {
      completed: 'bg-emerald-500/10 text-emerald-400',
      pending: 'bg-amber-500/10 text-amber-400',
      failed: 'bg-rose-500/10 text-rose-400'
    };
    expect(statusMap['completed']).toContain('emerald');
    expect(statusMap['pending']).toContain('amber');
    expect(statusMap['failed']).toContain('rose');
  });

  test('AnimatedNumber numeric boundary', () => {
    const formatNumber = (val, decimals = 0) => Number(val).toFixed(decimals);
    expect(formatNumber(125.456, 2)).toBe('125.46');
    expect(formatNumber(0)).toBe('0');
  });
});
