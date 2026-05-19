// Backward-compatible re-export barrel.
// All existing imports from '@/lib/api-client' keep working unchanged.
// New code should import from '@/lib/api' or a specific domain module
// (e.g. '@/lib/api/people', '@/lib/api/finance').

export * from './api/index';
export { default } from './api/client';
