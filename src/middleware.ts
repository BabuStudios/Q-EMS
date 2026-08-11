import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge middleware uses the Node-free config. The `authorized` callback in
// authConfig performs coarse route gating; fine-grained RBAC is server-side.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
