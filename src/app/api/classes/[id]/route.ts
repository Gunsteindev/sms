import { NextRequest, NextResponse } from 'next/server';
import { getClassById, updateClass, deleteClass, getClassStudents, getClassSubjects } from '@/lib/dataverse/classes';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const includeStudents = searchParams.get('includeStudents') === 'true';
        const includeSubjects = searchParams.get('includeSubjects') === 'true';

        const classData = await getClassById(id);

        if (!classData) {
            return NextResponse.json(
                { success: false, error: 'Class not found' },
                { status: 404 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = {
            success: true,
            data: classData
        };

        if (includeStudents) {
            const students = await getClassStudents(id);
            response.students = students;
        }

        if (includeSubjects) {
            const subjects = await getClassSubjects(id);
            response.subjects = subjects;
        }

        return NextResponse.json(response);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in GET /api/classes/[id]:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch class'
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const updatedClass = await updateClass(id, body);

        return NextResponse.json({
            success: true,
            data: updatedClass,
            message: 'Class updated successfully'
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in PUT /api/classes/[id]:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to update class'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deleteClass(id);

        return NextResponse.json({
            success: true,
            message: 'Class deleted successfully'
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in DELETE /api/classes/[id]:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to delete class'
            },
            { status: 500 }
        );
    }
}
