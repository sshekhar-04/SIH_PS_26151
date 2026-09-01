// ============================================================================
// Example: Axios Client with Closure Memory Token & 401 Queue Interceptor
// ============================================================================
import axios from 'axios';

let _accessToken = null;
let isRefreshing = false;
let failedQueue = [];

export const setAccessToken = (token) => {
    _accessToken = token;
};

export const clearAccessToken = () => {
    _accessToken = null;
};

export const getAccessToken = () => _accessToken;

export const apiClient = axios.create({
    withCredentials: true, // Send HttpOnly refresh cookie with cross-origin requests
});

// Request Interceptor: Attach Authorization Bearer from memory
apiClient.interceptors.request.use(
    (config) => {
        if (_accessToken) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${_accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: Seamless Token Refresh on 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error?.config;
        if (!originalRequest) return Promise.reject(error);

        // Avoid infinite loop on auth endpoints
        const isAuthEndpoint =
            originalRequest.url?.includes('/api/auth/refresh') ||
            originalRequest.url?.includes('/api/auth/logout');

        if (error?.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                // Queue concurrent requests while refresh is in progress
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Post to /refresh — HttpOnly cookie sent automatically
                const refreshRes = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
                const newToken = refreshRes.data?.accessToken;

                if (!newToken) {
                    throw new Error('No access token returned from refresh endpoint');
                }

                setAccessToken(newToken);
                processQueue(null, newToken);

                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                clearAccessToken();
                // Optional: window.location.href = '/login';
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
