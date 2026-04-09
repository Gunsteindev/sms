export interface Student {
    studentid: string;
    firstname: string;
    lastname: string;
    dateofbirth: Date;
    email: string;
    status: number; // 0=Active, 1=Graduated, etc.
    _parentid_value?: string;
}

export interface AttendanceRecord {
    attendanceid: string;
    _studentid_value: string;
    date: Date;
    status: number; // 0=Present, 1=Absent, 2=Late
}

class DataverseClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = '/api/dataverse';
    }

    async getStudents(filter?: string): Promise<Student[]> {
        const params = new URLSearchParams();
        params.append('entity', 'students');
        if (filter) params.append('$filter', filter);

        const response = await fetch(`${this.baseUrl}?${params.toString()}`);
        const data = await response.json();
        return data.value;
    }

    async getStudentAttendance(studentId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
        const filter = `_studentid_value eq '${studentId}' and date ge ${startDate.toISOString()} and date le ${endDate.toISOString()}`;
        return this.getAttendance(filter);
    }

    async createStudent(student: Omit<Student, 'studentid'>): Promise<Student> {
        const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'students', record: student }),
        });
        return response.json();
    }

    async getAttendance(filter?: string): Promise<AttendanceRecord[]> {
        const params = new URLSearchParams();
        params.append('entity', 'attendances');
        if (filter) params.append('$filter', filter);

        const response = await fetch(`${this.baseUrl}?${params.toString()}`);
        const data = await response.json();
        return data.value;
    }
}

export const dataverseClient = new DataverseClient();