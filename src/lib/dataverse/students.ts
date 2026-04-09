// src/lib/dataverse/students.ts
import { dataverseClient } from "./client";

const STUDENT_TABLE = 'sms_students';

export interface Student {
    studentid: string;
    firstname: string;
    lastname: string;
    dateofbirth: Date;
    gender: number;
    emailaddress1: string;
    telephone1: string;
    address1_line1: string;
    address1_city: string;
    address1_stateorprovince: string;
    address1_postalcode: string;
    enrollmentdate: Date;
    statuscode: number;
    parentname: string;
    parentphone: string;
    parentemail: string;
    rollnumber?: string;
    classname?: string;
    createdon: Date;
    modifiedon: Date;
}

export interface CreateStudentRequest {
    firstname: string;
    lastname: string;
    dateofbirth: string;
    gender: number;
    emailaddress1: string;
    telephone1: string;
    address1_line1: string;
    address1_city: string;
    address1_stateorprovince: string;
    address1_postalcode: string;
    enrollmentdate: string;
    parentname: string;
    parentphone: string;
    parentemail: string;
    rollnumber?: string;
    classname?: string;
}

export interface StudentFilters {
    search?: string;
    status?: number;
    class?: string;
    page?: number;
    pageSize?: number;
}

// Get all students with pagination (Dataverse-compatible)
export const getStudents = async (filters?: StudentFilters) => {
    try {
        // Build OData query parameters
        const params: string[] = [];
        
        // Select fields
        params.push(`$select=sms_studentid,sms_firstname,sms_lastname,sms_dateofbirth,sms_gender,sms_enrollmentdate,statuscode,sms_guardianname,sms_guardianphone,sms_guardianemail,createdon,modifiedon`);
        
        // Build filter
        let filter = "";
        if (filters?.search) {
            filter = `contains(sms_firstname,'${filters.search}') or contains(sms_lastname,'${filters.search}')`;
        }
        
        if (filters?.status) {
            if (filter) filter += ` and statuscode eq ${filters.status}`;
            else filter = `statuscode eq ${filters.status}`;
        }
        
        if (filters?.class) {
            if (filter) filter += ` and sms_classname eq '${filters.class}'`;
            else filter = `sms_classname eq '${filters.class}'`;
        }
        
        if (filter) {
            params.push(`$filter=${encodeURIComponent(filter)}`);
        }
        
        // Order by
        params.push(`$orderby=sms_firstname asc`);
        
        // Use $top only (no $skip in Dataverse)
        const pageSize = filters?.pageSize || 50;
        params.push(`$top=${pageSize}`);
        
        // For pagination, we need to use the nextLink approach
        // We'll get the first page and use the cookie for subsequent pages
        const queryString = params.join('&');
        const url = `${STUDENT_TABLE}?${queryString}`;
        
        // If page > 1, we need to use the previous page's nextLink
        // For now, we'll just get the first page and let the client handle pagination via nextLink
        if (filters?.page && filters.page > 1) {
            // Dataverse doesn't support skip, so we'll need to store the nextLink from previous response
            // For simplicity, we'll just get the first page
            console.log(`Warning: Dataverse doesn't support skip. Page ${filters.page} may not be accurate.`);
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(url);
        
        // Transform the response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const students = response.value.map((item: any) => ({
            studentid: item.sms_studentid,
            firstname: item.sms_firstname || '',
            lastname: item.sms_lastname || '',
            dateofbirth: item.sms_dateofbirth,
            gender: item.sms_gender,
            emailaddress1: item.sms_emailaddress || '',
            telephone1: item.sms_telephone || '',
            address1_line1: item.sms_addressline1 || '',
            address1_city: item.sms_city || '',
            address1_stateorprovince: item.sms_state || '',
            address1_postalcode: item.sms_postalcode || '',
            enrollmentdate: item.sms_enrollmentdate,
            statuscode: item.statuscode,
            parentname: item.sms_guardianname || '',
            parentphone: item.sms_guardianphone || '',
            parentemail: item.sms_guardianemail || '',
            rollnumber: item.sms_rollnumber || '',
            classname: item.sms_classname || '',
            createdon: item.createdon,
            modifiedon: item.modifiedon
        }));
        
        console.log("Students fetched:", students.length);
        return {
            items: students,
            totalCount: response["@odata.count"] || students.length,
            page: filters?.page || 1,
            pageSize: pageSize,
            hasNextPage: !!response["@odata.nextLink"],
            nextLink: response["@odata.nextLink"] || null
        };
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

