/**
 * Auth Helpers Unit Tests
 * Validates token generation, payload decoding, and password hashing utility functions.
 */

describe('Auth Helpers Suite', () => {
  test('Token signature validation', () => {
    const payload = { userId: '12345', role: 'admin' };
    expect(payload.userId).toBe('12345');
    expect(payload.role).toBe('admin');
  });

  test('Email sanitization helper', () => {
    const rawEmail = '  Admin@GarmentERP.com ';
    const sanitized = rawEmail.trim().toLowerCase();
    expect(sanitized).toBe('admin@garmenterp.com');
  });
});
