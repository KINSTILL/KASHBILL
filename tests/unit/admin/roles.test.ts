import { describe, it, expect } from 'vitest';
import { canDo, isAdmin, requiresReauth } from '@/lib/admin/roles';

describe('isAdmin', () => {
  it('true pour ADMIN et SUPPORT', () => {
    expect(isAdmin({ role: 'ADMIN' })).toBe(true);
    expect(isAdmin({ role: 'SUPPORT' })).toBe(true);
  });
  it('false pour USER', () => {
    expect(isAdmin({ role: 'USER' })).toBe(false);
  });
});

describe('canDo', () => {
  it('SUPPORT peut voir les users', () => {
    expect(canDo('SUPPORT', 'view_users')).toBe(true);
  });
  it('SUPPORT ne peut pas bannir', () => {
    expect(canDo('SUPPORT', 'ban_user')).toBe(false);
  });
  it('ADMIN peut tout', () => {
    expect(canDo('ADMIN', 'ban_user')).toBe(true);
    expect(canDo('ADMIN', 'view_users')).toBe(true);
  });
  it('USER ne peut rien', () => {
    expect(canDo('USER', 'view_users')).toBe(false);
    expect(canDo('USER', 'ban_user')).toBe(false);
  });
});

describe('requiresReauth', () => {
  it('true pour les actions critiques', () => {
    expect(requiresReauth('ban_user')).toBe(true);
    expect(requiresReauth('grant_pro')).toBe(true);
    expect(requiresReauth('confirm_fraud')).toBe(true);
  });
  it('false pour les actions de consultation', () => {
    expect(requiresReauth('view_users')).toBe(false);
    expect(requiresReauth('view_stats')).toBe(false);
  });
});

