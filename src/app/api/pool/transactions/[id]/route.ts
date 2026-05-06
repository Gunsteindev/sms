import { NextRequest, NextResponse } from 'next/server';
import { getTransactionById, updateTransaction, deleteTransaction } from '@/lib/dataverse/pooltransactions';
import { serverError } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try { const { id } = await params; return NextResponse.json({ success: true, data: await getTransactionById(id) }); }
    catch (error) { return serverError(error); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try { const { id } = await params; return NextResponse.json({ success: true, data: await updateTransaction(id, await request.json()) }); }
    catch (error) { return serverError(error); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try { const { id } = await params; await deleteTransaction(id); return NextResponse.json({ success: true }); }
    catch (error) { return serverError(error); }
}
