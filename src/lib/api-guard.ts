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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axErr = error as any;
  const dvDetail = axErr?.response?.data != null ? axErr.response.data : null;
  const dvMsg: string = dvDetail?.error?.message ?? dvDetail?.message ?? '';
  console.error('[API Error]', msg, dvMsg || JSON.stringify(dvDetail ?? ''));
  return NextResponse.json(
    {
      success: false,
      error: isDev ? msg : 'Internal server error',
      ...(isDev && dvMsg   ? { dvMessage: dvMsg }     : {}),
      ...(isDev && dvDetail ? { detail: dvDetail }     : {}),
    },
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

/**
 * Returns an `isTableMissing(e)` checker scoped to a Dataverse table name.
 * Handles all known "table not found" error shapes from Dataverse + OData 404s.
 *
 * @example
 * const isTableMissing = makeTableGuard('sms_routeassignment');
 */
export function makeTableGuard(...tableNames: string[]) {
    return function isTableMissing(e: unknown): boolean {
        const err = e as Record<string, unknown>;
        const resp = err?.response as Record<string, unknown> | undefined;
        const errData = resp?.data as Record<string, unknown> | undefined;
        const errInfo = errData?.error as Record<string, unknown> | undefined;
        const msg: string  = (errInfo?.message as string)  ?? (err?.message as string) ?? '';
        const code: string = (errInfo?.code   as string)  ?? '';
        const status       = resp?.status as number | undefined;

        const nameMatch = tableNames.length === 0 ||
            tableNames.some(t => msg.toLowerCase().includes(t.toLowerCase()));

        return nameMatch && (
            msg.includes('Could not find') ||
            msg.includes('does not exist') ||
            msg.includes('Invalid entity')  ||
            msg.includes('Resource not found') ||
            code === '0x80060888' ||
            status === 404
        );
    };
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
