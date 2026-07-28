import { describe, it, expect } from 'vitest';
import { serializeGuestForApi } from '@/lib/guests/guest-serialize';

describe('serializeGuestForApi', () => {
  it('removes tokenHash from guest object', () => {
    const guest = {
      id: 'g1',
      invitationId: 'inv1',
      name: 'Test',
      phone: '+77001234567',
      side: null,
      householdLabel: null,
      hasPlusOne: false,
      plusOneName: null,
      tokenHash: 'secret-hash',
      sentAt: null,
      openedAt: null,
      sentVia: null,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      response: null,
    };

    const safe = serializeGuestForApi(guest);
    expect(safe).not.toHaveProperty('tokenHash');
    expect(safe.name).toBe('Test');
    expect(safe.id).toBe('g1');
  });
});
