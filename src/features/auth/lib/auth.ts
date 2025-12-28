import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
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
          name: user.name,
          image: user.image,
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
          const googleName = user.name || "";
          const googleImage = user.image;

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
              user: true,
            },
          });

          if (existingAccount) {
            // User already linked with Google, sign them in
            user.id = existingAccount.user.id;
            return true;
          }

          // Check if a User with this email already exists (email linking)
          const existingUser = await prisma.user.findUnique({
            where: {
              email: googleEmail,
            },
          });

          if (existingUser) {
            // Link Google account to existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: "oauth",
                provider: "google",
                providerAccountId: googleId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at ? Math.floor(account.expires_at / 1000) : null,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
            user.id = existingUser.id;
            return true;
          }

          // Create new user with Google account
          const newUser = await prisma.user.create({
            data: {
              email: googleEmail,
              name: googleName,
              image: googleImage,
              emailVerified: new Date(),
              accounts: {
                create: {
                  type: "oauth",
                  provider: "google",
                  providerAccountId: googleId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at ? Math.floor(account.expires_at / 1000) : null,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              },
            },
          });
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

