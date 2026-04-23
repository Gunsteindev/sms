import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  // next-auth beta.30 doesn't set basePath when NEXTAUTH_URL has a root pathname,
  // causing @auth/core to fall back to '/auth' instead of '/api/auth'.
  basePath: '/api/auth',
  // @auth/core rejects every request as UntrustedHost unless this is set.
  trustHost: true,
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Validate against ADMIN_EMAIL / ADMIN_PASSWORD environment variables.
        // Replace this block with your own user-store lookup (e.g. Dataverse contacts table).
        if (
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return { id: '1', email, name: 'Administrator', role: 'admin' };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: any) {
      if (user) token.role = user.role;
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: any) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
});
