// API Base URL Configuration

const getApiBase = () => {
    // Highest priority: Vite environment variable
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
    }

    // Local development
    if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ) {
        return "http://localhost:5000";
    }

    // Fallback to your Oracle VM
    return "http://80.225.243.51:10000";
};

export const API_BASE = getApiBase();

console.log("🌐 API Base:", API_BASE);
