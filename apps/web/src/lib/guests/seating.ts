import prisma from '@/lib/shared/db';
import { ApiError } from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';

export type SeatingTableDto = {
  id: string;
  name: string;
  capacity: number;
  sortOrder: number;
  assignedCount: number;
  guestIds: string[];
};

async function assertSeatingEntitled(invitationId: string, userId: string): Promise<void> {
  const pricing = await getInvitationPricing(invitationId, userId);
  if (!pricing) throw new ApiError('not_found', 'Приглашение не найдено', 404);
  if (!pricing.entitlements.seating) {
    throw new ApiError(
      'plan_required',
      'Рассадка доступна на тарифе Стандарт и выше',
      402
    );
  }
}

export async function listSeatingTables(invitationId: string, userId: string): Promise<SeatingTableDto[]> {
  await assertSeatingEntitled(invitationId, userId);
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
    select: { id: true },
  });
  if (!invitation) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }

  const tables = await prisma.seatingTable.findMany({
    where: { invitationId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      assignments: { select: { guestId: true } },
    },
  });

  return tables.map((t) => ({
    id: t.id,
    name: t.name,
    capacity: t.capacity,
    sortOrder: t.sortOrder,
    assignedCount: t.assignments.length,
    guestIds: t.assignments.map((a) => a.guestId),
  }));
}

export async function createSeatingTable(input: {
  invitationId: string;
  userId: string;
  name: string;
  capacity?: number;
}): Promise<SeatingTableDto> {
  await assertSeatingEntitled(input.invitationId, input.userId);
  const invitation = await prisma.invitation.findFirst({
    where: { id: input.invitationId, userId: input.userId },
    select: { id: true },
  });
  if (!invitation) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }

  const name = input.name.trim().slice(0, 80);
  if (!name) {
    throw new ApiError('validation_error', 'Название стола обязательно', 400);
  }

  const capacity = Math.min(50, Math.max(1, input.capacity ?? 10));
  const maxSort = await prisma.seatingTable.aggregate({
    where: { invitationId: input.invitationId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  try {
    const table = await prisma.seatingTable.create({
      data: {
        invitationId: input.invitationId,
        name,
        capacity,
        sortOrder,
      },
    });
    return {
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      sortOrder: table.sortOrder,
      assignedCount: 0,
      guestIds: [],
    };
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
}): Promise<SeatingTableDto> {
  const table = await prisma.seatingTable.findFirst({
    where: { id: input.tableId, invitation: { userId: input.userId } },
    include: { assignments: { select: { guestId: true } } },
  });
  if (!table) {
    throw new ApiError('not_found', 'Стол не найден', 404);
  }
  await assertSeatingEntitled(table.invitationId, input.userId);

  const data: { name?: string; capacity?: number } = {};
  if (input.name !== undefined) {
    const name = input.name.trim().slice(0, 80);
    if (!name) throw new ApiError('validation_error', 'Название стола обязательно', 400);
    data.name = name;
  }
  if (input.capacity !== undefined) {
    data.capacity = Math.min(50, Math.max(1, input.capacity));
    if (data.capacity < table.assignments.length) {
      throw new ApiError(
        'capacity_too_low',
        `За столом уже ${table.assignments.length} гостей — увеличьте вместимость`,
        400
      );
    }
  }

  try {
    const updated = await prisma.seatingTable.update({
      where: { id: input.tableId },
      data,
      include: { assignments: { select: { guestId: true } } },
    });
    return {
      id: updated.id,
      name: updated.name,
      capacity: updated.capacity,
      sortOrder: updated.sortOrder,
      assignedCount: updated.assignments.length,
      guestIds: updated.assignments.map((a) => a.guestId),
    };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      throw new ApiError('duplicate', 'Стол с таким названием уже есть', 409);
    }
    throw err;
  }
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
  const invitation = await prisma.invitation.findFirst({
    where: { id: input.invitationId, userId: input.userId },
    select: { id: true },
  });
  if (!invitation) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }

  const guest = await prisma.guest.findFirst({
    where: { id: input.guestId, invitationId: input.invitationId },
    select: { id: true, seating: { select: { id: true } } },
  });
  if (!guest) {
    throw new ApiError('not_found', 'Гость не найден', 404);
  }

  if (input.tableId === null) {
    if (guest.seating) {
      await prisma.seatingAssignment.delete({ where: { guestId: guest.id } });
    }
    return { tableId: null, tableName: null };
  }

  const table = await prisma.seatingTable.findFirst({
    where: { id: input.tableId, invitationId: input.invitationId },
    include: { _count: { select: { assignments: true } } },
  });
  if (!table) {
    throw new ApiError('not_found', 'Стол не найден', 404);
  }

  const alreadyOnThisTable = guest.seating
    ? await prisma.seatingAssignment.findFirst({
        where: { guestId: guest.id, tableId: table.id },
        select: { id: true },
      })
    : null;

  if (!alreadyOnThisTable && table._count.assignments >= table.capacity) {
    throw new ApiError('table_full', `Стол «${table.name}» заполнен (${table.capacity})`, 400);
  }

  await prisma.seatingAssignment.upsert({
    where: { guestId: guest.id },
    create: { guestId: guest.id, tableId: table.id },
    update: { tableId: table.id },
  });

  return { tableId: table.id, tableName: table.name };
}

export async function getGuestTableName(guestId: string): Promise<string | null> {
  const assignment = await prisma.seatingAssignment.findUnique({
    where: { guestId },
    select: { table: { select: { name: true } } },
  });
  return assignment?.table.name ?? null;
}
