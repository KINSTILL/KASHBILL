import { describe, it, expect, beforeEach } from 'vitest';
import { clearDatabase } from '../../helpers/db';
import { createTestUser, resetUserCounter } from '../../helpers/factories';
import {
  registerDevice,
  revokeDevice,
  revokeAllOtherDevices,
  countActiveDevices,
  getDeviceLimit,
} from '@/lib/auth/device';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

describe('getDeviceLimit', () => {
  it('retourne 1 pour un utilisateur gratuit', () => {
    expect(getDeviceLimit({ proUntil: null })).toBe(1);
  });

  it('retourne 2 pour un utilisateur Pro', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expect(getDeviceLimit({ proUntil: future })).toBe(2);
  });

  it('retourne 1 si proUntil est dans le passé', () => {
    const past = new Date(Date.now() - 1000);
    expect(getDeviceLimit({ proUntil: past })).toBe(1);
  });
});

describe('registerDevice', () => {
  it('enregistre le premier appareil d\'un user gratuit', async () => {
    const user = await createTestUser();
    const result = await registerDevice(user, 'device-1', 'Mozilla/5.0', '1.1.1.1');
    expect(result.ok).toBe(true);
    expect(await countActiveDevices(user.id)).toBe(1);
  });

  it('rejette le 2e appareil pour un user gratuit', async () => {
    const user = await createTestUser();
    await registerDevice(user, 'device-1', 'UA', '1.1.1.1');
    const result = await registerDevice(user, 'device-2', 'UA', '1.1.1.2');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('LIMIT_REACHED');
      expect(result.activeDevices).toHaveLength(1);
    }
  });

  it('accepte le 2e appareil pour un user Pro', async () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const user = await createTestUser({ proUntil: future });
    await registerDevice(user, 'device-1', 'UA', '1.1.1.1');
    const result = await registerDevice(user, 'device-2', 'UA', '1.1.1.2');
    expect(result.ok).toBe(true);
  });

  it('réactive un appareil déjà connu et révoqué', async () => {
    const user = await createTestUser();
    await registerDevice(user, 'device-1', 'UA', '1.1.1.1');
    await revokeDevice(user.id, 'device-1');
    const result = await registerDevice(user, 'device-1', 'UA', '1.1.1.1');
    expect(result.ok).toBe(true);
  });
});

describe('revokeDevice', () => {
  it('révoque un appareil existant', async () => {
    const user = await createTestUser();
    await registerDevice(user, 'device-1', 'UA', '1.1.1.1');
    expect(await revokeDevice(user.id, 'device-1')).toBe(true);
    expect(await countActiveDevices(user.id)).toBe(0);
  });

  it('retourne false pour un appareil inexistant', async () => {
    const user = await createTestUser();
    expect(await revokeDevice(user.id, 'device-unknown')).toBe(false);
  });
});

describe('revokeAllOtherDevices', () => {
  it('révoque tous les appareils sauf celui spécifié', async () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const user = await createTestUser({ proUntil: future });
    await registerDevice(user, 'device-1', 'UA', '1.1.1.1');
    await registerDevice(user, 'device-2', 'UA', '1.1.1.2');
    const revoked = await revokeAllOtherDevices(user.id, 'device-1');
    expect(revoked).toBe(1);
    expect(await countActiveDevices(user.id)).toBe(1);
  });
});

