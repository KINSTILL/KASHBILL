import { hash, verify } from '@node-rs/argon2';

const ARGON_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  algorithm: 2, // Argon2id
} as const;

export async function hashPin(pin: string): Promise<string> {
  return hash(pin, ARGON_OPTIONS);
}

export async function verifyPin(pinHash: string, pin: string): Promise<boolean> {
  try {
    return await verify(pinHash, pin, ARGON_OPTIONS);
  } catch {
    return false;
  }
}

