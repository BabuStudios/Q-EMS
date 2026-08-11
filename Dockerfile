# Q-EMS production image (pnpm-based). Includes tsx so `prisma db seed` works
# inside the container. Build:  docker compose up --build
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
RUN corepack enable
# Prisma needs OpenSSL at build and runtime.
RUN apt-get update -y && apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Dependencies (cached on lockfile) ---
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
# Uses the committed lockfile when present (reproducible); regenerates otherwise.
RUN pnpm install

# --- Build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate && pnpm build

# --- Runtime ---
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["pnpm", "start"]
