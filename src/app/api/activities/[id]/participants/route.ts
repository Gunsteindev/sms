import { NextRequest, NextResponse } from 'next/server';
import { getParticipantsByActivity, createParticipant } from '@/lib/dataverse/activityParticipants';
import { getActivityById, updateActivity } from '@/lib/dataverse/activities';
import { serverError, badRequest, withSchool } from '@/lib/api-guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissing(error: any): boolean {
    const msg: string = error?.response?.data?.error?.message ?? '';
    return error?.response?.status === 404 && msg.includes('Resource not found for the segment');
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(_req, async () => {
        try {
            const { id } = await params;
            const participants = await getParticipantsByActivity(id);
            return NextResponse.json({ success: true, data: participants, total: participants.length });
        } catch (error) {
            if (isTableMissing(error)) {
                return NextResponse.json({ success: true, data: [], total: 0, setup_required: true });
            }
            return serverError(error);
        }
    });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withSchool(req, async () => {
        try {
            const { id } = await params;
            const body = await req.json();

            if (!body.studentid)   return badRequest('studentid is required');
            if (!body.studentname) return badRequest('studentname is required');

            const activity = await getActivityById(id);

            if (activity.capacity > 0 && activity.enrolled >= activity.capacity) {
                return NextResponse.json({ success: false, error: 'Activity is at full capacity' }, { status: 409 });
            }

            const participant = await createParticipant({
                activityid:     id,
                activityname:   activity.name,
                studentid:      body.studentid,
                studentname:    body.studentname,
                enrollmentdate: body.enrollmentdate ?? new Date().toISOString().slice(0, 10),
                status:         1,
            });

            await updateActivity(id, { enrolled: activity.enrolled + 1 });

            return NextResponse.json({ success: true, data: participant }, { status: 201 });
        } catch (error) {
            if (isTableMissing(error)) {
                return NextResponse.json(
                    { success: false, error: 'The sms_activityparticipants table has not been created in Dataverse yet.', setup_required: true },
                    { status: 503 }
                );
            }
            return serverError(error);
        }
    });
}
