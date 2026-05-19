import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Unwrap the response body so callers get the JSON payload directly.
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error.response?.data || { success: false, error: error.message };
    }
);

export default apiClient;
