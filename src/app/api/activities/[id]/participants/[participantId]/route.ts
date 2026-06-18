import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { deleteParticipant } from '@/lib/dataverse/activityParticipants';
import { getActivityById, updateActivity } from '@/lib/dataverse/activities';
import { serverError, withSchool } from '@/lib/api-guard';

// Precise: a missing TABLE yields an OData "Resource not found for the segment" error.
// A missing RECORD also 404s, so distinguish — only the segment error means table-missing.
function isTableMissing(error: unknown): boolean {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) return false;
    const msg: string = error.response?.data?.error?.message ?? '';
    return msg.includes('Resource not found for the segment');
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; participantId: string }> }
) {
    return withSchool(req, async () => {
        try {
            const { id, participantId } = await params;
            await deleteParticipant(participantId);

            const activity = await getActivityById(id);
            await updateActivity(id, { enrolled: Math.max(0, activity.enrolled - 1) });

            return NextResponse.json({ success: true });
        } catch (error) {
            if (isTableMissing(error)) {
                return NextResponse.json({ success: false, error: 'Table not configured', setup_required: true }, { status: 503 });
            }
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 });
            }
            return serverError(error);
        }
    });
}
