import apiClient from './client';

export const schoolAPI = {
    getProfile:   ()                             => apiClient.get('/school'),
    listSchools:  ()                             => apiClient.get('/school/list'),
    switchSchool: (schoolId: string)             => apiClient.post('/school/switch', { schoolId }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    saveProfile:  (data: any)                    => apiClient.put('/school', data),
    getBranches:  (schoolid?: string) =>
                      apiClient.get('/school/branches', { params: schoolid ? { schoolid } : {} }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createBranch: (data: any)                    => apiClient.post('/school/branches', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateBranch: (id: string, data: any)        => apiClient.put(`/school/branches/${id}`, data),
    deleteBranch: (id: string)                   => apiClient.delete(`/school/branches/${id}`),
    setMainBranch:  (id: string)                 => apiClient.put(`/school/branches/${id}`, { setMain: true }),
    updateModules:  (id: string, enabledmodules: string[]) =>
                      apiClient.put(`/school/${id}`, { enabledmodules }),
};

export const usersAPI = {
    getAll:     (role?: number)          => apiClient.get('/users', { params: { role } }),
    getById:    (id: string)             => apiClient.get(`/users/${id}`),
    getByEmail: (email: string)          => apiClient.get('/users', { params: { email } }),
    getStats:   ()                       => apiClient.get('/users', { params: { stats: true } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:     (data: any)              => apiClient.post('/users', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:     (id: string, data: any)  => apiClient.put(`/users/${id}`, data),
    delete:     (id: string)             => apiClient.delete(`/users/${id}`),
};

export const dashboardAPI = {
    getStats:    ()  => apiClient.get('/dashboard'),
    getFullData: ()  => apiClient.get('/dashboard', { params: { full: true } }),
};

export const reportsAPI = {
    getReportCard: (studentId: string, termId: string) =>
                       apiClient.get('/reports/report-card', { params: { studentId, termId } }),
};

export const announcementsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/announcements', { params }),
    getById:  (id: string)               => apiClient.get(`/announcements/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/announcements', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/announcements/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/announcements/${id}`),
};

export const activitiesAPI = {
    getAll:   (params?: { category?: number; status?: number }) =>
                  apiClient.get('/activities', { params }),
    getById:  (id: string)               => apiClient.get(`/activities/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/activities', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/activities/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/activities/${id}`),
};

export const activityParticipantsAPI = {
    getByActivity:  (activityId: string)                    => apiClient.get(`/activities/${activityId}/participants`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    enroll:         (activityId: string, data: any)         => apiClient.post(`/activities/${activityId}/participants`, data),
    unenroll:       (activityId: string, participantId: string) =>
                        apiClient.delete(`/activities/${activityId}/participants/${participantId}`),
};

export const staffLeaveAPI = {
    getAll:   (params?: { status?: number; employeeid?: string }) =>
                  apiClient.get('/staff-leave', { params }),
    getById:  (id: string)               => apiClient.get(`/staff-leave/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/staff-leave', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/staff-leave/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/staff-leave/${id}`),
};

export const medicalAPI = {
    getByStudent: (studentid: string)    => apiClient.get('/medical', { params: { studentid } }),
    getById:      (id: string)           => apiClient.get(`/medical/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:       (data: any)            => apiClient.post('/medical', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:       (id: string, data: any)=> apiClient.put(`/medical/${id}`, data),
    delete:       (id: string)           => apiClient.delete(`/medical/${id}`),
};

export const portalAPI = {
    getChildren:   ()               => apiClient.get('/portal/children'),
    getChildData:  (studentId: string) => apiClient.get(`/portal/children/${studentId}`),
};