// Get next page using nextLink
export const getNextPage = async (nextLink: string) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(nextLink);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const students = response.value.map((item: any) => ({
            studentid: item.sms_studentid,
            firstname: item.sms_firstname || '',
            lastname: item.sms_lastname || '',
            dateofbirth: item.sms_dateofbirth,
            gender: item.sms_gender,
            emailaddress1: item.sms_emailaddress || '',
            telephone1: item.sms_telephone || '',
            address1_line1: item.sms_addressline1 || '',
            address1_city: item.sms_city || '',
            address1_stateorprovince: item.sms_state || '',
            address1_postalcode: item.sms_postalcode || '',
            enrollmentdate: item.sms_enrollmentdate,
            statuscode: item.statuscode,
            parentname: item.sms_guardianname || '',
            parentphone: item.sms_guardianphone || '',
            parentemail: item.sms_guardianemail || '',
            rollnumber: item.sms_rollnumber || '',
            classname: item.sms_classname || '',
            createdon: item.createdon,
            modifiedon: item.modifiedon
        }));
        
        return {
            items: students,
            totalCount: response["@odata.count"] || students.length,
            hasNextPage: !!response["@odata.nextLink"],
            nextLink: response["@odata.nextLink"] || null
        };
    } catch (error) {
        console.error("Error fetching next page:", error);
        throw error;
    }
};

// Get single student by ID
export const getStudentById = async (id: string): Promise<Student> => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(`${STUDENT_TABLE}(${id})`);
        
        const student = {
            studentid: response.sms_studentid,
            firstname: response.sms_firstname || '',
            lastname: response.sms_lastname || '',
            dateofbirth: response.sms_dateofbirth,
            gender: response.sms_gender,
            emailaddress1: response.sms_emailaddress || '',
            telephone1: response.sms_telephone || '',
            address1_line1: response.sms_addressline1 || '',
            address1_city: response.sms_city || '',
            address1_stateorprovince: response.sms_state || '',
            address1_postalcode: response.sms_postalcode || '',
            enrollmentdate: response.sms_enrollmentdate,
            statuscode: response.statuscode,
            parentname: response.sms_guardianname || '',
            parentphone: response.sms_guardianphone || '',
            parentemail: response.sms_guardianemail || '',
            rollnumber: response.sms_rollnumber || '',
            classname: response.sms_classname || '',
            createdon: response.createdon,
            modifiedon: response.modifiedon
        };
        
        console.log("Student fetched:", student.studentid);
        return student;
    } catch (error) {
        console.error(`Error fetching student ${id}:`, error);
        throw error;
    }
};

// Create new student
export const createStudent = async (data: CreateStudentRequest) => {
    try {
        const dataverseData = {
            sms_firstname: data.firstname,
            sms_lastname: data.lastname,
            sms_dateofbirth: data.dateofbirth,
            sms_gender: data.gender,
            sms_emailaddress: data.emailaddress1,
            sms_telephone: data.telephone1,
            sms_addressline1: data.address1_line1,
            sms_city: data.address1_city,
            sms_state: data.address1_stateorprovince,
            sms_postalcode: data.address1_postalcode,
            sms_enrollmentdate: data.enrollmentdate,
            sms_guardianname: data.parentname,
            sms_guardianphone: data.parentphone,
            sms_guardianemail: data.parentemail,
            sms_classname: data.classname,
            statuscode: 1
        };
        
        if (data.rollnumber) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (dataverseData as any).sms_rollnumber = data.rollnumber;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.post<any>(STUDENT_TABLE, dataverseData);
        console.log("Student created:", response);
        return response;
    } catch (error) {
        console.error("Error creating student:", error);
        throw error;
    }
};

