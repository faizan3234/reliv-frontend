const resolveApiBase = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname === "192.168.50.1" || hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:5000`;
    }
  }
  return "http://192.168.50.1:5000";
};

export const API_BASE = resolveApiBase();
