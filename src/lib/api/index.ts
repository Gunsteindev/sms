// Re-exports every domain API so callers can import from either:
//   '@/lib/api'                — new, domain-organised path
//   '@/lib/api-client'         — legacy path (still works via re-export barrel)

export { default as apiClient } from './client';

export * from './people';
export * from './academic';
export * from './finance';
export * from './operations';
export * from './facilities';
export * from './school-admin';
