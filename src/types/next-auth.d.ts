import type { DefaultSession } from "next-auth";
import type { PermissionKey } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      roleKey: string | null;
      permissions: PermissionKey[];
    } & DefaultSession["user"];
  }

  interface User {
    organizationId: string;
    roleKey: string | null;
    permissions: PermissionKey[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId: string;
    roleKey: string | null;
    permissions: PermissionKey[];
  }
}
