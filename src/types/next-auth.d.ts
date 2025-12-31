import "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      avatarUrl?: string | null;
      sessionVersion?: number;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    sessionVersion?: number;
    invalidated?: boolean;
  }
}
