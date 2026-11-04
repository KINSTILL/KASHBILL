export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'default-device-placeholder';
  let did = localStorage.getItem('cashbill_device_id');
  if (!did) {
    did = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('cashbill_device_id', did);
  }
  return did;
}

export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Navigateur';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Web';
}

