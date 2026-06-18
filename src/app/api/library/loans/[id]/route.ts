import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getLoanById, updateLoan, deleteLoan } from '@/lib/dataverse/libraryloans';
import { serverError, withSchool } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await getLoanById(id) });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Loan not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            return NextResponse.json({ success: true, data: await updateLoan(id, await request.json()) });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Loan not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteLoan(id);
            return NextResponse.json({ success: true });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Loan not found' }, { status: 404 });
            }
            return serverError(e);
        }
    });
}
