import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

async function getUserRole(email) {
  if (process.env.USER_EDITORS?.split(',').includes(email)) {
    return "editor";
  }
  else if (process.env.USER_ADMINS?.split(',').includes(email)) {
    return "admin";
  }
  return "user";
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // The `user` object is available only on the first sign-in
      if (user || token) {
        token.role = await getUserRole(user?.email || token.email); // Use user.email during sign-in
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role; // Attach the role from the token to the session
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
