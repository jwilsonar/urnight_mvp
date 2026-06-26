export const OPS_ERROR_CODES = {
  SETTING_NOT_FOUND: 'ops/setting-not-found',
  SUPPORT_TICKET_NOT_FOUND: 'ops/support-ticket-not-found',
} as const;

export type OpsErrorCode = (typeof OPS_ERROR_CODES)[keyof typeof OPS_ERROR_CODES];
