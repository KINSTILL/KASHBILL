export function isValidPin(pin: string): boolean {
  return typeof pin === 'string' && /^\d{6}$/.test(pin);
}

export function pinMatches(a: string, b: string): boolean {
  return a === b && isValidPin(a);
}

