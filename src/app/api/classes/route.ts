import { NextRequest, NextResponse } from 'next/server';
import { getClasses, createClass, getClassesCount } from '@/lib/dataverse/classes';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const stats = searchParams.get('stats') === 'true';
        const gradelevel = searchParams.get('gradelevel') ? parseInt(searchParams.get('gradelevel')!) : undefined;

        if (stats) {
            const classStats = await getClassesCount();
            return NextResponse.json({
                success: true,
                data: classStats
            });
        }

        let classes = await getClasses();
        
        // Filter by grade level if specified
        if (gradelevel) {
            classes = classes.filter((c: { gradelevel: number }) => c.gradelevel === gradelevel);
        }
        
        return NextResponse.json({
            success: true,
            data: classes,
            total: classes.length
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in GET /api/classes:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to fetch classes',
                details: error.response?.data 
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const requiredFields = ['classname', 'gradelevel', 'academicyear', 'classteacherid', 'capacity'];
        const missingFields = requiredFields.filter(field => !body[field]);
        
        if (missingFields.length > 0) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: `Missing required fields: ${missingFields.join(', ')}` 
                },
                { status: 400 }
            );
        }

        const newClass = await createClass(body);
        
        return NextResponse.json({
            success: true,
            data: newClass,
            message: 'Class created successfully'
        }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in POST /api/classes:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to create class',
                details: error.response?.data 
            },
            { status: 500 }
        );
    }
}