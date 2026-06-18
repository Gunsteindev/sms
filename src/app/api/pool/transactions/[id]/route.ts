import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getTransactionById, updateTransaction, deleteTransaction } from '@/lib/dataverse/pooltransactions';
import { serverError, withSchool } from '@/lib/api-guard';

const notFound = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 404;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try { const { id } = await params; return NextResponse.json({ success: true, data: await getTransactionById(id) }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try { const { id } = await params; return NextResponse.json({ success: true, data: await updateTransaction(id, await request.json()) }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try { const { id } = await params; await deleteTransaction(id); return NextResponse.json({ success: true }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
            return serverError(error);
        }
    });
}
