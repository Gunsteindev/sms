'use client';

import { useEffect, useRef, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { schoolAPI } from '@/lib/api-client';

interface ReceiptData {
    receiptnumber: string;
    studentname:   string;
    classname?:    string;
    rollnumber?:   string;
    feestructure:  string;
    amount:        number;
    paymentdate:   string;
    paymentmethod: string;
    paymentstatus: string;
    transactionid?: string;
    issuedby?:     string;
}

interface SchoolInfo {
    name:    string;
    address: string;
    phone:   string;
    email:   string;
    logo:    string;
}

function fmt(d: string) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GH', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return d; }
}

function currency(n: number) {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(n);
}

export function ReceiptDialog({ open, onClose, data }: {
    open:    boolean;
    onClose: () => void;
    data:    ReceiptData | null;
}) {
    const printRef = useRef<HTMLDivElement>(null);
    const [school, setSchool] = useState<SchoolInfo | null>(null);

    useEffect(() => {
        if (!open) return;
        schoolAPI.getProfile()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((res: any) => { if (res?.data) setSchool(res.data); })
            .catch(() => {/* school profile optional */});
    }, [open]);

    const handlePrint = () => {
        const el = printRef.current;
        if (!el) return;
        const win = window.open('', '_blank', 'width=800,height=600');
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Receipt ${data?.receiptnumber ?? ''}</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 32px; }
                    .receipt { max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
                    .header { background: #1e40af; color: #fff; padding: 20px 24px; text-align: center; }
                    .header img { height: 52px; width: 52px; object-fit: contain; border-radius: 8px; margin-bottom: 8px; background: #fff; }
                    .header h1 { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
                    .header p { font-size: 11px; opacity: 0.85; }
                    .title-bar { background: #eff6ff; border-bottom: 1px solid #bfdbfe; padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; }
                    .title-bar span { font-size: 12px; font-weight: 600; color: #1e40af; letter-spacing: 0.05em; text-transform: uppercase; }
                    .title-bar .receipt-no { font-size: 13px; font-weight: 700; color: #1e293b; font-family: monospace; }
                    .body { padding: 20px 24px; }
                    .section { margin-bottom: 16px; }
                    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
                    .row .label { color: #64748b; font-size: 12px; }
                    .row .value { font-size: 12px; font-weight: 500; color: #1e293b; text-align: right; max-width: 60%; }
                    .amount-row { background: #f8fafc; border-radius: 6px; padding: 12px 16px; margin-top: 8px; }
                    .amount-row .label { font-size: 13px; font-weight: 600; color: #475569; }
                    .amount-row .value { font-size: 18px; font-weight: 700; color: #1e40af; }
                    .status-paid { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 99px; }
                    .status-pending { display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 99px; }
                    .footer { border-top: 1px solid #e2e8f0; background: #f8fafc; padding: 14px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>${el.innerHTML}</body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    if (!data) return null;

    const isPaid = data.paymentstatus.toLowerCase() === 'paid';

    return (
        <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
            <DialogContent showCloseButton={false} className="sm:max-w-lg p-0 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Payment Receipt</p>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-1.5" /> Print
                        </Button>
                        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Printable receipt */}
                <div className="p-4 overflow-y-auto max-h-[75vh]">
                    <div ref={printRef}>
                        <div className="receipt border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-sm">

                            {/* School header */}
                            <div className="bg-blue-700 text-white px-6 py-5 text-center">
                                {school?.logo && (
                                    <img src={school.logo} alt="logo" className="h-12 w-12 mx-auto mb-2 rounded-lg object-contain bg-white" />
                                )}
                                <h1 className="text-lg font-bold leading-tight">{school?.name ?? 'School Management System'}</h1>
                                {school?.address && <p className="text-xs opacity-80 mt-0.5">{school.address}</p>}
                                {(school?.phone || school?.email) && (
                                    <p className="text-xs opacity-80 mt-0.5">
                                        {[school?.phone, school?.email].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>

                            {/* Receipt title bar */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 px-6 py-2.5 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    Official Receipt
                                </span>
                                <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                                    #{data.receiptnumber || 'N/A'}
                                </span>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-5 bg-white dark:bg-slate-900">

                                {/* Student details */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">Student</p>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-xs">Name</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{data.studentname}</span>
                                        </div>
                                        {data.classname && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-xs">Class</span>
                                                <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{data.classname}</span>
                                            </div>
                                        )}
                                        {data.rollnumber && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-xs">Roll No.</span>
                                                <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{data.rollnumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment details */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">Payment Details</p>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-xs">Fee Item</span>
                                            <span className="font-medium text-xs text-slate-700 dark:text-slate-300 text-right max-w-[60%]">{data.feestructure}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-xs">Date</span>
                                            <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{fmt(data.paymentdate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-xs">Method</span>
                                            <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{data.paymentmethod}</span>
                                        </div>
                                        {data.transactionid && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 text-xs">Transaction ID</span>
                                                <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{data.transactionid}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 text-xs">Status</span>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${isPaid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                {data.paymentstatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-3 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Amount Paid</span>
                                    <span className="text-xl font-bold text-blue-700 dark:text-blue-400">{currency(data.amount)}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 py-3 text-center">
                                <p className="text-[11px] text-slate-400">Thank you for your payment.</p>
                                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">
                                    Issued: {fmt(new Date().toISOString())} {data.issuedby ? `· ${data.issuedby}` : ''}
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
