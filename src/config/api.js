// Dynamically set API base URL based on where the frontend is accessed from
const getApiBase = () => {
    let url = "";
    // If VITE_BACKEND_URL is set, use it (for production)
    if (import.meta.env.VITE_BACKEND_URL) {
        url = import.meta.env.VITE_BACKEND_URL;
    } else if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Assuming backend is on same domain or api subdomain
        url = `https://api.${window.location.hostname}`;
    } else {
        // For localhost development
        url = `http://localhost:5000`;
    }

    // Strip trailing slash if present to avoid double slashes in API calls
    return url.replace(/\/$/, "");
};

export const API_BASE = getApiBase();