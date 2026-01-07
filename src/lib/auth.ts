import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Save GitHub username when user signs in
      if (account?.provider === "github" && profile) {
        // Use upsert to handle both new and existing users
        await prisma.user.upsert({
          where: { email: user.email! },
          update: {
            githubUsername: (profile as any).login,
          },
          create: {
            email: user.email!,
            name: user.name,
            image: user.image,
            githubUsername: (profile as any).login,
          },
        });
      }
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
    async jwt({ token, account }) {
      // Save access token to JWT
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true, // Trust the host headers in serverless environments
});
