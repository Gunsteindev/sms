import { AsyncLocalStorage } from 'async_hooks';
import { registerTenantResolver } from './client';

const storage = new AsyncLocalStorage<string>();

export function withTenant<T>(schoolId: string, fn: () => Promise<T>): Promise<T> {
  return storage.run(schoolId, fn) as Promise<T>;
}

export function getTenantId(): string | undefined {
  return storage.getStore() || undefined;
}

// Register this resolver with the DataverseClient so it can read the tenant
// without importing async_hooks (which breaks client-side bundles).
registerTenantResolver(getTenantId);
