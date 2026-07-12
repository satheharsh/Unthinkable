import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Mock Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // Mock DB lookup based on email
        const email = credentials.email.toLowerCase();
        
        if (email === "patient@example.com") {
          return { id: "user_1", name: "Jane Patient", email, role: "PATIENT" };
        } else if (email === "doctor@example.com") {
          return { id: "doc_1", name: "Dr. Sarah Smith", email, role: "DOCTOR" };
        } else if (email === "admin@example.com") {
          return { id: "admin_1", name: "System Admin", email, role: "ADMIN" };
        }
        
        // If not one of the pre-defined accounts, default to PATIENT for testing
        return { id: "user_random", name: "Test User", email, role: "PATIENT" };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
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
