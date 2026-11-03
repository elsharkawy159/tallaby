/**
 * The switch for the AI Store Builder (ROADMAP.md F-54). Off unless set: the
 * entry links are hidden and the routes answer 404. It stays off in production
 * until 0141 is applied there and the live cost measurement has run (docs/ai.md
 * rule 12; design note §2, §9).
 */
export const builderEnabled = () => process.env.STORE_BUILDER_AI_ENABLED === "1";
