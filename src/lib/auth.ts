import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";



export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email.toLowerCase();
        
        const user = await prisma.user.findUnique({
          where: { email }
        });
        
        if (!user) return null;

        // If the user was created before passwords were required, 
        // they won't have one. In production, they'd need a password reset.
        if (user.password) {
          const bcrypt = require("bcryptjs");
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
        }

        // Prevent cross-portal auth vulnerability
        // Check if the user is trying to access a portal they don't have the role for
        const reqBody = (req as any)?.body;
        const callbackUrl = (typeof reqBody?.callbackUrl === 'string') ? reqBody.callbackUrl : '';
        
        // Use either an explicit loginType (if provided by UI in the future) or the callbackUrl
        const isTryingDoctor = callbackUrl.includes('/doctor') || (credentials as any)?.loginType === 'DOCTOR';
        const isTryingAdmin = callbackUrl.includes('/admin') || (credentials as any)?.loginType === 'ADMIN';

        if (isTryingDoctor && user.role !== 'DOCTOR') {
          throw new Error("Unauthorized portal access.");
        }
        
        if (isTryingAdmin && user.role !== 'ADMIN') {
          throw new Error("Unauthorized portal access.");
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_for_development",
};
