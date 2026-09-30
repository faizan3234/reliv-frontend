export const resolveApiBase = (env = {}, location = {}) => {
    const hostname = location.hostname;
    if (hostname === "192.168.50.1" || hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:5000`;
    }
  if (env.VITE_BACKEND_URL) {
    return env.VITE_BACKEND_URL;
  }
  return "http://192.168.50.1:5000";
};

export const API_BASE = resolveApiBase(import.meta.env, typeof window === 'undefined' ? {} : window.location);
