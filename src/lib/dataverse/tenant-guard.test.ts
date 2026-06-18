import { describe, it, expect } from 'vitest';
import {
    getTableName,
    isSingleRecordEndpoint,
    extractRecordId,
    buildTenantFilteredEndpoint,
    ensureSelect,
    isCrossTenantViolation,
} from './tenant-guard';

const SCHOOL_A = '11111111-1111-1111-1111-111111111111';
const SCHOOL_B = '22222222-2222-2222-2222-222222222222';
const REC_ID   = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('endpoint parsing', () => {
    it('extracts the table name from collection and single-record endpoints', () => {
        expect(getTableName('sms_students?$select=sms_name')).toBe('sms_students');
        expect(getTableName(`sms_students(${REC_ID})?$select=sms_name`)).toBe('sms_students');
    });

    it('detects retrieve-by-primary-key endpoints', () => {
        expect(isSingleRecordEndpoint(`sms_students(${REC_ID})`)).toBe(true);
        expect(isSingleRecordEndpoint(`sms_students(${REC_ID})?$select=sms_name`)).toBe(true);
        expect(isSingleRecordEndpoint('sms_students?$select=sms_name')).toBe(false);
        expect(isSingleRecordEndpoint('sms_students')).toBe(false);
    });

    it('extracts the record id, or null when absent', () => {
        expect(extractRecordId(`sms_students(${REC_ID})`)).toBe(REC_ID);
        expect(extractRecordId('sms_students?$top=1')).toBeNull();
    });
});

describe('collection tenant filtering', () => {
    it('appends a school filter when none exists', () => {
        expect(buildTenantFilteredEndpoint('sms_students?$select=sms_name', SCHOOL_A))
            .toContain(`$filter=_sms_school_value%20eq%20${SCHOOL_A}`);
    });

    it('ANDs the school filter into an existing $filter', () => {
        const out = buildTenantFilteredEndpoint("sms_students?$filter=sms_name eq 'x'", SCHOOL_A);
        expect(out).toContain("sms_name eq 'x'");
        expect(out).toContain(`and _sms_school_value eq ${SCHOOL_A}`);
    });

    it('adds a query string when the endpoint has none', () => {
        expect(buildTenantFilteredEndpoint('sms_students', SCHOOL_A))
            .toBe(`sms_students?$filter=_sms_school_value%20eq%20${SCHOOL_A}`);
    });
});

describe('ensureSelect', () => {
    it('adds the field to an existing $select that lacks it', () => {
        expect(ensureSelect('sms_students(x)?$select=sms_name', '_sms_school_value'))
            .toBe('sms_students(x)?$select=sms_name,_sms_school_value');
    });
    it('is a no-op when the field is already selected', () => {
        const ep = 'sms_students(x)?$select=sms_name,_sms_school_value';
        expect(ensureSelect(ep, '_sms_school_value')).toBe(ep);
    });
    it('is a no-op when there is no $select (full row is returned)', () => {
        expect(ensureSelect('sms_students(x)', '_sms_school_value')).toBe('sms_students(x)');
    });
});

describe('cross-tenant isolation (security-critical)', () => {
    it('denies access when the record belongs to another school', () => {
        expect(isCrossTenantViolation(SCHOOL_B, SCHOOL_A)).toBe(true);
    });

    it('allows access when the record belongs to the active school', () => {
        expect(isCrossTenantViolation(SCHOOL_A, SCHOOL_A)).toBe(false);
    });

    it('does not flag records that have no school value (legacy/orphaned rows)', () => {
        expect(isCrossTenantViolation(null, SCHOOL_A)).toBe(false);
        expect(isCrossTenantViolation(undefined, SCHOOL_A)).toBe(false);
    });

    it('does not restrict when there is no active tenant (super admin)', () => {
        expect(isCrossTenantViolation(SCHOOL_B, undefined)).toBe(false);
        expect(isCrossTenantViolation(SCHOOL_B, null)).toBe(false);
    });

    it('a by-id read of another school’s record is identified and would be blocked', () => {
        const endpoint = `sms_students(${REC_ID})?$select=sms_name`;
        // The client treats this as a single-record fetch...
        expect(isSingleRecordEndpoint(endpoint)).toBe(true);
        // ...and once the row's owner is known, a mismatch is a violation (→ 404).
        const fetchedOwnerSchool = SCHOOL_B;
        const activeSchool = SCHOOL_A;
        expect(isCrossTenantViolation(fetchedOwnerSchool, activeSchool)).toBe(true);
    });
});
