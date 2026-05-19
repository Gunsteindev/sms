'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Download, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    parseImportFile,
    validateRows,
    downloadTemplate,
    type ImportField,
    type ParsedRow,
} from '@/lib/csv-import';

export interface ImportResult { imported: number; failed: number; }

interface Props {
    open:             boolean;
    onOpenChange:     (o: boolean) => void;
    title:            string;
    fields:           ImportField[];
    templateFilename: string;
    onImport:         (rows: ParsedRow[]) => Promise<ImportResult>;
    onDone?:          () => void;
}

type Step = 'idle' | 'preview' | 'importing' | 'done';

export function ImportModal({ open, onOpenChange, title, fields, templateFilename, onImport, onDone }: Props) {
    const fileRef                     = useRef<HTMLInputElement>(null);
    const [step, setStep]             = useState<Step>('idle');
    const [dragging, setDragging]     = useState(false);
    const [fileName, setFileName]     = useState('');
    const [rows, setRows]             = useState<ParsedRow[]>([]);
    const [parseError, setParseError] = useState('');
    const [progress, setProgress]     = useState(0);
    const [result, setResult]         = useState<ImportResult | null>(null);

    const reset = useCallback(() => {
        setStep('idle');
        setDragging(false);
        setFileName('');
        setRows([]);
        setParseError('');
        setProgress(0);
        setResult(null);
    }, []);

    const handleClose = () => {
        if (step === 'importing') return;
        if (step === 'done' && onDone) onDone();
        reset();
        onOpenChange(false);
    };

    const processFile = async (file: File) => {
        if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
            setParseError('Only .csv and .xlsx files are supported');
            return;
        }
        setParseError('');
        setFileName(file.name);
        try {
            const raw = await parseImportFile(file);
            if (!raw.length) { setParseError('The file is empty or has no data rows'); return; }
            const parsed = validateRows(raw, fields);
            setRows(parsed);
            setStep('preview');
        } catch {
            setParseError('Could not read the file. Make sure it is a valid CSV or Excel file.');
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleImport = async () => {
        const valid = rows.filter(r => r.valid);
        if (!valid.length) return;
        setStep('importing');
        setProgress(0);
        try {
            // Call onImport with progress updates
            const res = await onImport(valid);
            setResult(res);
            setStep('done');
        } catch {
            setResult({ imported: 0, failed: valid.length });
            setStep('done');
        }
    };

    const valid   = rows.filter(r => r.valid);
    const invalid = rows.filter(r => !r.valid);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">

                    {/* ── IDLE / UPLOAD STEP ── */}
                    {(step === 'idle' || step === 'preview') && (
                        <div
                            className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            onClick={() => fileRef.current?.click()}
                        >
                            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileChange} />
                            <Upload className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                            {fileName ? (
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{fileName}</p>
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Drop a <span className="font-medium">.csv</span> or <span className="font-medium">.xlsx</span> file here, or click to browse
                                </p>
                            )}
                        </div>
                    )}

                    {parseError && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {parseError}
                        </div>
                    )}

                    {/* Template download */}
                    {step === 'idle' && !parseError && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); downloadTemplate(templateFilename, fields); }}
                            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            <Download className="h-3.5 w-3.5" /> Download template CSV
                        </button>
                    )}

                    {/* ── PREVIEW STEP ── */}
                    {step === 'preview' && rows.length > 0 && (
                        <div className="space-y-3">
                            {/* Summary */}
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 text-xs font-medium">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> {valid.length} valid
                                </span>
                                {invalid.length > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-1 text-xs font-medium">
                                        <AlertCircle className="h-3.5 w-3.5" /> {invalid.length} with errors
                                    </span>
                                )}
                                <span className="text-xs text-slate-400">{rows.length} rows total</span>
                            </div>

                            {/* Preview table — first 8 rows */}
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="overflow-x-auto max-h-52">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-1.5 text-left text-slate-500 font-semibold w-10">#</th>
                                                {fields.slice(0, 6).map(f => (
                                                    <th key={f.key} className="px-2 py-1.5 text-left text-slate-500 font-semibold whitespace-nowrap">{f.label}</th>
                                                ))}
                                                <th className="px-2 py-1.5 text-left text-slate-500 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {rows.slice(0, 8).map(r => (
                                                <tr key={r.index} className={r.valid ? '' : 'bg-red-50/50 dark:bg-red-900/10'}>
                                                    <td className="px-2 py-1.5 text-slate-400">{r.index}</td>
                                                    {fields.slice(0, 6).map(f => (
                                                        <td key={f.key} className="px-2 py-1.5 text-slate-700 dark:text-slate-300 max-w-[120px] truncate">{r.data[f.key] || '—'}</td>
                                                    ))}
                                                    <td className="px-2 py-1.5">
                                                        {r.valid ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                        ) : (
                                                            <span className="text-red-500 dark:text-red-400 leading-tight">{r.errors[0]}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {rows.length > 8 && (
                                    <p className="px-3 py-1.5 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                                        Showing 8 of {rows.length} rows
                                    </p>
                                )}
                            </div>

                            {/* Error detail */}
                            {invalid.length > 0 && (
                                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3 space-y-1 max-h-32 overflow-y-auto">
                                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Rows with errors (will be skipped):</p>
                                    {invalid.map(r => (
                                        <p key={r.index} className="text-xs text-red-600 dark:text-red-400">
                                            Row {r.index}: {r.errors.join(' · ')}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── IMPORTING STEP ── */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center py-10 gap-4">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Importing{progress > 0 ? ` ${progress} / ${valid.length}` : '…'}
                            </p>
                            {progress > 0 && (
                                <div className="w-64 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${Math.round((progress / valid.length) * 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── DONE STEP ── */}
                    {step === 'done' && result && (
                        <div className="flex flex-col items-center py-10 gap-3">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Import complete</p>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{result.imported} imported</span>
                                {result.failed > 0 && <span className="text-red-500 font-medium">{result.failed} failed</span>}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div>
                        {step === 'preview' && (
                            <button
                                type="button"
                                onClick={() => downloadTemplate(templateFilename, fields)}
                                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <Download className="h-3.5 w-3.5" /> Download template
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step !== 'importing' && (
                            <Button variant="outline" size="sm" onClick={handleClose}>
                                {step === 'done' ? <><X className="h-3.5 w-3.5 mr-1" />Close</> : 'Cancel'}
                            </Button>
                        )}
                        {step === 'preview' && (
                            <Button
                                size="sm"
                                disabled={valid.length === 0}
                                onClick={handleImport}
                            >
                                Import {valid.length} row{valid.length !== 1 ? 's' : ''}
                            </Button>
                        )}
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}

// ── Progress-aware batch import helper ───────────────────────────────────────

export async function batchImport(
    rows:        ParsedRow[],
    importOne:   (row: ParsedRow) => Promise<unknown>,
    onProgress?: (done: number) => void,
    batchSize =  4,
): Promise<ImportResult> {
    let imported = 0;
    let failed   = 0;
    let done     = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
        const batch   = rows.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map(r => importOne(r)));
        results.forEach(r => r.status === 'fulfilled' ? imported++ : failed++);
        done += batch.length;
        onProgress?.(done);
    }
    return { imported, failed };
}
