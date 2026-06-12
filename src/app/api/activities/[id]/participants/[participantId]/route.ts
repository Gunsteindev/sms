import { NextRequest, NextResponse } from 'next/server';
import { deleteParticipant } from '@/lib/dataverse/activityParticipants';
import { getActivityById, updateActivity } from '@/lib/dataverse/activities';
import { serverError, withSchool, makeTableGuard } from '@/lib/api-guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissing(error: any): boolean {
    const msg: string = error?.response?.data?.error?.message ?? '';
    return error?.response?.status === 404 && msg.includes('Resource not found for the segment');
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
            return serverError(error);
        }
    });
}
