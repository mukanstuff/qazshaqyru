FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl wget
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=${NEXT_PUBLIC_WHATSAPP_NUMBER}
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm --filter web db:generate
RUN pnpm --filter web build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Production uploads: set S3_* env vars at runtime (R2/AWS). Without them, files use local disk in the container.

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder /app/apps/web/scripts ./apps/web/scripts
COPY --from=builder /app/apps/web/content ./apps/web/content

# Prisma CLI + tsx for migrations/seed in entrypoint
RUN npm install -g prisma@5.22.0 tsx@4.19.0

COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY docker-scheduler.sh /docker-scheduler.sh
RUN chmod +x /docker-entrypoint.sh /docker-scheduler.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

WORKDIR /app/apps/web
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
