import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Helper function to extract firstName and lastName from Google profile
function extractNamesFromGoogleProfile(
  profile: any,
  user: any
): { firstName: string | null; lastName: string | null } {
  // Prefer given_name and family_name from profile if available
  if (profile?.given_name && profile?.family_name) {
    return {
      firstName: profile.given_name.trim(),
      lastName: profile.family_name.trim(),
    };
  }

  // Fallback: split the full name if provided
  const fullName = profile?.name || user?.name || "";
  if (fullName) {
    const trimmed = fullName.trim();
    if (trimmed) {
      const nameParts = trimmed.split(/\s+/);
      if (nameParts.length === 1) {
        return {
          firstName: nameParts[0],
          lastName: null,
        };
      } else {
        // First token is firstName, rest joined as lastName (preserves compound names like "Van Dyke")
        return {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
        };
      }
    }
  }

  // If no name available, return null for both
  return {
    firstName: null,
    lastName: null,
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
    signOut: "/",
    error: "/signin", // NextAuth redirects here on errors, will add error query param
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only handle Google OAuth sign-in
      if (account?.provider === "google") {
        try {
          const googleEmail = user.email;
          const googleId = account.providerAccountId;
          const googleImage = user.image;
          const { firstName, lastName } = extractNamesFromGoogleProfile(
            profile,
            user
          );

          if (!googleEmail) {
            return false; // Cannot proceed without email
          }

          // Check if an Account with this Google ID already exists
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: googleId,
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          });

          if (existingAccount) {
            // User already linked with Google, sign them in
            // Backfill firstName/lastName if missing
            // Import Google avatar if avatarUrl is empty
            const existingUser = existingAccount.user;
            const updateData: {
              firstName?: string | null;
              lastName?: string | null;
              avatarUrl?: string | null;
            } = {};

            if (
              (!existingUser.firstName || !existingUser.lastName) &&
              (firstName || lastName)
            ) {
              if (!existingUser.firstName && firstName) {
                updateData.firstName = firstName;
              }
              if (!existingUser.lastName && lastName) {
                updateData.lastName = lastName;
              }
            }

            // Import Google avatar only if avatarUrl is currently null/empty
            if (!existingUser.avatarUrl && googleImage) {
              updateData.avatarUrl = googleImage;
              if (process.env.NODE_ENV === "development") {
                console.log(
                  "[NextAuth] Importing Google avatar for existing user:",
                  existingUser.id
                );
              }
            }

            if (Object.keys(updateData).length > 0) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: updateData,
              });
              if (
                process.env.NODE_ENV === "development" &&
                updateData.avatarUrl
              ) {
                console.log(
                  "[NextAuth] Successfully imported Google avatar to DB"
                );
              }
            }
            user.id = existingUser.id;
            return true;
          }

          // Check if a User with this email already exists (email linking)
          const existingUser = await prisma.user.findUnique({
            where: {
              email: googleEmail,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          });

          if (existingUser) {
            // Link Google account to existing user
            // Backfill firstName/lastName if missing
            // Import Google avatar if avatarUrl is empty
            const updateData: {
              firstName?: string | null;
              lastName?: string | null;
              avatarUrl?: string | null;
            } = {};
            if (!existingUser.firstName && firstName) {
              updateData.firstName = firstName;
            }
            if (!existingUser.lastName && lastName) {
              updateData.lastName = lastName;
            }

            // Import Google avatar only if avatarUrl is currently null/empty
            if (!existingUser.avatarUrl && googleImage) {
              updateData.avatarUrl = googleImage;
              if (process.env.NODE_ENV === "development") {
                console.log(
                  "[NextAuth] Importing Google avatar for existing user (email link):",
                  existingUser.id
                );
              }
            }

            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: "oauth",
                provider: "google",
                providerAccountId: googleId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at
                  ? Math.floor(account.expires_at / 1000)
                  : null,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });

            // Update user names and avatar if needed
            if (Object.keys(updateData).length > 0) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: updateData,
              });
              if (
                process.env.NODE_ENV === "development" &&
                updateData.avatarUrl
              ) {
                console.log(
                  "[NextAuth] Successfully imported Google avatar to DB (email link)"
                );
              }
            }

            user.id = existingUser.id;
            return true;
          }

          // Create new user with Google account
          // Set avatarUrl from Google image (preferred over image field)
          const newUser = await prisma.user.create({
            data: {
              email: googleEmail,
              firstName,
              lastName,
              image: googleImage,
              avatarUrl: googleImage || null, // Set avatarUrl from Google image
              emailVerified: new Date(),
              accounts: {
                create: {
                  type: "oauth",
                  provider: "google",
                  providerAccountId: googleId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at
                    ? Math.floor(account.expires_at / 1000)
                    : null,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              },
            },
          });
          if (process.env.NODE_ENV === "development" && googleImage) {
            console.log(
              "[NextAuth] Created new user with Google avatar:",
              newUser.id
            );
          }
          user.id = newUser.id;
          return true;
        } catch (error) {
          console.error("Google OAuth sign-in error:", error);
          return false;
        }
      }

      // For credentials provider, allow sign-in
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        // Always set token.id from user.id (this is critical)
        token.id = user.id;
        token.email = user.email;
        // For credentials provider, user object has firstName/lastName from authorize
        // For OAuth providers, we need to fetch from DB
        if ("firstName" in user && "lastName" in user) {
          token.firstName = user.firstName as string | null;
          token.lastName = user.lastName as string | null;
          token.avatarUrl = (user as any).avatarUrl as
            | string
            | null
            | undefined;
        } else if (user.id) {
          // Fetch user from DB to get firstName/lastName/avatarUrl/sessionVersion (for OAuth providers)
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
              sessionVersion: true,
            },
          });
          if (dbUser) {
            token.firstName = dbUser.firstName;
            token.lastName = dbUser.lastName;
            token.avatarUrl = dbUser.avatarUrl;
            token.sessionVersion = (dbUser as any).sessionVersion ?? 0;
          }
        }

        // For credentials provider, also fetch sessionVersion from DB
        if (user.id && "firstName" in user) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { sessionVersion: true },
          });
          if (dbUser) {
            token.sessionVersion = (dbUser as any).sessionVersion ?? 0;
          }
        }
      }

      // Check sessionVersion on every JWT callback (not just on sign-in)
      // This invalidates tokens when sessionVersion is bumped (e.g., after password change)
      if (token.id) {
        const userId = token.id as string;
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { sessionVersion: true },
        });

        if (!dbUser) {
          // User doesn't exist, mark token as invalidated but return token object
          token.invalidated = true;
          return token;
        }

        const tokenVersion = (token.sessionVersion as number) ?? -1;
        const dbVersion = (dbUser as any).sessionVersion ?? 0;

        if (tokenVersion !== dbVersion) {
          // Session version mismatch - token is invalid, mark as invalidated
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[NextAuth JWT] Session version mismatch for user ${userId}: token=${tokenVersion}, db=${dbVersion}`
            );
          }
          token.invalidated = true;
          return token;
        }

        // Ensure token has current sessionVersion and is not invalidated
        token.sessionVersion = dbVersion;
        token.invalidated = false;
      }

      // If token has no id, mark as invalidated but still return token object
      if (!token.id && !token.sub) {
        token.invalidated = true;
      }

      // When session is updated (e.g., after avatar upload)
      if (trigger === "update") {
        // Check for avatarUrl in multiple possible shapes from update() call
        let newAvatarUrl: string | null | undefined = undefined;

        // Shape 1: update({ avatarUrl: "..." })
        if ((user as any)?.avatarUrl !== undefined) {
          newAvatarUrl = (user as any).avatarUrl as string | null | undefined;
        }
        // Shape 2: update({ user: { avatarUrl: "..." } })
        else if ((user as any)?.user?.avatarUrl !== undefined) {
          newAvatarUrl = (user as any).user.avatarUrl as
            | string
            | null
            | undefined;
        }
        // Shape 3: update({ session: { avatarUrl: "..." } })
        else if ((user as any)?.session?.avatarUrl !== undefined) {
          newAvatarUrl = (user as any).session.avatarUrl as
            | string
            | null
            | undefined;
        }

        if (newAvatarUrl !== undefined) {
          token.avatarUrl = newAvatarUrl;
          if (process.env.NODE_ENV === "development") {
            console.log(
              "[NextAuth JWT] Updated avatarUrl from update() call:",
              newAvatarUrl
            );
          }
        } else if (token.id) {
          // Fallback: re-fetch avatarUrl from DB to ensure it's up to date
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { avatarUrl: true },
          });
          if (dbUser) {
            token.avatarUrl = dbUser.avatarUrl;
            if (process.env.NODE_ENV === "development") {
              console.log(
                "[NextAuth JWT] Fetched avatarUrl from DB:",
                dbUser.avatarUrl
              );
            }
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Always return a session object - never return null
      // If session is missing, return unchanged (NextAuth will handle)
      if (!session) {
        return session;
      }

      // If token is invalidated or missing, return session unchanged
      // Proxy will handle enforcement and redirects
      if ((token as any)?.invalidated || !token || (!token.id && !token.sub)) {
        return session;
      }

      // Ensure session.user exists before populating
      if (!session.user) {
        session.user = {
          id: "",
          email: "",
          firstName: null,
          lastName: null,
        };
      }

      // Populate session.user from token
      session.user.id = (token.id || token.sub) as string;
      session.user.email = (token.email || session.user.email || "") as string;
      session.user.firstName = token.firstName as string | null;
      session.user.lastName = token.lastName as string | null;
      session.user.avatarUrl =
        (token.avatarUrl as string | null | undefined) || null;
      session.user.sessionVersion = (token.sessionVersion as number) ?? 0;

      if (process.env.NODE_ENV === "development") {
        console.log("[NextAuth Session] token.avatarUrl:", token.avatarUrl);
        console.log(
          "[NextAuth Session] session.user.avatarUrl:",
          session.user.avatarUrl
        );
        console.log("[NextAuth Session] sessionVersion:", token.sessionVersion);
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
