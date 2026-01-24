import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Magic } from '@magic-sdk/admin';
import { AdapterUser } from 'next-auth/adapters';
import { JWT } from 'next-auth/jwt';
import { Account, Profile, User } from 'next-auth';

const magicAdmin = new Magic(process.env.MAGIC_SECRET_KEY || '');

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Magic',
      credentials: {
        didToken: { label: 'DID Token', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.didToken) return null;
        try {
          magicAdmin.token.validate(credentials.didToken);
          const metadata = await magicAdmin.users.getMetadataByToken(credentials.didToken);
          if (!metadata.issuer || !metadata.email) return null;
          return { id: metadata.issuer, email: metadata.email };
        } catch (error) {
          console.error('Auth failed', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser, trigger, session }: { token: JWT; user?: User | AdapterUser; account: Account | null; profile?: Profile; isNewUser?: boolean; trigger?: "signIn" | "signUp" | "update"; session?: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token, user }: { session: any; token: JWT; user: User | AdapterUser }) {
      session.user.id = token.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };