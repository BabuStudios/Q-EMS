import type { NextAuthConfig } from "next-auth";
import type { PermissionKey } from "@/lib/roles";

/**
 * Edge-safe Auth.js config. Holds NO Node-only dependencies (no Prisma, no
 * bcrypt) so it can run in middleware. Providers that need Node (Credentials)
 * are attached in `auth.ts`. To add OIDC/SSO later, push a provider into
 * `auth.ts` `providers` — no change here is required.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    // Carry RBAC + tenant data on the JWT so middleware and server guards can
    // authorize without a DB round-trip on every request.
    jwt({ token, user }) {
      if (user) {
        token.organizationId = user.organizationId;
        token.roleKey = user.roleKey;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.organizationId = token.organizationId as string;
        session.user.roleKey = (token.roleKey as string | null) ?? null;
        session.user.permissions =
          (token.permissions as PermissionKey[] | undefined) ?? [];
      }
      return session;
    },
    // Coarse route gating for middleware. Fine-grained, row-level RBAC is
    // enforced server-side in actions/guards (never trust the UI).
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";

      if (isPublic) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
