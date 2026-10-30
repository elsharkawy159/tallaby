/** Error keys live under `blockedCustomers.errors`. */
export type BlockedCustomersErrorKey = "phoneInvalid" | "templateTooLong" | "readOnly" | "notFound" | "rateLimited" | "generic";

export type BlockedCustomersResult<T> = { success: true; data: T } | { success: false; error: BlockedCustomersErrorKey };