// Update student
export const updateStudent = async (id: string, data: Partial<CreateStudentRequest>) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dataverseData: any = {};
        
        if (data.firstname !== undefined) dataverseData.sms_firstname = data.firstname;
        if (data.lastname !== undefined) dataverseData.sms_lastname = data.lastname;
        if (data.dateofbirth !== undefined) dataverseData.sms_dateofbirth = data.dateofbirth;
        if (data.gender !== undefined) dataverseData.sms_gender = data.gender;
        if (data.emailaddress1 !== undefined) dataverseData.sms_emailaddress = data.emailaddress1;
        if (data.telephone1 !== undefined) dataverseData.sms_telephone = data.telephone1;
        if (data.address1_line1 !== undefined) dataverseData.sms_addressline1 = data.address1_line1;
        if (data.address1_city !== undefined) dataverseData.sms_city = data.address1_city;
        if (data.address1_stateorprovince !== undefined) dataverseData.sms_state = data.address1_stateorprovince;
        if (data.address1_postalcode !== undefined) dataverseData.sms_postalcode = data.address1_postalcode;
        if (data.enrollmentdate !== undefined) dataverseData.sms_enrollmentdate = data.enrollmentdate;
        if (data.parentname !== undefined) dataverseData.sms_guardianname = data.parentname;
        if (data.parentphone !== undefined) dataverseData.sms_guardianphone = data.parentphone;
        if (data.parentemail !== undefined) dataverseData.sms_guardianemail = data.parentemail;
        if (data.rollnumber !== undefined) dataverseData.sms_rollnumber = data.rollnumber;
        if (data.classname !== undefined) dataverseData.sms_classname = data.classname;
        
        await dataverseClient.patch(`${STUDENT_TABLE}(${id})`, dataverseData);
        
        const updatedStudent = await getStudentById(id);
        console.log("Student updated:", id);
        return updatedStudent;
    } catch (error) {
        console.error(`Error updating student ${id}:`, error);
        throw error;
    }
};

// Delete student
export const deleteStudent = async (id: string): Promise<void> => {
    try {
        await dataverseClient.delete(`${STUDENT_TABLE}(${id})`);
        console.log("Student deleted:", id);
    } catch (error) {
        console.error(`Error deleting student ${id}:`, error);
        throw error;
    }
};

// Get student statistics
export const getStudentStats = async () => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(`${STUDENT_TABLE}?$select=sms_studentid,statuscode&$count=true`);
        
        const students = response.value || [];
        return {
            total: response["@odata.count"] || students.length,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            active: students.filter((s: any) => s.statuscode === 1).length,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            graduated: students.filter((s: any) => s.statuscode === 2).length,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transferred: students.filter((s: any) => s.statuscode === 3).length,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            suspended: students.filter((s: any) => s.statuscode === 4).length
        };
    } catch (error) {
        console.error("Error fetching student stats:", error);
        throw error;
    }
};

// Search students
export const searchStudents = async (query: string) => {
    try {
        const filter = `contains(sms_firstname,'${query}') or contains(sms_lastname,'${query}') or contains(sms_emailaddress,'${query}')`;
        const encodedFilter = encodeURIComponent(filter);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(
            `${STUDENT_TABLE}?$select=sms_studentid,sms_firstname,sms_lastname,sms_emailaddress,sms_classname&$filter=${encodedFilter}&$top=20`
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.value.map((item: any) => ({
            studentid: item.sms_studentid,
            firstname: item.sms_firstname || '',
            lastname: item.sms_lastname || '',
            emailaddress1: item.sms_emailaddress || '',
            classname: item.sms_classname || ''
        }));
    } catch (error) {
        console.error("Error searching students:", error);
        throw error;
    }
};