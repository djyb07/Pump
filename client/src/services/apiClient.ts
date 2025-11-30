import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token to all requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle authentication errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 (Unauthorized - token expired) and 403 (Forbidden - invalid token)
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Clear authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Redirect to login page
            window.location.href = '/login';

            // You can add a notification here if you have a toast library
            console.log('Session expired. Please login again.');
        }

        return Promise.reject(error);
    }
);

export default apiClient;
