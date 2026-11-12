/** Error keys live under `sizeChartApp.errors`. */
export type SizeChartErrorKey = "invalid" | "invalidTargets" | "limit" | "notFound" | "notInstalled" | "readOnly" | "rateLimited" | "generic";

export type SizeChartActionResult<T> = { success: true; data: T } | { success: false; error: SizeChartErrorKey };

/** A store category the seller can apply a chart to. */
export type SizeChartCategoryOption = { id: string; name: string };
