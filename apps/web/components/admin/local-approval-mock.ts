'use client';

const STORAGE_KEY = 'ravenue.admin.local-approvals.v1';

export const LOCAL_APPROVAL_UPDATED_EVENT = 'ravenue:local-approval-updated';

export type LocalApprovalStatus = 'pending' | 'approved';

type LocalApprovalRecord = Record<string, LocalApprovalStatus>;

function readApprovals(): LocalApprovalRecord {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalApprovalRecord) : {};
  } catch {
    return {};
  }
}

export function getLocalApprovalStatus(localId: string): LocalApprovalStatus | null {
  if (typeof window === 'undefined') return null;
  return readApprovals()[localId] ?? null;
}

export function markLocalApprovalPending(localId: string): void {
  try {
    const approvals = readApprovals();
    approvals[localId] = 'pending';
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(approvals));
    window.dispatchEvent(new Event(LOCAL_APPROVAL_UPDATED_EVENT));
  } catch {
    // El alta real ya concluyó; un fallo del storage mock no debe romper el cierre del diálogo.
  }
}
