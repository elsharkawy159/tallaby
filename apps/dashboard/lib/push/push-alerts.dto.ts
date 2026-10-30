import { z } from "zod";
import { isAllowedPushEndpoint } from "./push-alerts.lib";

const base64Url = (max: number) => z.string().min(1).max(max).regex(/^[A-Za-z0-9_-]+={0,2}$/);

/** `PushSubscription.toJSON()` from the browser. Only known push services are accepted. */
export const pushSubscriptionInputSchema = z.object({
  endpoint: z
    .string()
    .max(1000)
    .refine((value) => isAllowedPushEndpoint(value), "endpoint"),
  keys: z.object({
    p256dh: base64Url(200),
    auth: base64Url(100),
  }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;

export const pushEndpointInputSchema = z.string().max(1000).refine((value) => isAllowedPushEndpoint(value));

export const pushPrefsInputSchema = z
  .object({
    newOrder: z.boolean(),
    orderProblem: z.boolean(),
    lowStock: z.boolean(),
  })
  .strict();
