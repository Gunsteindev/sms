import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE, SessionUser } from '@/lib/session';
import { ZodSchema } from 'zod';
import { withTenant } from '@/lib/dataverse/tenant';

export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

export function serverError(error: unknown) {
  const isDev = process.env.NODE_ENV === 'development';
  const msg = error instanceof Error ? error.message : 'Internal server error';
  console.error('[API Error]', msg);
  return NextResponse.json(
    { success: false, error: isDev ? msg : 'Internal server error' },
    { status: 500 }
  );
}

export function getSchoolId(req: NextRequest): string | null {
  return req.headers.get('x-school-id');
}

export async function withSchool<T>(req: NextRequest, fn: () => Promise<T>): Promise<T> {
  const schoolId = req.headers.get('x-school-id') ?? '';
  return withTenant(schoolId, fn);
}

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<{ data: T } | { response: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { response: badRequest('Invalid JSON body') };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { response: badRequest(errors) };
  }
  return { data: result.data };
}
