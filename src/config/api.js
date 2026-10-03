export const resolveApiBase = (env = {}, location = {}) => {
  const hostname = location?.hostname;
  const isLocalKiosk = hostname && (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  );
  if (isLocalKiosk) {
    return `http://${hostname}:5000`;
  }
  if (env.VITE_BACKEND_URL) {
    return env.VITE_BACKEND_URL;
  }
  if (hostname && !hostname.includes('vercel.app') && !hostname.includes('github.io')) {
    return `http://${hostname}:5000`;
  }
  return "http://192.168.50.1:5000";
};

export const API_BASE = resolveApiBase(import.meta.env, typeof window === 'undefined' ? {} : window.location);
