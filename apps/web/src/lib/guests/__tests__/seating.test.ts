import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TABLE } from '@/lib/guests/seating-layout';

// Mock pricing to always allow seating (avoids pulling in template/order resolvers).
vi.mock('@/lib/invitations/invitation-pricing', () => ({
  getInvitationPricing: vi.fn(async () => ({
    entitlements: { seating: true },
    planSku: 'premium',
  })),
}));

const { invitation, guest, seatingTable, seatingAssignment, $transaction } = vi.hoisted(() => {
  const seatingTableMock = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    aggregate: vi.fn(),
  };
  const seatingAssignmentMock = {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  };
  return {
    invitation: { findFirst: vi.fn() },
    guest: { findFirst: vi.fn() },
    seatingTable: seatingTableMock,
    seatingAssignment: seatingAssignmentMock,
    // Run the callback against the same mocked delegates the service uses.
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
      fn({ seatingTable: seatingTableMock, seatingAssignment: seatingAssignmentMock })
    ),
  };
});

vi.mock('@/lib/shared/db', () => ({
  default: {
    invitation,
    guest,
    seatingTable,
    seatingAssignment,
    $transaction,
  },
}));

import {
  assignGuestToTable,
  createSeatingTable,
  listSeatingTables,
  seatsTakenBy,
} from '@/lib/guests/seating';

/** Build an assignment row shaped like the service's `assignmentInclude`. */
function seat(guestId: string, status: string | null = 'attending', hasPlusOne = false) {
  return {
    guestId,
    guest: { hasPlusOne, response: status ? { status } : null },
  };
}

describe('seating service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists tables with guest ids and normalised geometry', async () => {
    seatingTable.findMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Стол 1',
        capacity: 8,
        sortOrder: 0,
        x: null,
        y: null,
        w: null,
        h: null,
        rotation: null,
        shape: null,
        tableColor: null,
        assignments: [seat('g1'), seat('g2')],
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
        seatsTaken: 2,
        guestIds: ['g1', 'g2'],
        // Nulls resolve to concrete defaults so no renderer has to guess.
        x: 0,
        y: 0,
        w: DEFAULT_TABLE.w,
        h: DEFAULT_TABLE.h,
        rotation: 0,
        shape: 'round',
        tableColor: DEFAULT_TABLE.color,
      },
    ]);
  });

  it('creates table with next sort order', async () => {
    seatingTable.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    seatingTable.create.mockResolvedValue({
      id: 't2',
      name: 'VIP',
      capacity: 10,
      sortOrder: 3,
      x: 60,
      y: 60,
      w: DEFAULT_TABLE.w,
      h: DEFAULT_TABLE.h,
      rotation: 0,
      shape: 'round',
      tableColor: DEFAULT_TABLE.color,
    });

    const table = await createSeatingTable({
      invitationId: 'inv-1',
      userId: 'user-1',
      name: 'VIP',
      capacity: 10,
    });
    expect(table.sortOrder).toBe(3);
    expect(table.assignedCount).toBe(0);
    expect(table.seatsTaken).toBe(0);
  });

  it('counts a plus-one guest as two chairs', () => {
    expect(seatsTakenBy([seat('g1', 'attending_plus_one', true)])).toBe(2);
    expect(seatsTakenBy([seat('g1', 'attending', true)])).toBe(1);
    expect(seatsTakenBy([seat('g1', 'not_attending', true)])).toBe(0);
    // Pending guests still need a chair reserved.
    expect(seatsTakenBy([seat('g1', null)])).toBe(1);
  });

  it('rejects assign when table full', async () => {
    guest.findFirst.mockResolvedValue({
      id: 'g-new',
      hasPlusOne: false,
      response: { status: 'attending' },
      seating: null,
    });
    seatingTable.findFirst.mockResolvedValue({
      id: 't1',
      name: 'Стол 1',
      capacity: 1,
      invitationId: 'inv-1',
      assignments: [seat('g1')],
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

  it('rejects a plus-one guest that needs two of the one remaining chair', async () => {
    // The old row-counting check passed here: 1 assignment < capacity 2.
    guest.findFirst.mockResolvedValue({
      id: 'g-new',
      hasPlusOne: true,
      response: { status: 'attending_plus_one' },
      seating: null,
    });
    seatingTable.findFirst.mockResolvedValue({
      id: 't1',
      name: 'Стол 1',
      capacity: 2,
      invitationId: 'inv-1',
      assignments: [seat('g1')],
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

  it('allows re-assigning a guest already seated at that table', async () => {
    guest.findFirst.mockResolvedValue({
      id: 'g1',
      hasPlusOne: true,
      response: { status: 'attending_plus_one' },
      seating: { tableId: 't1' },
    });
    seatingTable.findFirst.mockResolvedValue({
      id: 't1',
      name: 'Стол 1',
      capacity: 2,
      invitationId: 'inv-1',
      assignments: [seat('g1', 'attending_plus_one', true)],
    });

    await expect(
      assignGuestToTable({
        invitationId: 'inv-1',
        userId: 'user-1',
        guestId: 'g1',
        tableId: 't1',
      })
    ).resolves.toEqual({ tableId: 't1', tableName: 'Стол 1' });
  });
});
