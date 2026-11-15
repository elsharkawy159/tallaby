import { z } from "zod";
import { ROADMAP_CATEGORIES } from "./roadmap.types";

export const ROADMAP_TITLE_MAX = 80;
export const ROADMAP_DESCRIPTION_MAX = 1000;

export const suggestFeatureSchema = z.object({
  title: z.string().trim().min(3).max(ROADMAP_TITLE_MAX),
  category: z.enum(ROADMAP_CATEGORIES),
  description: z.string().trim().min(10).max(ROADMAP_DESCRIPTION_MAX),
});
export type SuggestFeatureInput = z.infer<typeof suggestFeatureSchema>;

export const voteFeatureSchema = z.object({ id: z.string().uuid() });
