import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db } from "./lib/prisma";
import type { PermissionKey } from "./lib/roles";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Credentials today. To add OIDC/SSO, append a provider here — the rest of
    // the system (callbacks, guards, session shape) is already provider-agnostic.
    Credentials({
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await db.user.findFirst({
          where: { email, deletedAt: null, isActive: true },
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const permissions: PermissionKey[] =
          user.role?.permissions.map((rp) => rp.permission.key as PermissionKey) ??
          [];

        // Best-effort last-login stamp (audited via the Prisma extension).
        await db.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => undefined);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          organizationId: user.organizationId,
          roleKey: user.role?.key ?? null,
          permissions,
        };
      },
    }),
  ],
});
