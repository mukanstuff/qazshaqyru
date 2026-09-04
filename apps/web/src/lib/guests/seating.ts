import prisma from '@/lib/shared/db';
import { ApiError } from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import { expectedSeatsForRsvpStatus } from '@/lib/guests/headcount';
import {
  clampTablePosition,
  clampTableSize,
  DEFAULT_TABLE,
  HALL_OBJECT_MAX_SIZE,
  isHallObject,
  normalizeTableShape,
  TABLE_MAX_CAPACITY,
  TABLE_MIN_CAPACITY,
  type TableShape,
} from '@/lib/guests/seating-layout';

export type SeatingTableDto = {
  id: string;
  name: string;
  capacity: number;
  sortOrder: number;
  /** Number of guest rows at this table. */
  assignedCount: number;
  /** Chairs those guests actually need — a plus-one guest costs two. */
  seatsTaken: number;
  guestIds: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  shape: TableShape;
  tableColor: string;
};

type TableWithAssignments = {
  id: string;
  name: string;
  capacity: number;
  sortOrder: number;
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  rotation: number | null;
  shape: string | null;
  tableColor: string | null;
  assignments: Array<{
    guestId: string;
    guest?: { hasPlusOne: boolean; response: { status: string } | null } | null;
  }>;
};

/** Chairs consumed by the guests sitting at a table. */
export function seatsTakenBy(
  assignments: Array<{ guest?: { hasPlusOne: boolean; response: { status: string } | null } | null }>
): number {
  return assignments.reduce(
    (sum, a) =>
      sum +
      (a.guest
        ? expectedSeatsForRsvpStatus(a.guest.response?.status ?? 'pending', a.guest.hasPlusOne)
        : 1),
    0
  );
}

const assignmentInclude = {
  select: {
    guestId: true,
    guest: { select: { hasPlusOne: true, response: { select: { status: true } } } },
  },
} as const;

function toDto(t: TableWithAssignments): SeatingTableDto {
  const shape = normalizeTableShape(t.shape);
  // A stage is wider than any table is allowed to be, so the read-side clamp
  // has to know which of the two it is holding — otherwise every fixture comes
  // back shrunk to the table maximum.
  const maxSize = isHallObject(shape) ? HALL_OBJECT_MAX_SIZE : undefined;
  const w = clampTableSize(t.w, DEFAULT_TABLE.w, maxSize);
  const h = clampTableSize(t.h, DEFAULT_TABLE.h, maxSize);
  const { x, y } = clampTablePosition(t.x, t.y, w, h);
  return {
    id: t.id,
    name: t.name,
    capacity: t.capacity,
    sortOrder: t.sortOrder,
    assignedCount: t.assignments.length,
    seatsTaken: seatsTakenBy(t.assignments),
    guestIds: t.assignments.map((a) => a.guestId),
    x,
    y,
    w,
    h,
    rotation: t.rotation ?? 0,
    shape,
    tableColor: t.tableColor ?? DEFAULT_TABLE.color,
  };
}

async function assertSeatingEntitled(invitationId: string, userId: string): Promise<void> {
  const pricing = await getInvitationPricing(invitationId, userId);
  if (!pricing) throw new ApiError('not_found', 'Приглашение не найдено', 404);
  if (!pricing.fullAccess && !pricing.entitlements.seating) {
    throw new ApiError(
      'plan_required',
      'Рассадка доступна после оплаты цены шаблона',
      402
    );
  }
}

