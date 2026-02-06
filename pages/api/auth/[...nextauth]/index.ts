import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const url =2 ;

type NextCredentials = {
  username: string;
  password: string;
};

export default NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },

      // TODO type checking
      async authorize(credentials: any, req) {
        console.log("hellooo\n", url);

        const response = await fetch(`${url}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.username,
            password: credentials.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw Error("Invalid");
        }
        return data;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
    async session({ session, token }) {
      session.user = token;

      // session.accessToken = token.token;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login",
  },
});
