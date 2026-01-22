import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Magic } from '@magic-sdk/admin';

const magicAdmin = new Magic(process.env.MAGIC_SECRET_KEY);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Magic',
      credentials: {
        didToken: { label: 'DID Token', type: 'text' },
      },
      async authorize(credentials) {
        try {
          magicAdmin.token.validate(credentials.didToken);
          const metadata = await magicAdmin.users.getMetadataByToken(credentials.didToken);
          return { id: metadata.issuer, email: metadata.email };
        } catch (error) {
          console.error('Auth failed', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };