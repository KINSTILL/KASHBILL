import type { Role, User } from '@prisma/client';

export type AdminAction =
  // SUPPORT + ADMIN
  | 'view_users'
  | 'view_user_detail'
  | 'unblock_device'
  | 'reset_pin'
  | 'flag_user'
  | 'view_countries'
  // ADMIN uniquement
  | 'ban_user'
  | 'unban_user'
  | 'suspend_user'
  | 'grant_pro'
  | 'grant_addon'
  | 'modify_subscription'
  | 'view_stats'
  | 'view_fraud_queue'
  | 'confirm_fraud'
  | 'dismiss_fraud'
  | 'manage_blacklist'
  | 'manage_thresholds'
  | 'view_audit'
  | 'manage_countries'
  | 'create_support'
  | 'revoke_support'
  | 'list_supports'
  | 'manage_legal'
  | 'manage_faq'
  | 'manage_articles'
  | 'manage_addons'
  | 'manage_subscriptions'
  | 'grant_pro_bulk'
  | 'extend_subscription'
  | 'cancel_subscription'
  | 'view_invoices'
  | 'resend_invoice_email'
  | 'regenerate_invoice_pdf';

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
  'grant_addon',
  'modify_subscription',
  'view_stats',
  'view_fraud_queue',
  'confirm_fraud',
  'dismiss_fraud',
  'manage_blacklist',
  'manage_thresholds',
  'view_audit',
  'manage_countries',
  'create_support',
  'revoke_support',
  'list_supports',
  'manage_legal',
  'manage_faq',
  'manage_articles',
  'manage_addons',
  'manage_subscriptions',
  'grant_pro_bulk',
  'extend_subscription',
  'cancel_subscription',
  'view_invoices',
  'resend_invoice_email',
  'regenerate_invoice_pdf',
];

export function canDo(role: Role, action: AdminAction): boolean {
  if (role === 'ADMIN') return ADMIN_ACTIONS.includes(action);
  if (role === 'SUPPORT') return SUPPORT_ACTIONS.includes(action);
  return false;
}

export function isAdmin(user: Pick<User, 'role'>): boolean {
  return user.role === 'ADMIN' || user.role === 'SUPPORT';
}

export function requiresReauth(action: AdminAction): boolean {
  return (
    action === 'reset_pin' || // ← AJOUT CRITIQUE
    action === 'ban_user' ||
    action === 'unban_user' ||
    action === 'suspend_user' ||
    action === 'grant_pro' ||
    action === 'grant_addon' ||
    action === 'modify_subscription' ||
    action === 'confirm_fraud' ||
    action === 'dismiss_fraud' ||
    action === 'manage_blacklist' ||
    action === 'manage_thresholds' ||
    action === 'manage_countries' ||
    action === 'create_support' ||
    action === 'grant_pro_bulk' ||
    action === 'extend_subscription' ||
    action === 'cancel_subscription' ||
    action === 'resend_invoice_email' ||
    action === 'regenerate_invoice_pdf' ||
    action === 'revoke_support'
  );
}
