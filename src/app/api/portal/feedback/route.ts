import { NextRequest, NextResponse } from 'next/server';
import { getSession, serverError, badRequest, withSchool } from '@/lib/api-guard';
import { getParentByEmail } from '@/lib/dataverse/parents';
import { getFeedbackByParent, createFeedback } from '@/lib/dataverse/parentFeedback';

export async function GET(request: NextRequest) {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    return withSchool(request, async () => {
        try {
            const parent = await getParentByEmail(session.email);
            if (!parent) return NextResponse.json({ success: true, data: [], parentFound: false });
            const data = await getFeedbackByParent(parent.parentid);
            return NextResponse.json({ success: true, data, parentFound: true });
        } catch (error) {
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    return withSchool(request, async () => {
        try {
            const body = await request.json();
            if (!body.subject) return badRequest('subject is required');
            if (!body.message) return badRequest('message is required');

            const parent = await getParentByEmail(session.email);
            if (!parent) {
                return NextResponse.json({ success: false, error: 'No parent record is linked to your account' }, { status: 400 });
            }

            const data = await createFeedback({
                subject:      body.subject,
                feedbacktype: Number(body.feedbacktype) || 1,
                message:      body.message,
                parentid:     parent.parentid,
                studentid:    body.studentid || undefined,
                submittedby:  parent.fullname || session.name,
            });
            return NextResponse.json({ success: true, data, message: 'Feedback submitted' }, { status: 201 });
        } catch (error) {
            return serverError(error);
        }
    });
}
