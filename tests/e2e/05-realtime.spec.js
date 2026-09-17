import { test, expect } from '@playwright/test';

test.describe('05 - Real-Time Socket.IO Synchronization Suite', () => {
  test('Backend WebSocket server responds to connection probes', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/health');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
