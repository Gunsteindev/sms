import apiClient from './client';

export const classesAPI = {
    getAll:   ()                                              => apiClient.get('/classes'),
    getById:  (id: string, includeStudents?: boolean, includeSubjects?: boolean) =>
                  apiClient.get(`/classes/${id}`, { params: { includeStudents, includeSubjects } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                                    => apiClient.post('/classes', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)                        => apiClient.put(`/classes/${id}`, data),
    delete:   (id: string)                                   => apiClient.delete(`/classes/${id}`),
    getStats: ()                                             => apiClient.get('/classes', { params: { stats: true } }),
};

export const subjectsAPI = {
    getAll:   ()                         => apiClient.get('/subjects'),
    getById:  (id: string)               => apiClient.get(`/subjects/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/subjects', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/subjects/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/subjects/${id}`),
};

export const enrollmentsAPI = {
    getAll:   ()                         => apiClient.get('/enrollments'),
    getById:  (id: string)               => apiClient.get(`/enrollments/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/enrollments', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/enrollments/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/enrollments/${id}`),
};

export const departmentsAPI = {
    getAll:   ()                         => apiClient.get('/departments'),
    getById:  (id: string)               => apiClient.get(`/departments/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/departments', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/departments/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/departments/${id}`),
};

export const academicYearsAPI = {
    getAll:   (search?: string)          => apiClient.get('/academic-years', { params: { search } }),
    getById:  (id: string)               => apiClient.get(`/academic-years/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/academic-years', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/academic-years/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/academic-years/${id}`),
};

export const termsAPI = {
    getAll:   (search?: string, academicyearid?: string) =>
                  apiClient.get('/terms', { params: { search, academicyearid } }),
    getById:  (id: string)               => apiClient.get(`/terms/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/terms', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/terms/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/terms/${id}`),
};

export const gradeLevelsAPI = {
    getAll:   (search?: string)          => apiClient.get('/grade-levels', { params: { search } }),
    getById:  (id: string)               => apiClient.get(`/grade-levels/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/grade-levels', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/grade-levels/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/grade-levels/${id}`),
};

export const examsAPI = {
    getAll:   ()                         => apiClient.get('/exams'),
    getById:  (id: string)               => apiClient.get(`/exams/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/exams', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/exams/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/exams/${id}`),
};

export const examResultsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/exams/results', { params }),
    getById:  (id: string)               => apiClient.get(`/exams/results/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/exams/results', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/exams/results/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/exams/results/${id}`),
};

export const timetableAPI = {
    getAll:   ()                         => apiClient.get('/timetable'),
    getById:  (id: string)               => apiClient.get(`/timetable/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/timetable', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/timetable/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/timetable/${id}`),
};
