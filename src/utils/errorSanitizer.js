/**
 * Sanitizes error messages by removing sensitive information like URLs, 
 * hostnames, and IP addresses that might be leaked by the browser or fetch.
 * 
 * @param {any} err - The error object or string
 * @param {string} fallback - Fallback message if error is too complex
 * @returns {string} Sanitized error message
 */
export const sanitizeError = (err, fallback = "An unexpected error occurred. Please try again.") => {
  if (!err) return fallback;
  
  let msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
  
  // 1. Remove URLs (http, https, etc.)
  const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
  msg = msg.replace(urlRegex, "[Network]");
  
  // 2. Remove Hostnames / Domains (e.g. reliv-hanna.vercel.app)
  // This catches common TLDs and patterns
  const domainRegex = /\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:[a-z]{2,}|[a-z0-9-]{2,})\b/gi;
  msg = msg.replace(domainRegex, "[Access]");
  
  // 3. Remove IP addresses
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/gi;
  msg = msg.replace(ipRegex, "[Server]");
  
  // If the resulting message is too short or just tags, use fallback
  if (msg.trim().length < 5 || msg === "[Network]" || msg === "[Access]" || msg === "[Server]") {
    return fallback;
  }
  
  return msg;
};
