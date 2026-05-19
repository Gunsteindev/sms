import apiClient from './client';

export const libraryAPI = {
    getAll:   ()                         => apiClient.get('/library'),
    getById:  (id: string)               => apiClient.get(`/library/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/library', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/library/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/library/${id}`),
};

export const libraryLoansAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/library/loans', { params }),
    getById:  (id: string)               => apiClient.get(`/library/loans/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/library/loans', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/library/loans/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/library/loans/${id}`),
};

export const inventoryAPI = {
    getAll:   (category?: string) =>
                  apiClient.get('/inventory', { params: category ? { category } : {} }),
    getById:  (id: string)               => apiClient.get(`/inventory/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/inventory', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/inventory/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/inventory/${id}`),
};

export const inventoryMovementsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)          => apiClient.get('/inventory/movements', { params }),
    getById:  (id: string)            => apiClient.get(`/inventory/movements/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)             => apiClient.post('/inventory/movements', data),
    delete:   (id: string)            => apiClient.delete(`/inventory/movements/${id}`),
};

export const procurementAPI = {
    getAll:   (params?: { category?: number; status?: number }) =>
                  apiClient.get('/procurement', { params }),
    getById:  (id: string)               => apiClient.get(`/procurement/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/procurement', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/procurement/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/procurement/${id}`),
};

export const transportAPI = {
    getAll:   (status?: number) =>
                  apiClient.get('/transport', { params: status ? { status } : {} }),
    getById:  (id: string)               => apiClient.get(`/transport/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/transport', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/transport/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/transport/${id}`),
};

export const routeAssignmentsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)          => apiClient.get('/transport/assignments', { params }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)             => apiClient.post('/transport/assignments', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any) => apiClient.put(`/transport/assignments/${id}`, data),
    delete:   (id: string)            => apiClient.delete(`/transport/assignments/${id}`),
};

export const vehicleMaintenanceAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)          => apiClient.get('/transport/maintenance', { params }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)             => apiClient.post('/transport/maintenance', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any) => apiClient.put(`/transport/maintenance/${id}`, data),
    delete:   (id: string)            => apiClient.delete(`/transport/maintenance/${id}`),
};

export const poolSessionsAPI = {
    getAll:   (status?: number) =>
                  apiClient.get('/pool/sessions', { params: status ? { status } : {} }),
    getById:  (id: string)               => apiClient.get(`/pool/sessions/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/pool/sessions', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/pool/sessions/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/pool/sessions/${id}`),
};

export const poolRentalsAPI = {
    getAll:   ()                         => apiClient.get('/pool/rentals'),
    getById:  (id: string)               => apiClient.get(`/pool/rentals/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/pool/rentals', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/pool/rentals/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/pool/rentals/${id}`),
};

export const kitchenMenusAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/kitchen/menus', { params }),
    getById:  (id: string)               => apiClient.get(`/kitchen/menus/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/kitchen/menus', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/kitchen/menus/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/kitchen/menus/${id}`),
};

export const mealOrdersAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/kitchen/orders', { params }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/kitchen/orders', data),
    delete:   (id: string)               => apiClient.delete(`/kitchen/orders/${id}`),
};

export const poolTransactionsAPI = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll:   (params?: any)             => apiClient.get('/pool/transactions', { params }),
    getById:  (id: string)               => apiClient.get(`/pool/transactions/${id}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create:   (data: any)                => apiClient.post('/pool/transactions', data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update:   (id: string, data: any)    => apiClient.put(`/pool/transactions/${id}`, data),
    delete:   (id: string)               => apiClient.delete(`/pool/transactions/${id}`),
};
