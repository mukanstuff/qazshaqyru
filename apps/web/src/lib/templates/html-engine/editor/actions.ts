'use server';

/**
 * HTML-template editor — server actions.
 *
 * All mutations go through these actions. They run on the server,
 * validate input, write to Prisma, and revalidate Next.js cache.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import { ApiError, requireAuth } from '@/lib/shared/api';
import { getHtmlTemplateDescriptor } from '@/lib/templates/manifests';
import { renderHtmlTemplate } from '@/lib/templates/html-engine';
import type { HtmlTemplateData, Locale } from '@/lib/templates/html-engine/types';
import {
  htmlEditorFieldsSchema,
  slugSchema,
  type SlugAvailabilityResult,
  type HtmlEditorFieldsInput,
} from './schemas';
import type { HtmlEditorFields } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toActionError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Внутренняя ошибка сервера';
}

// ─── Save editor fields ───────────────────────────────────────────────────────

/** Saves all editor fields to the DB (upsert). */
export async function saveHtmlEditorFieldsAction(input: {
  invitationId?: string;
  templateSlug: string;
  fields: HtmlEditorFieldsInput;
}): Promise<{ id: string; slug: string }> {
  const ctx = await requireAuth();

  const parsed = htmlEditorFieldsSchema.safeParse(input.fields);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Ошибка валидации');
  }

  // parsed.data IS the validated fields
  const f = parsed.data;

  // Map editor fields → DB columns
  const groomName = f.groomName;
  const brideName = f.brideName;
  const title = `${groomName} & ${brideName}`;

  // RSVP fields stored in customText
  const customTextData: Record<string, unknown> = {
    groomName,
    brideName,
    greeting: f.greeting || undefined,
    invitationLocale: f.locale,
    whatsappPhone: f.whatsappPhone || undefined,
  };

  // templateData holds design + media fields
  const templateDataData: Record<string, unknown> = {
    backgroundColor: f.backgroundColor || undefined,
    accentColorMode: f.accentColorMode,
    accentColor: f.accentColor || undefined,
    animationType: f.animationType,
    animationDuration: f.animationDuration,
    autoScroll: f.autoScroll,
    showEnvelope: f.showEnvelope,
    fontMode: f.fontMode,
    fontFamily: f.fontFamily || undefined,
    newTextFontMode: f.newTextFontMode,
    newTextFontFamily: f.newTextFontFamily || undefined,
    galleryPhotos: f.galleryPhotos,
    cardTitle: f.cardTitle || undefined,
    cardDescription: f.cardDescription || undefined,
    cardImageUrl: f.cardImageUrl || undefined,
  };

  const mapUrl = f.mapUrl || null;
  const address = f.address || null;
  const eventPlace = f.eventPlace || null;
  const eventDate = new Date(f.eventDate);
  const eventTime = f.eventTime || null;
  const musicUrl = f.musicUrl || null;

  if (input.invitationId) {
    // Update existing invitation
    const existing = await prisma.invitation.findFirst({
      where: { id: input.invitationId, userId: ctx.user.id },
      select: { id: true, slug: true },
    });
    if (!existing) throw new Error('Приглашение не найдено');

    const updated = await prisma.invitation.update({
      where: { id: input.invitationId },
      data: {
        title,
        customText: customTextData,
        templateData: templateDataData,
        mapUrl,
        address,
        eventPlace,
        eventDate,
        eventTime,
        musicUrl,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath(`/invitations/${updated.id}`);
    return { id: updated.id, slug: updated.slug };
  } else {
    // Create new invitation
    const descriptor = getHtmlTemplateDescriptor(input.templateSlug);
    const templateId = descriptor
      ? (await prisma.template.findUnique({ where: { slug: input.templateSlug }, select: { id: true } }))?.id
      : null;

    const invitation = await prisma.invitation.create({
      data: {
        userId: ctx.user.id,
        title,
        templateKey: input.templateSlug,
        templateId: templateId ?? (await prisma.template.findFirst({ select: { id: true } }))?.id ?? '',
        eventType: 'wedding',
        eventDate,
        eventTime,
        eventPlace,
        address,
        eventTimezone: 'Asia/Almaty',
        mapUrl,
        musicUrl,
        customText: customTextData,
        templateData: templateDataData,
        status: 'draft',
      },
    });

    revalidatePath('/dashboard');
    return { id: invitation.id, slug: invitation.slug };
  }
}

// ─── Check slug availability ──────────────────────────────────────────────────

export async function checkSlugAvailabilityAction(
  slug: string,
  invitationId?: string,
): Promise<SlugAvailabilityResult> {
  const ctx = await requireAuth();

  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    return { available: false };
  }

  const existing = await prisma.invitation.findFirst({
    where: {
      slug: parsed.data,
      ...(invitationId ? { id: { not: invitationId } } : {}),
      userId: invitationId ? undefined : ctx.user.id,
    },
    select: { id: true, slug: true },
  });

  if (existing) {
    return { available: false, takenBy: existing.slug };
  }
  return { available: true };
}

// ─── Update slug ──────────────────────────────────────────────────────────────

const updateSlugSchema = z.object({
  invitationId: z.string().uuid(),
  slug: slugSchema,
});

export async function updateSlugAction(input: {
  invitationId: string;
  slug: string;
}): Promise<{ ok: boolean; slug: string; error?: string }> {
  const ctx = await requireAuth();

  const parsed = updateSlugSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, slug: input.slug, error: parsed.error.issues[0]?.message };
  }

  // Check availability
  const availability = await checkSlugAvailabilityAction(parsed.data.slug, parsed.data.invitationId);
  if (!availability.available) {
    return {
      ok: false,
      slug: parsed.data.slug,
      error: 'Этот адрес уже занят',
    };
  }

  // Update slug
  try {
    await prisma.invitation.updateMany({
      where: { id: parsed.data.invitationId, userId: ctx.user.id },
      data: { slug: parsed.data.slug },
    });
    revalidatePath('/dashboard');
    return { ok: true, slug: parsed.data.slug };
  } catch (error) {
    return { ok: false, slug: parsed.data.slug, error: toActionError(error) };
  }
}

