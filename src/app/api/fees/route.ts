// src/app/api/fees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFeeStructures, getFeePayments, createFeePayment, getCurrentMonthRevenue } from '@/lib/dataverse/fees';

// GET /api/fees - Get fee structures or student fees
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const studentId = searchParams.get('studentId');
        const gradelevel = searchParams.get('gradelevel') ? parseInt(searchParams.get('gradelevel')!) : undefined;
        const revenue = searchParams.get('revenue') === 'true';
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

        // Get monthly revenue
        if (revenue) {
            const revenueData = await getCurrentMonthRevenue();
            return NextResponse.json({
                success: true,
                data: revenueData,
                period: { month, year }
            });
        }

        // Get student fee payments
        if (studentId) {
            const result = await getFeePayments({ studentid: studentId });
            return NextResponse.json({
                success: true,
                data: result.items,
                total: result.totalCount
            });
        }

        // Get fee structures
        const feeStructures = await getFeeStructures(gradelevel);
        
        return NextResponse.json({
            success: true,
            data: feeStructures,
            total: feeStructures.length
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in GET /api/fees:', error);
        return NextResponse.json(
        { 
            success: false, 
            error: error.message || 'Failed to fetch fees' 
        },
        { status: 500 }
        );
    }
}

// POST /api/fees - Create fee payment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const requiredFields = ['studentid', 'feestructureid', 'amount', 'paymentmethod', 'transactionid'];
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

        // Generate receipt number if not provided
        if (!body.receiptnumber) {
            body.receiptnumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        const payment = await createFeePayment(body);
        
        return NextResponse.json({
            success: true,
            data: payment,
            message: 'Fee payment recorded successfully'
        }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in POST /api/fees:', error);
        return NextResponse.json(
        { 
            success: false, 
            error: error.message || 'Failed to record fee payment' 
        },
        { status: 500 }
        );
    }
}