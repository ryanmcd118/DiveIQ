import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      image?: string;
      avatarUrl?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    image?: string;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
  }
}


