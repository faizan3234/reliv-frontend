export function isPhoneExperience(pathname, hostname = window.location.hostname, port = window.location.port) {
  return ['reliv7.vercel.app', 'mail-request-m33c.vercel.app'].includes(hostname) || port === '5000' ||
    /^\/(advertise|pay|mobile-entry|photo-upload|h)(\/|$)/.test(pathname);
}

export function usesNativeScrolling(pathname, hostname, port) {
  return isPhoneExperience(pathname, hostname, port) || /^\/admin(?:\/|$|-)/.test(pathname);
}
