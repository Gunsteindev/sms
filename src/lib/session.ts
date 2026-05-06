import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'sms.session';

function getSecret() {
  const raw = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-fallback-change-in-prod';
  return new TextEncoder().encode(raw);
}

export interface SessionUser {
  userid:   string;
  email:    string;
  name:     string;
  role:     string;   // human-readable role name
  userrole: number;   // numeric role — used for access checks
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userid:   (payload.userid   as string) ?? '',
      email:    payload.email     as string,
      name:     payload.name      as string,
      role:     payload.role      as string,
      userrole: (payload.userrole as number) ?? 1,
    };
  } catch {
    return null;
  }
}
