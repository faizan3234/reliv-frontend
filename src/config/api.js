// Dynamically set API base URL based on where the frontend is accessed from
const getApiBase = () => {
    // If VITE_BACKEND_URL is set, use it (for production)
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }

    // For production domains, use HTTPS and backend subdomain
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Assuming backend is on same domain or api subdomain
        return `https://api.${window.location.hostname}`;
    }

    // For localhost development
    return `http://localhost:5000`;
};

export const API_BASE = getApiBase();