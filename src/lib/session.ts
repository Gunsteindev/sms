import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'sms.session';

const DEV_FALLBACK_SECRET = 'dev-fallback-change-in-prod';

function getSecret() {
  const raw = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? DEV_FALLBACK_SECRET;
  // Fail fast in production rather than signing/verifying tokens with a weak,
  // publicly-known secret (which would let anyone forge admin sessions).
  if (process.env.NODE_ENV === 'production' && (raw === DEV_FALLBACK_SECRET || raw.length < 32)) {
    throw new Error('AUTH_SECRET (or NEXTAUTH_SECRET) must be set to a strong secret of at least 32 characters in production.');
  }
  return new TextEncoder().encode(raw);
}

export interface SessionUser {
  userid:   string;
  email:    string;
  name:     string;
  role:     string;   // human-readable role name
  userrole: number;   // numeric role — used for access checks
  schoolId?: string;
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
      schoolId: payload.schoolId as string | undefined,
    };
  } catch {
    return null;
  }
}
