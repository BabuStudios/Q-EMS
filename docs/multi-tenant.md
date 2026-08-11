# Enkel-tenant → multi-tenant: en konfigurationsomkoppling, inte en schemaändring

Systemet driftas idag för **en** organisation men är byggt multi-tenant-redo
från dag ett. Denna notering (utökas i Fas 8) visar varför övergången till SaaS
är konfiguration, inte en ombyggnad.

## Vad som redan finns

1. **`organizationId` på varje tenant-bunden tabell.** `User`, `Role`,
   `AuditLog`, `Notification` (och alla register i senare faser) bär redan
   kolumnen med index. Ingen tabell antar en global org.

2. **Ett scope-lager.** All tenant-bunden läsning/skrivning går genom
   `getOrgScope()` (`src/lib/rbac.ts`), som idag returnerar den inloggade
   användarens `organizationId`. Queries filtrerar på detta värde, t.ex.
   `db.user.count({ where: { organizationId: orgId, deletedAt: null } })`.

3. **Org bärs på sessionen/JWT.** `session.user.organizationId` sätts vid
   inloggning och färdas på token — ingen global "current org"-singleton.

## Vad omkopplingen till multi-tenant innebär

| Steg | Idag (enkel-tenant) | SaaS (multi-tenant) |
|---|---|---|
| Org-provisionering | Seed skapar en org | Självbetjänings-onboarding skapar orgar |
| Org-upplösning per request | Sessionens `organizationId` | Subdomän/route → org, verifierad mot medlemskap |
| Scope-lager | `getOrgScope()` returnerar sessionens org | Samma funktion, upplöser per request |
| Schema | — | **Oförändrat** |

Eftersom varje query redan går genom scope-lagret och varje rad redan har
`organizationId`, byter man endast ut *hur* `getOrgScope()` bestämmer aktuell
org. Inga kolumner läggs till, inga data-migrationer krävs.

## Att göra i Fas 8

- Middleware som upplöser org från värdnamn/subdomän och validerar medlemskap.
- Org-provisionerings-UI + inbjudningsflöde.
- Rad-nivå-tester som säkerställer att ingen query läcker mellan orgar.
- Dokumentera OIDC/SSO-vägen per org (provider pushas i `auth.ts`).
