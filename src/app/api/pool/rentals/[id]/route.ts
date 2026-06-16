import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getRentalById, updateRental, deleteRental } from '@/lib/dataverse/poolrentals';
import { serverError, withSchool } from '@/lib/api-guard';

const notFound = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 404;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try { const { id } = await params; return NextResponse.json({ success: true, data: await getRentalById(id) }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Rental item not found' }, { status: 404 });
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try { const { id } = await params; return NextResponse.json({ success: true, data: await updateRental(id, await request.json()) }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Rental item not found' }, { status: 404 });
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try { const { id } = await params; await deleteRental(id); return NextResponse.json({ success: true }); }
        catch (error) {
            if (notFound(error)) return NextResponse.json({ success: false, error: 'Rental item not found' }, { status: 404 });
            return serverError(error);
        }
    });
}