export async function listSeatingTables(invitationId: string, userId: string): Promise<SeatingTableDto[]> {
  // assertSeatingEntitled already resolves the invitation for this user, so a
  // separate ownership query here would be a second round-trip proving the
  // same fact.
  await assertSeatingEntitled(invitationId, userId);

  const tables = (await prisma.seatingTable.findMany({
    where: { invitationId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { assignments: assignmentInclude },
  })) as unknown as TableWithAssignments[];

  return tables.map(toDto);
}

export async function createSeatingTable(input: {
  invitationId: string;
  userId: string;
  name: string;
  capacity?: number;
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
  rotation?: number | null;
  shape?: string | null;
  tableColor?: string | null;
}): Promise<SeatingTableDto> {
  await assertSeatingEntitled(input.invitationId, input.userId);

  const name = input.name.trim().slice(0, 80);
  if (!name) {
    throw new ApiError('validation_error', 'Название стола обязательно', 400);
  }

  // Fixtures (stage, dance floor, bar, entrance) are rows in this table too,
  // but they seat nobody — capacity 0 is what keeps them out of every seat
  // count and out of the assignment path.
  const shape = normalizeTableShape(input.shape);
  const fixture = isHallObject(shape);

  const capacity = fixture
    ? 0
    : Math.min(
        TABLE_MAX_CAPACITY,
        Math.max(TABLE_MIN_CAPACITY, input.capacity ?? DEFAULT_TABLE.capacity)
      );
  const maxSort = await prisma.seatingTable.aggregate({
    where: { invitationId: input.invitationId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const maxSize = fixture ? HALL_OBJECT_MAX_SIZE : undefined;
  const w = clampTableSize(input.w, DEFAULT_TABLE.w, maxSize);
  const h = clampTableSize(input.h, DEFAULT_TABLE.h, maxSize);
  const { x, y } = clampTablePosition(input.x, input.y, w, h);

  try {
    const table = (await prisma.seatingTable.create({
      data: {
        invitationId: input.invitationId,
        name,
        capacity,
        sortOrder,
        x,
        y,
        w,
        h,
        rotation: input.rotation ?? 0,
        shape,
        tableColor: input.tableColor ?? DEFAULT_TABLE.color,
      },
    })) as unknown as Omit<TableWithAssignments, 'assignments'>;
    return toDto({ ...table, assignments: [] });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      throw new ApiError('duplicate', 'Стол с таким названием уже есть', 409);
    }
    throw err;
  }
}

export async function updateSeatingTable(input: {
  tableId: string;
  userId: string;
  name?: string;
  capacity?: number;
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
  rotation?: number | null;
  shape?: string | null;
  tableColor?: string | null;
}): Promise<SeatingTableDto> {
  const table = (await prisma.seatingTable.findFirst({
    where: { id: input.tableId, invitation: { userId: input.userId } },
    include: { assignments: assignmentInclude },
  })) as unknown as (TableWithAssignments & { invitationId: string }) | null;
  if (!table) {
    throw new ApiError('not_found', 'Стол не найден', 404);
  }
  await assertSeatingEntitled(table.invitationId, input.userId);

  const data: Record<string, unknown> = {};

  /*
   * A row is a fixture or a table, and the two have different rules. The shape
   * being written wins over the stored one, so converting a table into a stage
   * drops its capacity to zero in the same request — but only once it is empty,
   * because a stage with four guests assigned to it is not a thing.
   */
  const nextShape = input.shape !== undefined ? normalizeTableShape(input.shape) : normalizeTableShape(table.shape);
  const fixture = isHallObject(nextShape);
  if (fixture && table.assignments.length > 0) {
    throw new ApiError(
      'validation_error',
      'Сначала пересадите гостей — объект зала не вмещает гостей',
      400
    );
  }

  if (input.name !== undefined) {
    const name = input.name.trim().slice(0, 80);
    if (!name) throw new ApiError('validation_error', 'Название стола обязательно', 400);
    data.name = name;
  }
  if (fixture) {
    data.capacity = 0;
  } else if (input.capacity !== undefined) {
    const capacity = Math.min(
      TABLE_MAX_CAPACITY,
      Math.max(TABLE_MIN_CAPACITY, input.capacity)
    );
    // Compare against chairs in use, not guest rows: a plus-one guest needs
    // two, so counting rows let capacity be shrunk below what's actually seated.
    const seated = seatsTakenBy(table.assignments);
    if (capacity < seated) {
      throw new ApiError(
        'capacity_too_low',
        `За столом уже занято мест: ${seated} — увеличьте вместимость`,
        400
      );
    }
    data.capacity = capacity;
  } else if (table.capacity < TABLE_MIN_CAPACITY) {
    // Turning a fixture back into a table: it stored capacity 0, which is not
    // a legal table, so it gets the default rather than a chair-less table.
    data.capacity = DEFAULT_TABLE.capacity;
  }

  const maxSize = fixture ? HALL_OBJECT_MAX_SIZE : undefined;
  const nextW =
    input.w !== undefined
      ? clampTableSize(input.w, table.w ?? DEFAULT_TABLE.w, maxSize)
      : (table.w ?? DEFAULT_TABLE.w);
  const nextH =
    input.h !== undefined
      ? clampTableSize(input.h, table.h ?? DEFAULT_TABLE.h, maxSize)
      : (table.h ?? DEFAULT_TABLE.h);
  if (input.w !== undefined) data.w = nextW;
  if (input.h !== undefined) data.h = nextH;

  if (input.x !== undefined || input.y !== undefined) {
    const pos = clampTablePosition(
      input.x !== undefined ? input.x : table.x,
      input.y !== undefined ? input.y : table.y,
      nextW,
      nextH
    );
    data.x = pos.x;
    data.y = pos.y;
  }

  if (input.rotation !== undefined) {
    const r = typeof input.rotation === 'number' && Number.isFinite(input.rotation) ? input.rotation : 0;
    data.rotation = ((r % 360) + 360) % 360;
  }
  if (input.shape !== undefined) data.shape = nextShape;
  if (input.tableColor !== undefined) data.tableColor = input.tableColor ?? DEFAULT_TABLE.color;

  try {
    const updated = (await prisma.seatingTable.update({
      where: { id: input.tableId },
      data,
      include: { assignments: assignmentInclude },
    })) as unknown as TableWithAssignments;
    return toDto(updated);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      throw new ApiError('duplicate', 'Стол с таким названием уже есть', 409);
    }
    throw err;
  }
}

/**
 * Persist positions for several tables at once. Dragging is the single most
 * frequent write in the plan editor, and one request per table would put a
 * burst through the rate limiter for what is logically one edit.
 */
export async function moveSeatingTables(
  invitationId: string,
  userId: string,
  moves: Array<{ tableId: string; x: number; y: number }>
): Promise<SeatingTableDto[]> {
  await assertSeatingEntitled(invitationId, userId);

  const ids = moves.map((m) => m.tableId);
  const owned = (await prisma.seatingTable.findMany({
    where: { id: { in: ids }, invitationId },
    select: { id: true, w: true, h: true },
  })) as Array<{ id: string; w: number | null; h: number | null }>;

  const sizeById = new Map(owned.map((t) => [t.id, t]));
  // Silently ignoring unknown ids would let a typo look like a successful save.
  const unknown = ids.filter((id) => !sizeById.has(id));
  if (unknown.length > 0) {
    throw new ApiError('not_found', 'Стол не найден', 404);
  }

  type PrismaTx = any;
  await prisma.$transaction(async (tx: PrismaTx) => {
    for (const move of moves) {
      const size = sizeById.get(move.tableId)!;
      const w = clampTableSize(size.w, DEFAULT_TABLE.w);
      const h = clampTableSize(size.h, DEFAULT_TABLE.h);
      const { x, y } = clampTablePosition(move.x, move.y, w, h);
      await tx.seatingTable.update({ where: { id: move.tableId }, data: { x, y } });
    }
  });

  return listSeatingTables(invitationId, userId);
}

export async function deleteSeatingTable(tableId: string, userId: string): Promise<void> {
  const table = await prisma.seatingTable.findFirst({
    where: { id: tableId, invitation: { userId } },
    select: { id: true, invitationId: true },
  });
  if (!table) {
    throw new ApiError('not_found', 'Стол не найден', 404);
  }
  await assertSeatingEntitled(table.invitationId, userId);
  await prisma.seatingTable.delete({ where: { id: tableId } });
}

/**
 * Assign guest to table (or clear when tableId is null).
 * Enforces capacity and same-invitation ownership.
 */
export async function assignGuestToTable(input: {
  invitationId: string;
  userId: string;
  guestId: string;
  tableId: string | null;
}): Promise<{ tableId: string | null; tableName: string | null }> {
  await assertSeatingEntitled(input.invitationId, input.userId);

  const guest = (await prisma.guest.findFirst({
    where: { id: input.guestId, invitationId: input.invitationId },
    select: {
      id: true,
      hasPlusOne: true,
      response: { select: { status: true } },
      seating: { select: { tableId: true } },
    },
  })) as {
    id: string;
    hasPlusOne: boolean;
    response: { status: string } | null;
    seating: { tableId: string } | null;
  } | null;
  if (!guest) {
    throw new ApiError('not_found', 'Гость не найден', 404);
  }

  if (input.tableId === null) {
    if (guest.seating) {
      await prisma.seatingAssignment.delete({ where: { guestId: guest.id } });
    }
    return { tableId: null, tableName: null };
  }

  const targetTableId = input.tableId;

  // Read-check-write in one transaction: the capacity check and the upsert
  // used to be separate statements, so two assignments racing each other could
  // both pass the check and overfill the table.
  type PrismaTx = any;
  return prisma.$transaction(async (tx: PrismaTx) => {
    const table = (await tx.seatingTable.findFirst({
      where: { id: targetTableId, invitationId: input.invitationId },
      include: { assignments: assignmentInclude },
    })) as TableWithAssignments | null;
    if (!table) {
      throw new ApiError('not_found', 'Стол не найден', 404);
    }
    // A fixture has capacity 0, so the check below would already reject this —
    // but with "не хватает мест", which is a nonsense reason to be told about
    // the dance floor.
    if (isHallObject(normalizeTableShape(table.shape))) {
      throw new ApiError('validation_error', 'В объект зала нельзя посадить гостя', 400);
    }

    const alreadyHere = guest.seating?.tableId === table.id;
    if (!alreadyHere) {
      // Chairs, not rows: a guest bringing a plus-one occupies two seats, so
      // counting assignment rows let a 10-seat table hold 20 actual people.
      const taken = seatsTakenBy(table.assignments);
      const needed = expectedSeatsForRsvpStatus(
        guest.response?.status ?? 'pending',
        guest.hasPlusOne
      );
      if (taken + needed > table.capacity) {
        throw new ApiError(
          'table_full',
          `За столом «${table.name}» не хватает мест: занято ${taken} из ${table.capacity}`,
          400
        );
      }
    }

    await tx.seatingAssignment.upsert({
      where: { guestId: guest.id },
      create: { guestId: guest.id, tableId: table.id },
      update: { tableId: table.id },
    });

    return { tableId: table.id, tableName: table.name };
  });
}

export async function getGuestTableName(guestId: string): Promise<string | null> {
  const assignment = await prisma.seatingAssignment.findUnique({
    where: { guestId },
    select: { table: { select: { name: true } } },
  });
  return assignment?.table.name ?? null;
}
