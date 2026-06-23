// Server-only data helpers for React Server Components.
//
// Route handlers get their tenant context from `withSchool(req, …)` in
// `api-guard.ts`, which reads the `x-school-id` header injected by the proxy.
// Server Components don't receive that header, so they resolve the school
// directly from the verified session cookie and run inside `withTenant`.
//
// Importing `next/headers` makes this module unusable from client bundles,
// so these helpers can only ever run on the server.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE, type SessionUser } from '@/lib/session';
import { withTenant } from '@/lib/dataverse/tenant';

/**
 * Reads and verifies the session for a Server Component / page.
 * Returns `null` when there is no valid session.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

/**
 * Server Component equivalent of `withSchool` for route handlers.
 *
 * Resolves the signed-in user's school from the verified JWT and runs `fn`
 * inside the tenant context, so every Dataverse call made within `fn` is
 * automatically school-scoped — exactly like the API layer. Redirects to the
 * login page when there is no valid session (defence in depth; the proxy
 * already guards these routes).
 *
 * @example
 * const departments = await loadForSchool(() => getDepartments());
 */
export async function loadForSchool<T>(fn: (user: SessionUser) => Promise<T>): Promise<T> {
  const user = await getServerSession();
  if (!user) redirect('/auth/login');
  return withTenant(user.schoolId ?? '', () => fn(user));
}
