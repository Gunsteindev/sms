import apiClient from './client';

export const parentsAPI = {
    getAll:   (search?: string)          => apiClient.get('/parents', { params: { search } }),
    getById:  (id: string)               => apiClient.get(`/parents/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/parents', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/parents/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/parents/${id}`),
};

export const studentParentsAPI = {
    getByStudent: (studentid: string)    => apiClient.get('/student-parents', { params: { studentid } }),
    getByParent:  (parentid: string)     => apiClient.get('/student-parents', { params: { parentid } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    link:         (data: any)            => apiClient.post('/student-parents', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:       (id: string, data: any)=> apiClient.put(`/student-parents/${id}`, data),
    unlink:       (id: string)           => apiClient.delete(`/student-parents/${id}`),
};

export const studentsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/students', { params }),
    getById:  (id: string)               => apiClient.get(`/students/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/students', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/students/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/students/${id}`),
    getStats: ()                         => apiClient.get('/students', { params: { stats: true } }),
    search:   (query: string)            => apiClient.get('/students', { params: { search: query } }),
};

export const teachersAPI = {
    getAll:   ()                         => apiClient.get('/teachers'),
    getById:  (id: string)               => apiClient.get(`/teachers/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/teachers', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/teachers/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/teachers/${id}`),
    getStats: ()                         => apiClient.get('/teachers', { params: { stats: true } }),
};

export const employeesAPI = {
    getAll:   (department?: string)      => apiClient.get('/employees', { params: { department } }),
    getById:  (id: string)               => apiClient.get(`/employees/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/employees', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/employees/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/employees/${id}`),
    getStats: ()                         => apiClient.get('/employees', { params: { stats: true } }),
};
