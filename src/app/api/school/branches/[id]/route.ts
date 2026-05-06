import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBranchById, updateBranch, deleteBranch, setMainBranch } from '@/lib/dataverse/school';
import { parseBody, serverError } from '@/lib/api-guard';

const updateSchema = z.object({
    name:      z.string().min(1).optional(),
    address:   z.string().optional(),
    district:  z.string().optional(),
    region:    z.string().optional(),
    phone:     z.string().optional(),
    email:     z.string().optional(),
    ismain:    z.boolean().optional(),
    setMain:   z.boolean().optional(),   // convenience: sets this branch as main campus
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getBranchById(id);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error);
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const parsed = await parseBody(request, updateSchema);
        if ('response' in parsed) return parsed.response;

        const { setMain, ...rest } = parsed.data;

        // setMain=true clears ismain on siblings before setting this branch
        const data = setMain ? await setMainBranch(id) : await updateBranch(id, rest);
        return NextResponse.json({ success: true, data, message: 'Branch updated' });
    } catch (error) {
        return serverError(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteBranch(id);
        return NextResponse.json({ success: true, message: 'Branch deleted' });
    } catch (error) {
        return serverError(error);
    }
}
