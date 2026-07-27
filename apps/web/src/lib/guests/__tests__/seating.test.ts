import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock pricing to always allow seating (avoids pulling in template/order resolvers).
vi.mock('@/lib/invitations/invitation-pricing', () => ({
  getInvitationPricing: vi.fn(async () => ({
    entitlements: { seating: true },
    planSku: 'premium',
  })),
}));

const { invitation, guest, seatingTable, seatingAssignment } = vi.hoisted(() => ({
  invitation: { findFirst: vi.fn() },
  guest: { findFirst: vi.fn() },
  seatingTable: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    aggregate: vi.fn(),
  },
  seatingAssignment: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/shared/db', () => ({
  default: {
    invitation,
    guest,
    seatingTable,
    seatingAssignment,
  },
}));

import {
  assignGuestToTable,
  createSeatingTable,
  listSeatingTables,
} from '@/lib/guests/seating';

describe('seating service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists tables with guest ids', async () => {
    invitation.findFirst.mockResolvedValue({ id: 'inv-1' });
    seatingTable.findMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Стол 1',
        capacity: 8,
        sortOrder: 0,
        assignments: [{ guestId: 'g1' }, { guestId: 'g2' }],
      },
    ]);

    const tables = await listSeatingTables('inv-1', 'user-1');
    expect(tables).toEqual([
      {
        id: 't1',
        name: 'Стол 1',
        capacity: 8,
        sortOrder: 0,
        assignedCount: 2,
        guestIds: ['g1', 'g2'],
      },
    ]);
  });

  it('creates table with next sort order', async () => {
    invitation.findFirst.mockResolvedValue({ id: 'inv-1' });
    seatingTable.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    seatingTable.create.mockResolvedValue({
      id: 't2',
      name: 'VIP',
      capacity: 10,
      sortOrder: 3,
    });

    const table = await createSeatingTable({
      invitationId: 'inv-1',
      userId: 'user-1',
      name: 'VIP',
      capacity: 10,
    });
    expect(table.sortOrder).toBe(3);
    expect(table.assignedCount).toBe(0);
  });

  it('rejects assign when table full', async () => {
    invitation.findFirst.mockResolvedValue({ id: 'inv-1' });
    guest.findFirst.mockResolvedValue({ id: 'g-new', seating: null });
    seatingTable.findFirst.mockResolvedValue({
      id: 't1',
      name: 'Стол 1',
      capacity: 1,
      invitationId: 'inv-1',
      _count: { assignments: 1 },
    });

    await expect(
      assignGuestToTable({
        invitationId: 'inv-1',
        userId: 'user-1',
        guestId: 'g-new',
        tableId: 't1',
      })
    ).rejects.toMatchObject({ code: 'table_full' });
  });
});
