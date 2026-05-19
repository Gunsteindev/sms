import apiClient from './client';

export const attendanceAPI = {
    getByDate:      (date: string, className?: string) =>
                        apiClient.get('/attendance', { params: { date, className } }),
    getSummary:     (date: string, className?: string) =>
                        apiClient.get('/attendance', { params: { date, className, summary: true } }),
    getTrends:      (days = 30) =>
                        apiClient.get('/attendance', { params: { trends: true, days } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markBulk:       (records: any[])             => apiClient.post('/attendance', { records }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:         (id: string, data: any)      => apiClient.put(`/attendance/${id}`, data),
    delete:         (id: string)                 => apiClient.delete(`/attendance/${id}`),
    getStudentReport: (studentId: string, startDate: string, endDate: string) =>
                        apiClient.get(`/attendance/student/${studentId}`, { params: { startDate, endDate } }),
};

export const gradesAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:       (params?: any)             => apiClient.get('/grades', { params }),
    getById:      (id: string)               => apiClient.get(`/grades/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:       (data: any)                => apiClient.post('/grades', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:       (id: string, data: any)    => apiClient.put(`/grades/${id}`, data),
    delete:       (id: string)               => apiClient.delete(`/grades/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bulkUpsert:   (entries: any[])           => apiClient.post('/grades', entries),
};

export const promotionsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/promotions', { params }),
    getById:  (id: string)               => apiClient.get(`/promotions/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/promotions', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/promotions/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/promotions/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bulk:     (data: any)                => apiClient.post('/promotions/bulk', data),
};

export const disciplinaryAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/disciplinary', { params }),
    getById:  (id: string)               => apiClient.get(`/disciplinary/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/disciplinary', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/disciplinary/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/disciplinary/${id}`),
};
