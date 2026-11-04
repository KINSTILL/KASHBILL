import type { Role, User } from '@prisma/client';

export type AdminAction =
  | 'view_users'
  | 'view_user_detail'
  | 'unblock_device'
  | 'reset_pin'
  | 'flag_user'
  | 'view_countries'
  | 'ban_user'
  | 'unban_user'
  | 'suspend_user'
  | 'grant_pro'
  | 'modify_subscription'
  | 'view_stats'
  | 'view_fraud_queue'
  | 'confirm_fraud'
  | 'dismiss_fraud'
  | 'manage_blacklist'
  | 'manage_thresholds'
  | 'view_audit'
  | 'view_countries_admin'
  | 'create_country'
  | 'update_country'
  | 'deactivate_country';

const SUPPORT_ACTIONS: AdminAction[] = [
  'view_users',
  'view_user_detail',
  'unblock_device',
  'reset_pin',
  'flag_user',
  'view_countries',
];

const ADMIN_ACTIONS: AdminAction[] = [
  ...SUPPORT_ACTIONS,
  'ban_user',
  'unban_user',
  'suspend_user',
  'grant_pro',
  'modify_subscription',
  'view_stats',
  'view_fraud_queue',
  'confirm_fraud',
  'dismiss_fraud',
  'manage_blacklist',
  'manage_thresholds',
  'view_audit',
  'view_countries_admin',
  'create_country',
  'update_country',
  'deactivate_country',
];

export function canDo(role: Role, action: AdminAction): boolean {
  if (role === 'ADMIN') return ADMIN_ACTIONS.includes(action);
  if (role === 'SUPPORT') return SUPPORT_ACTIONS.includes(action);
  return false;
}

export function isAdmin(user: Pick<User, 'role'>): boolean {
  return user.role === 'ADMIN' || user.role === 'SUPPORT';
}

export function isSupportOrAdmin(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPPORT';
}

/**
 * Actions qui nécessitent une ré-authentification PIN.
 */
export function requiresReauth(action: AdminAction): boolean {
  return (
    action === 'ban_user' ||
    action === 'suspend_user' ||
    action === 'grant_pro' ||
    action === 'modify_subscription' ||
    action === 'confirm_fraud' ||
    action === 'manage_blacklist' ||
    action === 'manage_thresholds' ||
    action === 'create_country' ||
    action === 'update_country' ||
    action === 'deactivate_country'
  );
}

