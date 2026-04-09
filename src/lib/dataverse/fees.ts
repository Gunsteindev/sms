// src/lib/dataverse/fees.ts
import { dataverseClient } from "./client";

export interface FeeStructure {
    feestructureid: string;
    gradelevel: number;
    academicyear: string;
    feetype: number;
    amount: number;
    duedate: string;
    createdon: string;
}

export interface FeePayment {
    paymentid: string;
    studentid: string;
    studentname?: string;
    feestructureid: string;
    amount: number;
    paymentdate: string;
    paymentmethod: number;
    transactionid: string;
    receiptnumber: string;
    status: number;
    createdon: string;
}

export interface CreateFeePaymentRequest {
    studentid: string;
    feestructureid: string;
    amount: number;
    paymentdate: string;
    paymentmethod: number;
    transactionid: string;
    receiptnumber: string;
}

export interface MonthlyRevenue {
    month: number;
    year: number;
    totalRevenue: number;
    totalPayments: number;
    averagePayment: number;
}

export const getFeeStructures = async (gradelevel?: number, academicyear?: string) => {
    try {
        let filter = "";
        if (gradelevel) {
            filter += `sms_gradelevel eq ${gradelevel}`;
        }
        if (academicyear) {
            filter += filter ? ` and sms_academicyear eq '${academicyear}'` : `sms_academicyear eq '${academicyear}'`;
        }
        
        const response = await dataverseClient.getWithFilter<{ value: FeeStructure[] }>(
            "feestructures",
            ["sms_feestructureid", "sms_gradelevel", "sms_academicyear", "sms_feetype", "sms_amount", "sms_duedate"],
            filter,
            "sms_feetype asc"
        );
        
        return response.value;
    } catch (error) {
        console.error("Error fetching fee structures:", error);
        throw error;
    }
};

export const getStudentFees = async (studentId: string, academicyear?: string) => {
    try {
        let filter = `sms_studentid eq ${studentId}`;
        if (academicyear) {
            filter += ` and sms_academicyear eq '${academicyear}'`;
        }
        
        const response = await dataverseClient.getWithFilter<{ value: FeePayment[] }>(
            "feepayments",
            ["sms_paymentid", "sms_amount", "sms_paymentdate", "sms_paymentmethod", "sms_status", "sms_receiptnumber"],
            filter,
            "sms_paymentdate desc"
        );
        
        return response.value;
    } catch (error) {
        console.error("Error fetching student fees:", error);
        throw error;
    }
};

export const createFeePayment = async (data: CreateFeePaymentRequest) => {
    try {
        const response = await dataverseClient.post<FeePayment>("feepayments", data);
        console.log("Fee payment created:", response);
        return response;
    } catch (error) {
        console.error("Error creating fee payment:", error);
        throw error;
    }
};

export const getFeeSummary = async (studentId: string, academicyear: string) => {
    try {
        const fees = await getStudentFees(studentId, academicyear);
        const structures = await getFeeStructures(undefined, academicyear);
        
        const totalDue = structures.reduce((sum, fee) => sum + fee.amount, 0);
        const totalPaid = fees.reduce((sum, fee) => sum + fee.amount, 0);
        const balance = totalDue - totalPaid;
        
        return {
            totalDue,
            totalPaid,
            balance,
            paymentStatus: balance === 0 ? "Paid" : balance > 0 ? "Partial" : "Overpaid"
        };
    } catch (error) {
        console.error("Error fetching fee summary:", error);
        throw error;
    }
};

export const getMonthlyRevenue = async (month: number, year: number): Promise<MonthlyRevenue> => {
    try {
        const monthStr = month.toString().padStart(2, '0');
        const startDate = `${year}-${monthStr}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${monthStr}-${lastDay}`;
        
        const filter = `sms_paymentdate ge ${startDate} and sms_paymentdate le ${endDate} and sms_status eq 1`;
        
        const response = await dataverseClient.getWithFilter<{ value: FeePayment[] }>(
            "feepayments",
            ["sms_amount"],
            filter
        );
        
        const totalRevenue = response.value.reduce((sum, payment) => sum + payment.amount, 0);
        const totalPayments = response.value.length;
        const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
        
        return {
            month,
            year,
            totalRevenue,
            totalPayments,
            averagePayment
        };
    } catch (error) {
        console.error("Error fetching monthly revenue:", error);
        throw error;
    }
};

export const getCurrentMonthRevenue = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return getMonthlyRevenue(month, year);
};