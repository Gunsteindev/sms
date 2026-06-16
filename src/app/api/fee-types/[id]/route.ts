import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { z } from 'zod';
import { getFeeTypeById, updateFeeType, deleteFeeType } from '@/lib/dataverse/feetypes';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const updateSchema = z.object({
    name:        z.string().min(1).optional(),
    description: z.string().optional(),
    category:    z.enum(['academic', 'residential', 'extracurricular', 'administrative']).optional(),
    mandatory:   z.boolean().optional(),
    color:       z.string().min(1).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const data = await getFeeTypeById(id);
            return NextResponse.json({ success: true, data });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Fee type not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(request, async () => {
        try {
            const { id } = await params;
            const parsed = await parseBody(request, updateSchema);
            if ('response' in parsed) return parsed.response;
            const data = await updateFeeType(id, parsed.data);
            return NextResponse.json({ success: true, data, message: 'Fee type updated' });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Fee type not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            await deleteFeeType(id);
            return NextResponse.json({ success: true, message: 'Fee type deleted' });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Fee type not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}
