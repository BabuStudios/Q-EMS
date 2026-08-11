# Q-EMS — Integrerat ledningssystem för kvalitet & miljö (IMS)

Ett produktionsfärdigt, integrerat ledningssystem för **ISO 9001 (kvalitet)** och
**ISO 14001:2026 (miljö)** i en och samma webbapplikation. Ett gemensamt set av
register, dokument, processer och åtgärder — märkta per disciplin, aldrig två
parallella system.

Byggs fasstyrt. **Denna commit levererar Fas 0 (Grund).**

---

## Teknisk stack

| Område | Val |
|---|---|
| Ramverk | Next.js 15 (App Router, Server Actions), React 19, TypeScript (strict) |
| Databas | PostgreSQL 16 + Prisma ORM |
| Autentisering | Auth.js (NextAuth v5), credentials — arkitekterad för OIDC/SSO |
| UI | Tailwind CSS + shadcn/ui (Radix), lucide-react |
| i18n | next-intl (svenska standard, engelska) |
| Test | Vitest (enhet) + Playwright (e2e) |
| Drift | Docker Compose (app + Postgres + MinIO) |

---

## Kom igång (utveckling)

```bash
# 1. Beroenden
pnpm install

# 2. Miljövariabler
cp .env.example .env          # justera AUTH_SECRET (openssl rand -base64 32)

# 3. Databas: migrera + seed
pnpm prisma migrate dev
pnpm db:seed

# 4. Kör
pnpm dev                      # http://localhost:3000
```

### Demoanvändare (lösenord: `Passw0rd!`)

| E-post | Roll | Behörighet |
|---|---|---|
| `admin@qems.local` | Systemadministratör | Allt, inkl. `/admin` |
| `kma@qems.local` | Ledningssystemsansvarig (KMA) | Admin-panel, användare, spårningslogg |
| `process@qems.local` | Processägare | Läs/skriv innehåll |
| `revisor@qems.local` | Revisor | Läs + spårningslogg |
| `medarbetare@qems.local` | Bidragsgivare | Läs/skriv innehåll |
| `lasare@qems.local` | Endast läs | Endast läs — nekas `/admin` (→ `/403`) |

---

## Drift via Docker Compose (självhostad enkel-org)

```bash
cp .env.example .env          # sätt ett riktigt AUTH_SECRET
docker compose up --build
```

Startar tre tjänster:

- **db** — PostgreSQL 16 (volym `db_data`)
- **minio** — S3-kompatibel fillagring för dokumentbilagor (Fas 2+), konsol på `:9001`
- **app** — kör `prisma migrate deploy` + seed och startar sedan servern på `:3000`

Alternativ drift: Vercel + hanterad Postgres (t.ex. Neon/Supabase). Sätt
`DATABASE_URL` och `AUTH_SECRET` som projektvariabler och kör
`prisma migrate deploy` i build-steget.

---

## Arkitekturprinciper (Fas 0)

- **Enkel-tenant-drift, redo för multi-tenant.** Varje tenant-bunden tabell bär
  `organizationId`. Queries scopas via `getOrgScope()` (`src/lib/rbac.ts`).
  Övergången enkel→multi-tenant = per-request org-upplösning i det lagret,
  **inte** en schemamigrering. Se `docs/multi-tenant.md`.
- **Allt är bevis.** Append-only spårningslogg (`AuditLog`) skrivs av en
  Prisma-klientextension (`src/lib/prisma.ts`) vid varje create/update/soft-delete:
  aktör, entitet, före/efter-diff, tidsstämpel, IP. Aldrig uppdaterad, aldrig raderad.
- **Inga hårda raderingar.** `deletedAt` (soft-delete) på tenant-modeller.
- **RBAC på serversidan.** `requirePermission()` / `requireRole()` upprätthålls
  i varje skyddad sida och server action — aldrig enbart genom att gömma UI.
- **OIDC-redo autentisering.** Edge-säker `auth.config.ts` skild från Node-provider
  i `auth.ts`; att lägga till SSO = pusha en provider, ingen refaktorering.

---

## Verifiering (grindbevis)

Ändliga kommandon (inga blockerande loopar):

```bash
pnpm install
pnpm typecheck        # tsc --noEmit — grön
pnpm lint             # next lint — grön
pnpm build            # produktionsbuild — grön
pnpm test             # Vitest — grön
pnpm tsx scripts/verify-gate.ts   # audit-on-write + credentials + RBAC (kräver DB)
```

> **Not om lockfilen:** `pnpm-lock.yaml` genereras av `pnpm install` och bör
> committas för reproducerbara byggen. I den här miljön är direkt `git push`
> blockerad, så filerna pushades via GitHub-API:t; lockfilen (224 KB, ett
> deterministiskt derivat av `package.json`) återskapas med `pnpm install`.

---

## Fasplan

- [x] **Fas 0 — Grund**: auth, RBAC, spårningslogg, appskal, i18n, Docker.
- [ ] Fas 1 — Plattformsprimitiver (metadata, listor, åtgärder, arbetsflöde, notiser)
- [ ] Fas 2 — Dokumentstyrning
- [ ] Fas 3 — Processkarta
- [ ] Fas 4 — Planeringsregister (ISO-kärnan, inkl. 6.3 Ändringshantering)
- [ ] Fas 5 — Drift & utvärdering (revision, avvikelse/CAPA, ledningens genomgång)
- [ ] Fas 6 — Projektledning
- [ ] Fas 7 — Instrumentpaneler & certifieringsberedskap
- [ ] Fas 8 — Härdning & multi-tenant-beredskap
