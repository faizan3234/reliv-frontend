export function recoveryUrl(href, home = false, timestamp = Date.now()) {
  const url = new URL(home ? '/' : href, href);
  // Fetch fresh HTML after deployment; retain payment route/query/hash on retry.
  url.searchParams.set('reliv_reload', String(timestamp));
  return url.href;
}
