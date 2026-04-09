// src/lib/dataverse/classes.ts
import { dataverseClient } from "./client";

// Correct table name (singular as per your Dataverse pattern)
const CLASS_TABLE = 'sms_classes';

export interface Class {
    classid: string;
    classname: string;
    gradelevel: number;
    academicyear: string;
    classteacherid: string;
    classteachername?: string;
    capacity: number;
    roomnumber: string;
    currentenrollment: number;
    createdon: string;
    modifiedon: string;
}

export interface CreateClassRequest {
    classname: string;
    gradelevel: number;
    academicyear: string;
    classteacherid: string;
    capacity: number;
    roomnumber: string;
}

// Get all classes
export const getClasses = async () => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(
            `${CLASS_TABLE}?$select=sms_classid,sms_classname,sms_gradelevel,sms_academicyear,sms_classteacher,sms_capacity,sms_roomnumber&$orderby=sms_gradelevel asc,sms_classname asc`
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const classes = response.value.map((item: any) => ({
            classid: item.sms_classid,
            classname: item.sms_classname || '',
            gradelevel: item.sms_gradelevel,
            academicyear: item.sms_academicyear || '',
            classteacherid: item.sms_classteacherid || '',
            classteachername: item.sms_classteachername || '',
            capacity: item.sms_capacity || 0,
            roomnumber: item.sms_roomnumber || '',
            currentenrollment: item.sms_currentenrollment || 0,
            createdon: item.createdon,
            modifiedon: item.modifiedon
        }));
        
        console.log("Classes fetched:", classes.length);
        return classes;
    } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
    }
};

// Get class by ID
export const getClassById = async (id: string): Promise<Class> => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(`${CLASS_TABLE}(sms_classid=${id})`);
        
        const classData = {
            classid: response.sms_classid,
            classname: response.sms_classname || '',
            gradelevel: response.sms_gradelevel,
            academicyear: response.sms_academicyear || '',
            classteacherid: response.sms_classteacherid || '',
            classteachername: response.sms_classteachername || '',
            capacity: response.sms_capacity || 0,
            roomnumber: response.sms_roomnumber || '',
            currentenrollment: response.sms_currentenrollment || 0,
            createdon: response.createdon,
            modifiedon: response.modifiedon
        };
        
        console.log("Class fetched:", classData.classid);
        return classData;
    } catch (error) {
        console.error(`Error fetching class ${id}:`, error);
        throw error;
    }
};

// Create new class
export const createClass = async (data: CreateClassRequest) => {
    try {
        const dataverseData = {
            sms_classname: data.classname,
            sms_gradelevel: data.gradelevel,
            sms_academicyear: data.academicyear,
            sms_classteacherid: data.classteacherid,
            sms_capacity: data.capacity,
            sms_roomnumber: data.roomnumber,
            sms_currentenrollment: 0
        };
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.post<any>(CLASS_TABLE, dataverseData);
        console.log("Class created:", response);
        return response;
    } catch (error) {
        console.error("Error creating class:", error);
        throw error;
    }
};

// Update class
export const updateClass = async (id: string, data: Partial<CreateClassRequest>) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dataverseData: any = {};
        
        if (data.classname !== undefined) dataverseData.sms_classname = data.classname;
        if (data.gradelevel !== undefined) dataverseData.sms_gradelevel = data.gradelevel;
        if (data.academicyear !== undefined) dataverseData.sms_academicyear = data.academicyear;
        if (data.classteacherid !== undefined) dataverseData.sms_classteacherid = data.classteacherid;
        if (data.capacity !== undefined) dataverseData.sms_capacity = data.capacity;
        if (data.roomnumber !== undefined) dataverseData.sms_roomnumber = data.roomnumber;
        
        await dataverseClient.patch(`${CLASS_TABLE}(sms_classid=${id})`, dataverseData);
        
        const updatedClass = await getClassById(id);
        console.log("Class updated:", id);
        return updatedClass;
    } catch (error) {
        console.error(`Error updating class ${id}:`, error);
        throw error;
    }
};

// Delete class
export const deleteClass = async (id: string): Promise<void> => {
    try {
        await dataverseClient.delete(`${CLASS_TABLE}(sms_classid=${id})`);
        console.log("Class deleted:", id);
    } catch (error) {
        console.error(`Error deleting class ${id}:`, error);
        throw error;
    }
};

// Get classes count and statistics
export const getClassesCount = async () => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(
            `${CLASS_TABLE}?$select=sms_classid,sms_gradelevel,sms_capacity,sms_currentenrollment&$count=true`
        );
        
        const classes = response.value || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalCapacity = classes.reduce((sum: number, cls: any) => sum + (cls.sms_capacity || 0), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalEnrollment = classes.reduce((sum: number, cls: any) => sum + (cls.sms_currentenrollment || 0), 0);
        
        const byGrade: Record<number, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        classes.forEach((cls: any) => {
            const grade = cls.sms_gradelevel;
            if (grade) {
                byGrade[grade] = (byGrade[grade] || 0) + 1;
            }
        });
        
        return {
            total: response["@odata.count"] || classes.length,
            byGrade,
            totalCapacity,
            totalEnrollment,
            averageClassSize: classes.length > 0 ? totalEnrollment / classes.length : 0,
            utilizationRate: totalCapacity > 0 ? (totalEnrollment / totalCapacity) * 100 : 0
        };
    } catch (error) {
        console.error("Error fetching classes count:", error);
        throw error;
    }
};

// Get classes by grade level
export const getClassesByGrade = async (gradelevel: number) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(
            `${CLASS_TABLE}?$select=sms_classid,sms_classname,sms_gradelevel,sms_roomnumber,sms_capacity,sms_currentenrollment&$filter=sms_gradelevel eq ${gradelevel}&$orderby=sms_classname asc`
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.value.map((item: any) => ({
            classid: item.sms_classid,
            classname: item.sms_classname || '',
            gradelevel: item.sms_gradelevel,
            roomnumber: item.sms_roomnumber || '',
            capacity: item.sms_capacity || 0,
            currentenrollment: item.sms_currentenrollment || 0
        }));
    } catch (error) {
        console.error(`Error fetching classes for grade ${gradelevel}:`, error);
        throw error;
    }
};

// Get class students (enrollments)
export const getClassStudents = async (classId: string) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(
            `sms_student?$select=sms_studentid,sms_firstname,sms_lastname,sms_rollnumber,sms_emailaddress&$filter=sms_classid eq '${classId}'&$orderby=sms_rollnumber asc`
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.value.map((item: any) => ({
            studentid: item.sms_studentid,
            firstname: item.sms_firstname || '',
            lastname: item.sms_lastname || '',
            rollnumber: item.sms_rollnumber || '',
            email: item.sms_emailaddress || ''
        }));
    } catch (error) {
        console.error("Error fetching class students:", error);
        throw error;
    }
};

// Get class subjects
export const getClassSubjects = async (classId: string) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await dataverseClient.get<any>(
            `sms_classsubject?$select=sms_subjectid,sms_subjectname,sms_teachername,sms_credithours&$filter=sms_classid eq '${classId}'&$orderby=sms_subjectname asc`
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.value.map((item: any) => ({
            subjectid: item.sms_subjectid,
            subjectname: item.sms_subjectname || '',
            teachername: item.sms_teachername || '',
            credithours: item.sms_credithours || 0
        }));
    } catch (error) {
        console.error("Error fetching class subjects:", error);
        throw error;
    }
};