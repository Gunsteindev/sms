// Pure, dependency-free helpers for enforcing multi-tenant (per-school) isolation
// on Dataverse OData requests. Kept separate from client.ts so they can be unit
// tested without importing axios, auth, or the singleton client.

// Tables that represent the school/tenant itself — no school filter applied.
export const NO_TENANT_TABLES = ['sms_schools', 'sms_schoolbranchs'];

// The lookup column every tenant-scoped table carries.
export const SCHOOL_VALUE_FIELD = '_sms_school_value';

const GUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** Entity-set name from an endpoint, e.g. `sms_students(...)?...` → `sms_students`. */
export function getTableName(endpoint: string): string {
    return endpoint.split('?')[0].split('(')[0];
}

/** True for a retrieve-by-primary-key endpoint, e.g. `sms_students(<guid>)`. */
export function isSingleRecordEndpoint(endpoint: string): boolean {
    return new RegExp(`^[a-z_]+\\(${GUID}\\)`, 'i').test(endpoint);
}

/** Extracts the record GUID from a single-record endpoint, or null. */
export function extractRecordId(endpoint: string): string | null {
    const m = endpoint.match(new RegExp(`\\((${GUID})\\)`, 'i'));
    return m ? m[1] : null;
}

/** Injects `_sms_school_value eq <schoolId>` into a collection query. */
export function buildTenantFilteredEndpoint(endpoint: string, schoolId: string): string {
    if (endpoint.includes('$filter=')) {
        return endpoint.replace(/(\$filter=[^&]*)/, `$1 and ${SCHOOL_VALUE_FIELD} eq ${schoolId}`);
    }
    if (endpoint.includes('?')) {
        return `${endpoint}&$filter=${SCHOOL_VALUE_FIELD}%20eq%20${schoolId}`;
    }
    return `${endpoint}?$filter=${SCHOOL_VALUE_FIELD}%20eq%20${schoolId}`;
}

/**
 * Ensures `field` is present in the endpoint's `$select` so the caller can read it
 * back. If there is no `$select`, Dataverse returns the full row (field included),
 * so the endpoint is returned unchanged.
 */
export function ensureSelect(endpoint: string, field: string): string {
    const m = endpoint.match(/\$select=([^&]*)/);
    if (!m) return endpoint;
    if (m[1].split(',').includes(field)) return endpoint;
    return endpoint.replace(/\$select=([^&]*)/, `$select=$1,${field}`);
}

/**
 * True when a fetched record belongs to a different school than the active tenant.
 * A missing record-school (legacy/orphaned rows) is treated as non-violating so
 * existing data isn't bricked; the active tenant must be set for a check to apply.
 */
export function isCrossTenantViolation(
    recordSchoolId: string | null | undefined,
    currentSchoolId: string | null | undefined,
): boolean {
    return !!currentSchoolId && !!recordSchoolId && recordSchoolId !== currentSchoolId;
}
