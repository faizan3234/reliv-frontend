// Dynamically set API base URL based on where the frontend is accessed from
const getApiBase = () => {
    // If VITE_BACKEND_URL is set, use it
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }
    
    // Use the same hostname as the frontend but with backend port
    const hostname = window.location.hostname;
    return `http://${hostname}:10000`;
};

export const API_BASE = getApiBase();