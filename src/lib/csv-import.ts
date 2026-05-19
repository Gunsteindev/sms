// CSV / Excel import utilities.
// xlsx is dynamically imported so it only loads when the user triggers an import.

export interface ImportField {
    key:       string;
    label:     string;        // Column header shown in template
    required?: boolean;
    type?:     'text' | 'number' | 'date';
    hint?:     string;        // Example value shown in template row
}

export interface ParsedRow {
    index:  number;           // 1-based row number (row 1 = header)
    data:   Record<string, string>;
    errors: string[];
    valid:  boolean;
}

// ── Parse ────────────────────────────────────────────────────────────────────

export async function parseImportFile(file: File): Promise<Record<string, string>[]> {
    const XLSX = await import('xlsx');
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const ab = e.target?.result as ArrayBuffer;
                const wb = XLSX.read(ab, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
                    raw:    false,
                    defval: '',
                });
                resolve(rows);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

// ── Validate ─────────────────────────────────────────────────────────────────

export function validateRows(
    rawRows: Record<string, string>[],
    fields:  ImportField[],
): ParsedRow[] {
    // Build a case-insensitive map: column header → field key
    const colMap: Record<string, string> = {};
    fields.forEach(f => {
        colMap[f.label.toLowerCase()]         = f.key;
        colMap[`${f.label}*`.toLowerCase()]   = f.key;
        colMap[f.key.toLowerCase()]           = f.key;
    });

    return rawRows.map((rawRow, i) => {
        const data: Record<string, string> = {};
        for (const [col, val] of Object.entries(rawRow)) {
            const key = colMap[col.trim().toLowerCase()];
            if (key) data[key] = String(val ?? '').trim();
        }

        const errors: string[] = [];
        fields.forEach(f => {
            if (f.required && !data[f.key]) {
                errors.push(`${f.label} is required`);
            }
            if (f.type === 'number' && data[f.key] && isNaN(Number(data[f.key]))) {
                errors.push(`${f.label} must be a number`);
            }
            if (f.type === 'date' && data[f.key]) {
                const d = new Date(data[f.key]);
                if (isNaN(d.getTime())) errors.push(`${f.label}: invalid date — use YYYY-MM-DD`);
            }
        });

        return { index: i + 2, data, errors, valid: errors.length === 0 };
    });
}

// ── Template download ─────────────────────────────────────────────────────────

export function downloadTemplate(filename: string, fields: ImportField[]): void {
    const headers = fields.map(f => f.required ? `${f.label}*` : f.label);
    const example = fields.map(f => f.hint ?? '');
    const lines   = [headers.join(','), example.join(',')];
    const blob    = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── Field definitions ─────────────────────────────────────────────────────────

export const STUDENT_FIELDS: ImportField[] = [
    { key: 'firstname',     label: 'First Name',      required: true,  type: 'text', hint: 'John' },
    { key: 'lastname',      label: 'Last Name',       required: true,  type: 'text', hint: 'Smith' },
    { key: 'gender',        label: 'Gender',                           type: 'text', hint: 'Male' },
    { key: 'dateofbirth',   label: 'Date of Birth',                    type: 'date', hint: '2010-06-15' },
    { key: 'enrollmentdate',label: 'Enrollment Date',                  type: 'date', hint: '2024-09-01' },
    { key: 'email',         label: 'Email',                            type: 'text', hint: 'john.smith@email.com' },
    { key: 'phone',         label: 'Phone',                            type: 'text', hint: '+1 555 0100' },
    { key: 'address',       label: 'Address',                          type: 'text', hint: '123 Main St' },
    { key: 'rollnumber',    label: 'Roll Number',                      type: 'text', hint: 'STU001' },
    { key: 'guardianname',  label: 'Guardian Name',                    type: 'text', hint: 'Jane Smith' },
    { key: 'guardianphone', label: 'Guardian Phone',                   type: 'text', hint: '+1 555 0101' },
    { key: 'guardianemail', label: 'Guardian Email',                   type: 'text', hint: 'jane.smith@email.com' },
];

export const INVENTORY_FIELDS: ImportField[] = [
    { key: 'name',            label: 'Name',             required: true, type: 'text',   hint: 'A4 Paper Ream' },
    { key: 'category',        label: 'Category',                         type: 'text',   hint: 'Stationery' },
    { key: 'quantity',        label: 'Quantity',                         type: 'number', hint: '100' },
    { key: 'unit',            label: 'Unit',                             type: 'text',   hint: 'pcs' },
    { key: 'unitprice',       label: 'Unit Price',                       type: 'number', hint: '5.00' },
    { key: 'reorderlevel',    label: 'Reorder Level',                    type: 'number', hint: '20' },
    { key: 'supplier',        label: 'Supplier',                         type: 'text',   hint: 'Office Depot' },
    { key: 'suppliercontact', label: 'Supplier Contact',                 type: 'text',   hint: '+1 555 0200' },
    { key: 'location',        label: 'Location',                         type: 'text',   hint: 'Storeroom A' },
    { key: 'description',     label: 'Description',                      type: 'text',   hint: '' },
];

// ── Row mappers ───────────────────────────────────────────────────────────────

const GENDER_MAP: Record<string, number> = {
    male: 1, m: 1,
    female: 2, f: 2,
    other: 3, o: 3,
};

export function mapStudentRow(row: Record<string, string>): Record<string, unknown> {
    const today = new Date().toISOString().slice(0, 10);
    return {
        firstname:     row.firstname,
        lastname:      row.lastname,
        gender:        GENDER_MAP[row.gender?.toLowerCase()] ?? 3,
        dateofbirth:   row.dateofbirth  || undefined,
        enrollmentdate:row.enrollmentdate || today,
        email:         row.email        || undefined,
        phone:         row.phone        || undefined,
        address:       row.address      || undefined,
        rollnumber:    row.rollnumber   || undefined,
        guardianname:  row.guardianname || undefined,
        guardianphone: row.guardianphone || undefined,
        guardianemail: row.guardianemail || undefined,
        studentstatus:    1,
        enrollmentstatus: 1,
    };
}

export function mapInventoryRow(row: Record<string, string>): Record<string, unknown> {
    return {
        name:            row.name,
        category:        row.category        || undefined,
        quantity:        row.quantity        ? Number(row.quantity)        : undefined,
        unit:            row.unit            || undefined,
        unitprice:       row.unitprice       ? Number(row.unitprice)       : undefined,
        reorderlevel:    row.reorderlevel    ? Number(row.reorderlevel)    : undefined,
        supplier:        row.supplier        || undefined,
        suppliercontact: row.suppliercontact || undefined,
        location:        row.location        || undefined,
        description:     row.description     || undefined,
    };
}
