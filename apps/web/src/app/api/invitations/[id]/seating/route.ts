import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  checkSameOrigin,
  rateLimitResponse,
  requireAuth,
  RATE_LIMITS,
} from '@/lib/shared/api';
import {
  assignGuestToTable,
  createSeatingTable,
  deleteSeatingTable,
  listSeatingTables,
  moveSeatingTables,
  updateSeatingTable,
} from '@/lib/guests/seating';
import {
  TABLE_MAX_CAPACITY,
  TABLE_MIN_CAPACITY,
  tableShapeSchema,
} from '@/lib/guests/seating-layout';

/** #rrggbb only — this value is interpolated into an inline style. */
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Ожидается цвет в формате #rrggbb');
const capacitySchema = z.number().int().min(TABLE_MIN_CAPACITY).max(TABLE_MAX_CAPACITY);
const finiteNumber = z.number().finite();

const createSchema = z.object({
  name: z.string().min(1).max(80),
  capacity: capacitySchema.optional(),
  x: finiteNumber.optional().nullable(),
  y: finiteNumber.optional().nullable(),
  w: finiteNumber.optional().nullable(),
  h: finiteNumber.optional().nullable(),
  rotation: finiteNumber.optional().nullable(),
  shape: tableShapeSchema.optional().nullable(),
  tableColor: colorSchema.optional().nullable(),
});

const updateSchema = z.object({
  tableId: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  capacity: capacitySchema.optional(),
  x: finiteNumber.optional().nullable(),
  y: finiteNumber.optional().nullable(),
  w: finiteNumber.optional().nullable(),
  h: finiteNumber.optional().nullable(),
  rotation: finiteNumber.optional().nullable(),
  shape: tableShapeSchema.optional().nullable(),
  tableColor: colorSchema.optional().nullable(),
});

/** Batched positions after a drag, so moving N tables is one request, not N. */
const moveSchema = z.object({
  moves: z
    .array(
      z.object({
        tableId: z.string().uuid(),
        x: finiteNumber,
        y: finiteNumber,
      })
    )
    .min(1)
    .max(100),
});

const assignSchema = z.object({
  guestId: z.string().uuid(),
  tableId: z.string().uuid().nullable(),
});

const deleteSchema = z.object({
  tableId: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, `seating_get:${ctx.user.id}`, RATE_LIMITS.API_AUTH_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const tables = await listSeatingTables(id, ctx.user.id);
    return NextResponse.json({ tables });
  } catch (error) {
    return apiErrorResponse(error as Error, 'List seating');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }
    const { id } = await params;
    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, `seating:${ctx.user.id}`, RATE_LIMITS.API_SEATING);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });

    if ('guestId' in body) {
      const parsed = assignSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
      }
      const result = await assignGuestToTable({
        invitationId: id,
        userId: ctx.user.id,
        guestId: parsed.data.guestId,
        tableId: parsed.data.tableId,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if ('moves' in body) {
      const parsed = moveSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
      }
      const tables = await moveSeatingTables(id, ctx.user.id, parsed.data.moves);
      return NextResponse.json({ ok: true, tables });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }
    const table = await createSeatingTable({
      invitationId: id,
      userId: ctx.user.id,
      name: parsed.data.name,
      capacity: parsed.data.capacity,
      x: parsed.data.x,
      y: parsed.data.y,
      w: parsed.data.w,
      h: parsed.data.h,
      rotation: parsed.data.rotation,
      shape: parsed.data.shape,
      tableColor: parsed.data.tableColor,
    });
    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Seating mutate');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }
    await params;
    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, `seating:${ctx.user.id}`, RATE_LIMITS.API_SEATING);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const table = await updateSeatingTable({
      tableId: parsed.data.tableId,
      userId: ctx.user.id,
      name: parsed.data.name,
      capacity: parsed.data.capacity,
      x: parsed.data.x,
      y: parsed.data.y,
      w: parsed.data.w,
      h: parsed.data.h,
      rotation: parsed.data.rotation,
      shape: parsed.data.shape,
      tableColor: parsed.data.tableColor,
    });
    return NextResponse.json({ table });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Update seating table');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }
    await params;
    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, `seating:${ctx.user.id}`, RATE_LIMITS.API_SEATING);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    await deleteSeatingTable(parsed.data.tableId, ctx.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Delete seating table');
  }
}
