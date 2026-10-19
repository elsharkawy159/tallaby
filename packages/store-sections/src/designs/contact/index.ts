import type { Design } from "../builder";
import { contactBranches } from "./contact-branches";
import { contactClassic } from "./contact-classic";
import { contactStrip } from "./contact-strip";
import { contactVisit } from "./contact-visit";
import { contactWhatsapp } from "./contact-whatsapp";

/** First is the default for new stores (the Classic template's Contact page). */
export const CONTACT_DESIGNS: readonly Design[] = [contactClassic, contactVisit, contactBranches, contactWhatsapp, contactStrip];
