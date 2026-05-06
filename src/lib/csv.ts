type CellValue = string | number | boolean | null | undefined;

function escapeCell(v: CellValue): string {
    const s = v == null ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

export function exportToCSV(filename: string, headers: string[], rows: CellValue[][]): void {
    const lines = [
        headers.map(escapeCell).join(','),
        ...rows.map(r => r.map(escapeCell).join(',')),
    ];
    const bom  = '﻿'; // UTF-8 BOM — ensures Excel opens non-ASCII chars correctly
    const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
