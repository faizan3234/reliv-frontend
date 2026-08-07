// Dynamically set API base URL

const getApiBase = () => {
  // Local development
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000";
  }

  // Production frontend on Oracle
  return "http://80.225.243.51:10000";
};

export const API_BASE = getApiBase();
