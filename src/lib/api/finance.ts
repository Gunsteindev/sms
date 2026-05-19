import apiClient from './client';

export const feesAPI = {
    getStructures:  (gradelevel?: number, academicyear?: string) =>
                        apiClient.get('/fees', { params: { gradelevel, academicyear } }),
    getStudentFees: (studentId: string, academicyear?: string) =>
                        apiClient.get('/fees', { params: { studentId, academicyear } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createPayment:  (data: any)                => apiClient.post('/fees', data),
    getRevenue:     ()                         => apiClient.get('/fees', { params: { revenue: true } }),
};

export const feeStructuresAPI = {
    getAll:   (gradelevel?: number)      => apiClient.get('/finance/fee-structures', { params: { gradelevel } }),
    getById:  (id: string)               => apiClient.get(`/finance/fee-structures/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/finance/fee-structures', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/finance/fee-structures/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/finance/fee-structures/${id}`),
};

export const feeInvoicesAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/finance/fees', { params }),
    getById:  (id: string)               => apiClient.get(`/finance/fees/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/finance/fees', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/finance/fees/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/finance/fees/${id}`),
};

export const feePaymentsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/finance/fee-payments', { params }),
    getById:  (id: string)               => apiClient.get(`/finance/fee-payments/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/finance/fee-payments', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/finance/fee-payments/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/finance/fee-payments/${id}`),
};

export const scholarshipsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/finance/scholarships', { params }),
    getById:  (id: string)               => apiClient.get(`/finance/scholarships/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/finance/scholarships', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/finance/scholarships/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/finance/scholarships/${id}`),
};

export const feeTypesAPI = {
    getAll:   (category?: string) =>
                  apiClient.get('/fee-types', { params: category ? { category } : {} }),
    getById:  (id: string)               => apiClient.get(`/fee-types/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/fee-types', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/fee-types/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/fee-types/${id}`),
};
