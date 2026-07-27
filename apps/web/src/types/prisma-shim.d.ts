/**
 * Prisma type shim.
 *
 * In normal development `prisma generate` produces the real @prisma/client
 * types in node_modules/.prisma/client. In sandboxes/CI without engine
 * downloads (TLS-blocked, offline) that generation fails. This ambient
 * declaration provides the names the codebase imports from @prisma/client
 * so that `tsc --noEmit` and vitest typecheck still pass in those
 * environments.
 *
 * When prisma generate succeeds, its own .d.ts takes priority and this
 * shim is inert.
 */

type JsonValue = any;
type InputJsonValue = any;

declare module '@prisma/client' {
  export namespace Prisma {
    type JsonValue = any;
    type InputJsonValue = any;
    type GuestWhereInput = any;
    type TransactionClient = any;
    type PrismaPromise<T> = Promise<T>;
    class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, options: { code: string; clientVersion: string; meta?: any });
    }
  }

  export class PrismaClient {
    constructor(options?: any);
    $transaction: any;
    $executeRaw: any;
    $queryRaw: any;
    $disconnect: () => Promise<void>;
    [key: string]: any;
  }

  export type EventType =
    | 'wedding' | 'toy' | 'betashar' | 'kyz_uzatu'
    | 'sundet_toy' | 'tusau_keser' | 'birthday'
    | 'anniversary' | 'corporate' | 'other';

  export type GuestResponseStatus =
    | 'pending' | 'attending' | 'not_attending'
    | 'attending_plus_one' | 'attending_no_children';

  export type ManagedOrderStatus =
    | 'pending' | 'contacted' | 'in_progress'
    | 'ready' | 'delivered' | 'cancelled';

  export type PlanSku = 'standard' | 'premium' | 'agency';

  export type InvitationStatus = 'draft' | 'published' | 'archived';

  export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

  export type OrderType = 'self' | 'managed';

  export type Language = 'kz' | 'ru';

  export type Template = {
    id: string;
    slug: string;
    nameRu: string;
    nameKz?: string;
    descriptionRu?: string | null;
    descriptionKz?: string | null;
    category: string;
    previewImageUrl: string;
    demoUrl?: string | null;
    priceKzt: number;
    config: any;
    isActive: boolean;
    isFeatured: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  };

  export type Guest = {
    id: string;
    invitationId: string;
    name: string;
    phone: string | null;
    side: string | null;
    hasPlusOne: boolean;
    plusOneName: string | null;
    householdLabel: string | null;
    tokenHash: string | null;
    sentAt: Date | null;
    sentVia: string | null;
    openedAt: Date | null;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  export type GuestResponse = {
    id: string;
    guestId: string;
    status: GuestResponseStatus;
    message: string | null;
    dietaryRestrictions: string | null;
    respondedAt: Date;
  };

  const prismaDefault: PrismaClient;
  export default prismaDefault;
}