// ─── Publish invitation ───────────────────────────────────────────────────────

const publishSchema = z.object({
  invitationId: z.string().uuid(),
});

export async function publishHtmlInvitationAction(input: {
  invitationId: string;
}): Promise<{ ok: boolean; slug: string; error?: string }> {
  const ctx = await requireAuth();

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, slug: '', error: parsed.error.issues[0]?.message };
  }

  try {
    const invitation = await prisma.invitation.findFirst({
      where: { id: parsed.data.invitationId, userId: ctx.user.id },
      select: {
        id: true,
        slug: true,
        status: true,
        groomName: true,
        brideName: true,
        eventDate: true,
        customText: true,
        templateKey: true,
      },
    });
    if (!invitation) return { ok: false, slug: '', error: 'Приглашение не найдено' };

    // Basic validation before publish
    if (!invitation.groomName || !invitation.brideName || !invitation.eventDate) {
      return {
        ok: false,
        slug: invitation.slug,
        error: 'Заполните имена и дату перед публикацией',
      };
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    revalidatePath('/dashboard');
    revalidatePath(`/invitations/${invitation.id}`);
    return { ok: true, slug: invitation.slug };
  } catch (error) {
    return { ok: false, slug: '', error: toActionError(error) };
  }
}

// ─── Unpublish ────────────────────────────────────────────────────────────────

const unpublishSchema = z.object({
  invitationId: z.string().uuid(),
});

export async function unpublishHtmlInvitationAction(input: {
  invitationId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth();

  const parsed = unpublishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  try {
    await prisma.invitation.updateMany({
      where: { id: parsed.data.invitationId, userId: ctx.user.id },
      data: { status: 'draft', publishedAt: null },
    });
    revalidatePath('/dashboard');
    revalidatePath(`/invitations/${parsed.data.invitationId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

// ─── Generate preview HTML (server-side render) ───────────────────────────────

export async function renderHtmlEditorPreviewAction(input: {
  templateSlug: string;
  locale: Locale;
  fields: HtmlEditorFields;
}): Promise<{ ok: boolean; html?: string; error?: string }> {
  const descriptor = getHtmlTemplateDescriptor(input.templateSlug);
  if (!descriptor) {
    return { ok: false, error: 'Шаблон не найден' };
  }

  // Build templateData from editor fields
  const templateData: HtmlTemplateData = {
    locale: input.locale,
    fields: {
      groomName: input.fields.groomName,
      brideName: input.fields.brideName,
      eventDate: input.fields.eventDate,
      eventTime: input.fields.eventTime,
      eventPlace: input.fields.eventPlace,
      address: input.fields.address,
      greeting: input.fields.greeting,
      // Map URL and other fields via computed or custom attrs
    },
    musicUrl: input.fields.musicUrl || null,
    assets: {},
    defaults: {},
  };

  const result = renderHtmlTemplate(descriptor, templateData);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  // Inject design overrides into the HTML (background color, animation, etc.)
  const enhanced = injectDesignOverrides(result.html, input.fields);

  return { ok: true, html: enhanced };
}

/** Inject design overrides as CSS variables in the <head>. */
function injectDesignOverrides(html: string, fields: HtmlEditorFields): string {
  const vars: string[] = [];

  if (fields.backgroundColor) {
    vars.push(`--editor-bg: ${fields.backgroundColor};`);
  }
  if (fields.accentColorMode === 'custom' && fields.accentColor) {
    vars.push(`--editor-accent: ${fields.accentColor};`);
  }
  if (fields.fontMode === 'custom' && fields.fontFamily) {
    vars.push(`--editor-font: '${fields.fontFamily}', serif;`);
  }
  if (fields.animationType !== 'none') {
    vars.push(`--editor-anim: ${fields.animationType};`);
    vars.push(`--editor-anim-dur: ${fields.animationDuration}s;`);
  }
  vars.push(`--editor-scroll: ${fields.autoScroll ? 'auto' : 'manual'};`);
  vars.push(`--editor-envelope: ${fields.showEnvelope ? 'show' : 'hide'};`);

  if (vars.length === 0) return html;

  const css = `:root { ${vars.join(' ')} }`;

  return html.replace(
    /(<head[^>]*>)([\s\S]*?)(<\/head>)/i,
    (_full, open, inner, close) => {
      return `${open}${inner}\n<style>${css}</style>\n${close}`;
    }
  );
}
