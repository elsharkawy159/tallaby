"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  ONBOARDING_STEPS,
  onboardingDefaults,
  type OnboardingFormValues,
} from "./become-seller.dto";

/**
 * Per-user, per-device draft of the onboarding wizard. Nothing is written to
 * the database until submit (a seller row would grant dashboard access), so
 * progress lives in localStorage. Every access is guarded: storage can be
 * unavailable in private windows.
 */
const DRAFT_VERSION = 1;
const keyFor = (userId: string) => `tallaby:seller-onboarding:${userId}`;

interface StoredDraft {
  version: number;
  step: number;
  values: Partial<OnboardingFormValues>;
}

function read(userId: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as StoredDraft;
    return draft?.version === DRAFT_VERSION ? draft : null;
  } catch {
    return null;
  }
}

/** Shallow-per-section merge so drafts from older field sets still load. */
function mergeWithDefaults(values: Partial<OnboardingFormValues>): OnboardingFormValues {
  const d = onboardingDefaults;
  return {
    ...d,
    ...values,
    legalAddress: { ...d.legalAddress, ...values.legalAddress, country: "EG" },
    services: { ...d.services, ...values.services },
    details: { ...d.details, ...values.details },
    pickup: { ...d.pickup, ...values.pickup },
    // Consent is never restored; it must be given on the submitting visit.
    acceptTerms: false,
  };
}

export function useOnboardingDraft(
  userId: string | undefined,
  form: UseFormReturn<OnboardingFormValues>,
  step: number,
  setStep: (step: number) => void
) {
  const [restored, setRestored] = useState(false);
  const ready = useRef(false);

  // Restore once.
  useEffect(() => {
    if (!userId) return;
    const draft = read(userId);
    if (draft) {
      form.reset(mergeWithDefaults(draft.values));
      // Resume on the last step the seller reached, but never past review.
      setStep(Math.min(Math.max(draft.step, 0), ONBOARDING_STEPS.indexOf("review")));
      setRestored(true);
    }
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Save on change (debounced) and on step change.
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      if (!ready.current) return;
      try {
        const { acceptTerms: _consent, ...values } = form.getValues();
        const draft: StoredDraft = { version: DRAFT_VERSION, step, values };
        window.localStorage.setItem(keyFor(userId), JSON.stringify(draft));
      } catch {
        // Storage full or blocked: the wizard still works, just without resume.
      }
    };
    save();
    const subscription = form.watch(() => {
      clearTimeout(timer);
      timer = setTimeout(save, 400);
    });
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [userId, form, step]);

  const clear = useCallback(() => {
    if (!userId) return;
    try {
      window.localStorage.removeItem(keyFor(userId));
    } catch {
      // ignore
    }
  }, [userId]);

  return { restored, clear, dismissRestored: () => setRestored(false) };
}
