// src/lib/dataverse/teachers.ts
import { dataverseClient } from "./client";

// Use the correct table name with sms_ prefix
const TEACHER_TABLE = 'sms_teachers';

export interface Teacher {
    teacherid: string;
    firstname: string;
    lastname: string;
    dateofbirth: Date;
    gender: number;
    emailaddress1: string;
    telephone1: string;
    address1_line1: string;
    hiredate: Date;
    qualification: string;
    specialization: string;
    employeecode: string;
    department?: string;
    statuscode: number;
    createdon: Date;
    modifiedon: Date;
}

export interface CreateTeacherRequest {
    firstname: string;
    lastname: string;
    dateofbirth: string;
    gender: number;
    emailaddress1: string;
    telephone1: string;
    address1_line1: string;
    hiredate: string;
    qualification: string;
    specialization: string;
    employeecode: string;
    department?: string;
}

export const getTeachers = async () => {
    try {
        // Use simple GET request without getWithFilter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(
            `${TEACHER_TABLE}?$select=sms_teacherid,sms_firstname,sms_lastname,sms_qualification,sms_specialization,statuscode&$filter=statuscode eq 1&$orderby=sms_firstname asc`
        );
        
        // Transform response to match Teacher interface
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const teachers = response.value.map((item: any) => ({
            teacherid: item.sms_teacherid,
            firstname: item.sms_firstname || '',
            lastname: item.sms_lastname || '',
            dateofbirth: item.sms_dateofbirth,
            gender: item.sms_gender,
            emailaddress1: item.sms_emailaddress || '',
            telephone1: item.sms_telephone || '',
            address1_line1: item.sms_addressline1 || '',
            hiredate: item.sms_hiredate,
            qualification: item.sms_qualification || '',
            specialization: item.sms_specialization || '',
            employeecode: item.sms_employeecode || '',
            department: item.sms_department || '',
            statuscode: item.statuscode,
            createdon: item.createdon,
            modifiedon: item.modifiedon
        }));
        
        console.log("Teachers fetched:", teachers.length);
        return teachers;
    } catch (error) {
        console.error("Error fetching teachers:", error);
        throw error;
    }
};

export const getTeacherById = async (id: string): Promise<Teacher> => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(`${TEACHER_TABLE}(sms_teacherid=${id})`);
        
        const teacher = {
            teacherid: response.sms_teacherid,
            firstname: response.sms_firstname || '',
            lastname: response.sms_lastname || '',
            dateofbirth: response.sms_dateofbirth,
            gender: response.sms_gender,
            emailaddress1: response.sms_emailaddress || '',
            telephone1: response.sms_telephone || '',
            address1_line1: response.sms_addressline1 || '',
            hiredate: response.sms_hiredate,
            qualification: response.sms_qualification || '',
            specialization: response.sms_specialization || '',
            employeecode: response.sms_employeecode || '',
            department: response.sms_department || '',
            statuscode: response.statuscode,
            createdon: response.createdon,
            modifiedon: response.modifiedon
        };
        
        console.log("Teacher fetched:", teacher.teacherid);
        return teacher;
    } catch (error) {
        console.error(`Error fetching teacher ${id}:`, error);
        throw error;
    }
};

export const createTeacher = async (data: CreateTeacherRequest) => {
    try {
        // Transform to Dataverse field names
        const dataverseData = {
            sms_firstname: data.firstname,
            sms_lastname: data.lastname,
            sms_dateofbirth: data.dateofbirth,
            sms_gender: data.gender,
            sms_emailaddress: data.emailaddress1,
            sms_telephone: data.telephone1,
            sms_addressline1: data.address1_line1,
            sms_hiredate: data.hiredate,
            sms_qualification: data.qualification,
            sms_specialization: data.specialization,
            sms_employeecode: data.employeecode,
            sms_department: data.department,
            statuscode: 1 // Active by default
        };
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.post<any>(TEACHER_TABLE, dataverseData);
        console.log("Teacher created:", response);
        return response;
    } catch (error) {
        console.error("Error creating teacher:", error);
        throw error;
    }
};

export const updateTeacher = async (id: string, data: Partial<CreateTeacherRequest>) => {
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
        if (data.hiredate !== undefined) dataverseData.sms_hiredate = data.hiredate;
        if (data.qualification !== undefined) dataverseData.sms_qualification = data.qualification;
        if (data.specialization !== undefined) dataverseData.sms_specialization = data.specialization;
        if (data.employeecode !== undefined) dataverseData.sms_employeecode = data.employeecode;
        if (data.department !== undefined) dataverseData.sms_department = data.department;
        
        await dataverseClient.patch(`${TEACHER_TABLE}(sms_teacherid=${id})`, dataverseData);
        
        const updatedTeacher = await getTeacherById(id);
        console.log("Teacher updated:", id);
        return updatedTeacher;
    } catch (error) {
        console.error(`Error updating teacher ${id}:`, error);
        throw error;
    }
};

export const deleteTeacher = async (id: string): Promise<void> => {
    try {
        await dataverseClient.delete(`${TEACHER_TABLE}(sms_teacherid=${id})`);
        console.log("Teacher deleted:", id);
    } catch (error) {
        console.error(`Error deleting teacher ${id}:`, error);
        throw error;
    }
};

export const getTeacherStats = async () => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(
            `${TEACHER_TABLE}?$select=sms_teacherid,statuscode,sms_department,sms_specialization&$count=true`
        );
        
        const teachers = response.value || [];
        
        const byDepartment: Record<string, number> = {};
        const bySpecialization: Record<string, number> = {};
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teachers.forEach((teacher: any) => {
            if (teacher.sms_department) {
                byDepartment[teacher.sms_department] = (byDepartment[teacher.sms_department] || 0) + 1;
            }
            if (teacher.sms_specialization) {
                bySpecialization[teacher.sms_specialization] = (bySpecialization[teacher.sms_specialization] || 0) + 1;
            }
        });
        
        return {
            total: response["@odata.count"] || teachers.length,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            active: teachers.filter((t: any) => t.statuscode === 1).length,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onLeave: teachers.filter((t: any) => t.statuscode === 2).length,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resigned: teachers.filter((t: any) => t.statuscode === 3).length,
            byDepartment,
            bySpecialization
        };
    } catch (error) {
        console.error("Error fetching teacher stats:", error);
        throw error;
    }
};

export const getTeacherClasses = async (teacherId: string) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(
            `sms_classes?$select=sms_classid,sms_classname,sms_gradelevel,sms_roomnumber&$filter=sms_classteacher eq '${teacherId}'&$orderby=sms_classname asc`
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.value.map((item: any) => ({
            classid: item.sms_classid,
            classname: item.sms_classname,
            gradelevel: item.sms_gradelevel,
            roomnumber: item.sms_roomnumber
        }));
    } catch (error) {
        console.error("Error fetching teacher classes:", error);
        throw error;
    }
};