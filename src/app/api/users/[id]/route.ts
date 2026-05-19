import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserById, updateUser, deleteUser } from '@/lib/dataverse/users';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const updateSchema = z.object({
    name:            z.string().min(1).optional(),
    email:           z.string().email().optional(),
    password:        z.string().min(8).optional(),
    userrole:        z.number().int().min(1).max(8).optional(),
    isactive:        z.boolean().optional(),
    relatedrecordid: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(req, async () => {
        try {
            const { id } = await params;
            const data = await getUserById(id);
            return NextResponse.json({ success: true, data });
        } catch (error) {
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
            const data = await updateUser(id, parsed.data);
            return NextResponse.json({ success: true, data });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(req, async () => {
        try {
            const { id } = await params;
            await deleteUser(id);
            return NextResponse.json({ success: true });
        } catch (error) {
            return serverError(error);
        }
    });
}
