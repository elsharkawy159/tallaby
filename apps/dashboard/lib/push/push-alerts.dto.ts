import { z } from "zod";

export {
  pushEndpointInputSchema,
  pushSubscriptionInputSchema,
  type PushSubscriptionInput,
} from "@workspace/lib/push";

export const pushPrefsInputSchema = z
  .object({
    newOrder: z.boolean(),
    orderProblem: z.boolean(),
    lowStock: z.boolean(),
    account: z.boolean(),
  })
  .strict();
