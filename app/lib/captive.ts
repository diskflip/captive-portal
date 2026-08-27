export function isCaptiveBrowser(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return !ua.includes("safari/");
  }

  if (ua.includes("android")) {
    return ua.includes("captiveportallogin") || ua.includes("; wv)");
  }

  return false;
}
