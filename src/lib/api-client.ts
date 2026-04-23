// src/lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error.response?.data || { success: false, error: error.message };
    }
);

// Parents API
export const parentsAPI = {
    getAll: (search?: string) => apiClient.get('/parents', { params: { search } }),
    getById: (id: string) => apiClient.get(`/parents/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/parents', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/parents/${id}`, data),
    delete: (id: string) => apiClient.delete(`/parents/${id}`),
};

// Student-Parents API
export const studentParentsAPI = {
    getByStudent: (studentid: string) => apiClient.get('/student-parents', { params: { studentid } }),
    getByParent:  (parentid: string)  => apiClient.get('/student-parents', { params: { parentid } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    link:   (data: any)               => apiClient.post('/student-parents', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any)   => apiClient.put(`/student-parents/${id}`, data),
    unlink: (id: string)              => apiClient.delete(`/student-parents/${id}`),
};

// Students API
export const studentsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll: (params?: any) => apiClient.get('/students', { params }),
    getById: (id: string) => apiClient.get(`/students/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/students', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/students/${id}`, data),
    delete: (id: string) => apiClient.delete(`/students/${id}`),
    getStats: () => apiClient.get('/students', { params: { stats: true } }),
    search: (query: string) => apiClient.get('/students', { params: { search: query } }),
};

// Teachers API
export const teachersAPI = {
    getAll: () => apiClient.get('/teachers'),
    getById: (id: string) => apiClient.get(`/teachers/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/teachers', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/teachers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/teachers/${id}`),
    getStats: () => apiClient.get('/teachers', { params: { stats: true } }),
};

// Employees API
export const employeesAPI = {
    getAll: (department?: string) => apiClient.get('/employees', { params: { department } }),
    getById: (id: string) => apiClient.get(`/employees/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/employees', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/employees/${id}`, data),
    delete: (id: string) => apiClient.delete(`/employees/${id}`),
    getStats: () => apiClient.get('/employees', { params: { stats: true } }),
};

// Attendance API
export const attendanceAPI = {
    getByDate: (date: string, className?: string) =>
        apiClient.get('/attendance', { params: { date, className } }),
    getSummary: (date: string, className?: string) =>
        apiClient.get('/attendance', { params: { date, className, summary: true } }),
    getTrends: (days: number = 30) =>
        apiClient.get('/attendance', { params: { trends: true, days } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markBulk: (records: any[]) =>
        apiClient.post('/attendance', { records }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/attendance/${id}`, data),
    delete: (id: string) => apiClient.delete(`/attendance/${id}`),
    getStudentReport: (studentId: string, startDate: string, endDate: string) =>
        apiClient.get(`/attendance/student/${studentId}`, { params: { startDate, endDate } }),
};

// Classes API
export const classesAPI = {
    getAll: () => apiClient.get('/classes'),
    getById: (id: string, includeStudents?: boolean, includeSubjects?: boolean) => 
        apiClient.get(`/classes/${id}`, { params: { includeStudents, includeSubjects } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/classes', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/classes/${id}`, data),
    delete: (id: string) => apiClient.delete(`/classes/${id}`),
    getStats: () => apiClient.get('/classes', { params: { stats: true } }),
};

// Fees API
export const feesAPI = {
    getStructures: (gradelevel?: number, academicyear?: string) => 
        apiClient.get('/fees', { params: { gradelevel, academicyear } }),
    getStudentFees: (studentId: string, academicyear?: string) => 
        apiClient.get('/fees', { params: { studentId, academicyear } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createPayment: (data: any) => apiClient.post('/fees', data),
    getRevenue: () => apiClient.get('/fees', { params: { revenue: true } }),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => apiClient.get('/dashboard'),
    getFullData: () => apiClient.get('/dashboard', { params: { full: true } }),
};

// Subjects API
export const subjectsAPI = {
    getAll: () => apiClient.get('/subjects'),
    getById: (id: string) => apiClient.get(`/subjects/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/subjects', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/subjects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/subjects/${id}`),
};

// Enrollments API
export const enrollmentsAPI = {
    getAll: () => apiClient.get('/enrollments'),
    getById: (id: string) => apiClient.get(`/enrollments/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/enrollments', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/enrollments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/enrollments/${id}`),
};

// Departments API
export const departmentsAPI = {
    getAll: () => apiClient.get('/departments'),
    getById: (id: string) => apiClient.get(`/departments/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/departments', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/departments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/departments/${id}`),
};

// Exams API
export const examsAPI = {
    getAll: () => apiClient.get('/exams'),
    getById: (id: string) => apiClient.get(`/exams/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/exams', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/exams/${id}`, data),
    delete: (id: string) => apiClient.delete(`/exams/${id}`),
};

// Exam Results API
export const examResultsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll: (params?: any) => apiClient.get('/exams/results', { params }),
    getById: (id: string) => apiClient.get(`/exams/results/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/exams/results', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/exams/results/${id}`, data),
    delete: (id: string) => apiClient.delete(`/exams/results/${id}`),
};

// Library API
export const libraryAPI = {
    getAll: () => apiClient.get('/library'),
    getById: (id: string) => apiClient.get(`/library/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/library', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/library/${id}`, data),
    delete: (id: string) => apiClient.delete(`/library/${id}`),
};

// Library Loans API
export const libraryLoansAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll: (params?: any) => apiClient.get('/library/loans', { params }),
    getById: (id: string) => apiClient.get(`/library/loans/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/library/loans', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/library/loans/${id}`, data),
    delete: (id: string) => apiClient.delete(`/library/loans/${id}`),
};

// Timetable API
export const timetableAPI = {
    getAll: () => apiClient.get('/timetable'),
    getById: (id: string) => apiClient.get(`/timetable/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/timetable', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/timetable/${id}`, data),
    delete: (id: string) => apiClient.delete(`/timetable/${id}`),
};

// Finance — Fee Structures API
export const feeStructuresAPI = {
    getAll:  (gradelevel?: number) => apiClient.get('/finance/fee-structures', { params: { gradelevel } }),
    getById: (id: string)          => apiClient.get(`/finance/fee-structures/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:  (data: any)           => apiClient.post('/finance/fee-structures', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:  (id: string, data: any) => apiClient.put(`/finance/fee-structures/${id}`, data),
    delete:  (id: string)          => apiClient.delete(`/finance/fee-structures/${id}`),
};

// Finance — Fee Invoices API
export const feeInvoicesAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:  (params?: any)        => apiClient.get('/finance/fees', { params }),
    getById: (id: string)          => apiClient.get(`/finance/fees/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:  (data: any)           => apiClient.post('/finance/fees', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:  (id: string, data: any) => apiClient.put(`/finance/fees/${id}`, data),
    delete:  (id: string)          => apiClient.delete(`/finance/fees/${id}`),
};

// Finance — Fee Payments API
export const feePaymentsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:  (params?: any)        => apiClient.get('/finance/fee-payments', { params }),
    getById: (id: string)          => apiClient.get(`/finance/fee-payments/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:  (data: any)           => apiClient.post('/finance/fee-payments', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:  (id: string, data: any) => apiClient.put(`/finance/fee-payments/${id}`, data),
    delete:  (id: string)          => apiClient.delete(`/finance/fee-payments/${id}`),
};

// Finance — Scholarships API
export const scholarshipsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:  (params?: any)        => apiClient.get('/finance/scholarships', { params }),
    getById: (id: string)          => apiClient.get(`/finance/scholarships/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:  (data: any)           => apiClient.post('/finance/scholarships', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:  (id: string, data: any) => apiClient.put(`/finance/scholarships/${id}`, data),
    delete:  (id: string)          => apiClient.delete(`/finance/scholarships/${id}`),
};

// Academic Years API
export const academicYearsAPI = {
    getAll: (search?: string) => apiClient.get('/academic-years', { params: { search } }),
    getById: (id: string) => apiClient.get(`/academic-years/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/academic-years', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/academic-years/${id}`, data),
    delete: (id: string) => apiClient.delete(`/academic-years/${id}`),
};

// Terms API
export const termsAPI = {
    getAll: (search?: string, academicyearid?: string) => apiClient.get('/terms', { params: { search, academicyearid } }),
    getById: (id: string) => apiClient.get(`/terms/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/terms', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/terms/${id}`, data),
    delete: (id: string) => apiClient.delete(`/terms/${id}`),
};

// Grade Levels API
export const gradeLevelsAPI = {
    getAll: (search?: string) => apiClient.get('/grade-levels', { params: { search } }),
    getById: (id: string) => apiClient.get(`/grade-levels/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (data: any) => apiClient.post('/grade-levels', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (id: string, data: any) => apiClient.put(`/grade-levels/${id}`, data),
    delete: (id: string) => apiClient.delete(`/grade-levels/${id}`),
};

export default apiClient;