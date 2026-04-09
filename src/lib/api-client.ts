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

export default apiClient;