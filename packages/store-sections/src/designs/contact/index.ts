import type { Design } from "../builder";
import { contactBento } from "./contact-bento";
import { contactBig } from "./contact-big";
import { contactBranches } from "./contact-branches";
import { contactClassic } from "./contact-classic";
import { contactForm } from "./contact-form";
import { contactHours } from "./contact-hours";
import { contactRouter } from "./contact-router";
import { contactStrip } from "./contact-strip";
import { contactTeam } from "./contact-team";
import { contactVisit } from "./contact-visit";
import { contactWhatsapp } from "./contact-whatsapp";

/** First is the default for new stores (the Classic template's Contact page). */
export const CONTACT_DESIGNS: readonly Design[] = [contactClassic, contactForm, contactVisit, contactBranches, contactWhatsapp, contactStrip, contactHours, contactBento, contactBig, contactRouter, contactTeam];
