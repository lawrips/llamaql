import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

async function getUserRole(email) {
  if (process.env.USER_EDITORS?.split(',').includes(email)) {
    return "editor";
  } else if (process.env.USER_ADMINS?.split(',').includes(email)) {
    return "admin";
  }
  return "user";
}

// Define authOptions as a separate export
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user || token) {
        token.role = await getUserRole(user?.email || token.email);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// Pass authOptions to NextAuth handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
