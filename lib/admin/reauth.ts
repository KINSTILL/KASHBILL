import { signReauthToken, verifyReauthToken } from '@/lib/auth/jwt';

export async function issueReauthToken(userId: string): Promise<string> {
  return signReauthToken(userId);
}

export async function validateReauthToken(
  token: string | null,
  userId: string
): Promise<boolean> {
  if (!token) return false;
  return verifyReauthToken(token, userId);
}

