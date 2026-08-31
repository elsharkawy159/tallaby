export interface RiderSplitEntry {
  riderId: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  orderCount: number;
}

export interface BulkAssignSuccess {
  batchId: string;
  seq: number;
  /** e.g. "BATCH-00007" */
  batchLabel: string;
  assigned: number;
  providerCode: string;
  providerName: string;
  exportUrl: string | null;
  riderSplit: RiderSplitEntry[] | null;
}

export interface BulkInvalidOrder {
  orderId: string;
  orderNumber: string;
  reason: string;
}

/**
 * Not the shared `ActionResult<T>` — a blocked batch needs to report which
 * orders failed and why, which that envelope has no field for.
 */
export interface BulkAssignResult {
  success: boolean;
  data?: BulkAssignSuccess;
  error?: string;
  invalid?: BulkInvalidOrder[];
}

export interface BulkConfirmResult {
  success: boolean;
  confirmed?: number;
  error?: string;
}

export interface BulkStatusFailure {
  orderNumber: string;
  reason: string;
}

/** One bad order doesn't roll back the rest — each succeeds or fails independently. */
export interface BulkStatusResult {
  success: boolean;
  succeeded?: number;
  failed?: BulkStatusFailure[];
  error?: string;
}
