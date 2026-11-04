"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { savedAddressLine, type CheckoutAddressField } from "@workspace/lib/shipping/checkout-address";
import { EGYPT, resolveAddressPlace } from "@workspace/lib/places";
import { reverseGeocode } from "@/components/shared/address-dialog-steps/map-location-step.lib";
import { saveCheckoutAddress } from "@/actions/checkout-address";

export type SavedCheckoutAddress = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  isDefault?: boolean | null;
};

type Values = {
  fullName: string;
  phone: string;
  address: string;
  governorate: string;
  /** Only used when the store offers a country choice (F-61e). */
  country: string;
  regionKey: string;
  cityKey: string;
};
type Prefill = { fullName?: string | null; phone?: string | null };
/** The store's countries (`checkoutCountries`), or null for the plain Egypt form. */
export type CheckoutCountries = { options: string[]; default: string } | null;

export type LocationState = "idle" | "locating" | "denied" | "failed";

const SAVE_AFTER_MS = 900;

const blankPlace = (countries: CheckoutCountries) => ({ country: countries?.default ?? EGYPT, regionKey: "", cityKey: "" });

/** A saved address outside Egypt is shown by its place keys, and only its own line in the address box. */
function fromSaved(a: SavedCheckoutAddress, countries: CheckoutCountries): Values {
  const parts = countries ? (resolveAddressPlace(a)?.split("/") ?? []) : [];
  const country = parts[0] ?? countries?.default ?? EGYPT;
  const abroad = country !== EGYPT;
  return {
    fullName: a.fullName ?? "",
    phone: a.phone ?? "",
    address: abroad ? (a.addressLine1 ?? "") : savedAddressLine(a),
    governorate: abroad ? "" : (a.state ?? ""),
    country,
    regionKey: abroad && parts[1] ? parts.slice(0, 2).join("/") : "",
    cityKey: abroad && parts[2] ? parts.join("/") : "",
  };
}

/**
 * The simple checkout form's state (ROADMAP.md F-64). The customer's details are
 * saved as a row in their saved addresses, and everything after this point works
 * from that row's id, as it did before.
 */
export function useCheckoutAddress(input: {
  initial: SavedCheckoutAddress | null;
  prefill: Prefill;
  countries?: CheckoutCountries;
  onSaved: (address: SavedCheckoutAddress) => void;
  /** A new address was started, so no saved row applies until it's saved. */
  onCleared: () => void;
}) {
  const countries = input.countries ?? null;
  const [values, setValues] = useState<Values>(() =>
    input.initial
      ? fromSaved(input.initial, countries)
      : { fullName: input.prefill.fullName ?? "", phone: input.prefill.phone ?? "", address: "", governorate: "", ...blankPlace(countries) },
  );
  const [addressId, setAddressId] = useState<string | null>(input.initial?.id ?? null);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<CheckoutAddressField[]>([]);
  const [needsGovernorate, setNeedsGovernorate] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<CheckoutAddressField, boolean>>>({});
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [location, setLocation] = useState<LocationState>("idle");
  // Hints from the location button, cleared when the customer rewrites the address.
  const locationRef = useRef<{ state: string | null; latitude: number; longitude: number } | null>(null);

  const countriesRef = useRef(countries);
  countriesRef.current = countries;
  const stateRef = useRef({ values, addressId, dirty });
  stateRef.current = { values, addressId, dirty };
  const onSavedRef = useRef(input.onSaved);
  onSavedRef.current = input.onSaved;
  const onClearedRef = useRef(input.onCleared);
  onClearedRef.current = input.onCleared;
  const pickerOpen = useRef(false);
  pickerOpen.current = needsGovernorate;
  // Saves run one after another, so the first save's new id reaches the next.
  const chain = useRef<Promise<string | null>>(Promise.resolve(null));
  const editCount = useRef(0);

  const save = useCallback((): Promise<string | null> => {
    const run = chain.current.then(async () => {
      const { values: v, addressId: id, dirty: isDirty } = stateRef.current;
      if (!isDirty && id) return id;
      const startedAt = editCount.current;
      setSaving(true);
      setSaveFailed(false);
      try {
        const hint = locationRef.current;
        const result = await saveCheckoutAddress({
          addressId: id,
          fullName: v.fullName,
          phone: v.phone,
          address: v.address,
          governorate: v.governorate || null,
          ...(countriesRef.current ? { country: v.country, regionKey: v.regionKey || null, cityKey: v.cityKey || null } : {}),
          locationState: hint?.state ?? null,
          latitude: hint?.latitude ?? null,
          longitude: hint?.longitude ?? null,
        });
        if (!result.success) {
          setErrors(result.errors);
          if (result.needsGovernorate) setNeedsGovernorate(true);
          if (result.failed) setSaveFailed(true);
          return null;
        }
        setErrors([]);
        setAddressId(result.data.id);
        stateRef.current.addressId = result.data.id;
        // Keep the picker only while the text alone doesn't decide it.
        setNeedsGovernorate((open) => open && !!v.governorate && result.data.state === v.governorate);
        if (editCount.current === startedAt) {
          setDirty(false);
          stateRef.current.dirty = false;
        }
        onSavedRef.current({ ...result.data });
        return result.data.id;
      } catch {
        setSaveFailed(true);
        return null;
      } finally {
        setSaving(false);
      }
    });
    chain.current = run.catch(() => null);
    return run;
  }, []);

  const setField = useCallback((field: keyof Values, value: string) => {
    editCount.current += 1;
    if (field === "address") locationRef.current = null;
    // A saved address's governorate says nothing about newly written text: only
    // the picker, while it's showing, may keep deciding it.
    const dropGovernorate = field === "address" && !pickerOpen.current;
    setValues((prev) => ({
      ...prev,
      [field]: value,
      ...(dropGovernorate ? { governorate: "" } : {}),
      // A place below the one changed no longer applies.
      ...(field === "country" ? { regionKey: "", cityKey: "", governorate: "" } : {}),
      ...(field === "regionKey" ? { cityKey: "" } : {}),
    }));
    setDirty(true);
    stateRef.current.dirty = true;
    if (field === "address" && location !== "locating") setLocation("idle");
  }, [location]);

  // Saves when the customer pauses, once every field has something in it.
  useEffect(() => {
    if (!dirty) return;
    const { fullName, phone, address } = values;
    if (!fullName.trim() || !phone.trim() || !address.trim()) return;
    const timer = setTimeout(() => void save(), SAVE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [dirty, values, save]);

  /** Before placing an order: the saved row's id, or null with every error showing. */
  const ensureSaved = useCallback(async (): Promise<string | null> => {
    setShowAll(true);
    const id = await save();
    return id;
  }, [save]);

  const selectSaved = useCallback((address: SavedCheckoutAddress) => {
    editCount.current += 1;
    locationRef.current = null;
    const next = fromSaved(address, countriesRef.current);
    setValues(next);
    setAddressId(address.id);
    stateRef.current = { values: next, addressId: address.id, dirty: false };
    setDirty(false);
    setErrors([]);
    setNeedsGovernorate(false);
    setTouched({});
    setShowAll(false);
    setLocation("idle");
    onSavedRef.current(address);
  }, []);

  /** A new address: the same form, empty apart from who it's for. */
  const startNew = useCallback(() => {
    editCount.current += 1;
    locationRef.current = null;
    setValues((prev) => ({
      fullName: prev.fullName,
      phone: prev.phone,
      address: "",
      governorate: "",
      country: prev.country,
      regionKey: "",
      cityKey: "",
    }));
    setAddressId(null);
    stateRef.current.addressId = null;
    setDirty(true);
    setErrors([]);
    setNeedsGovernorate(false);
    setTouched({});
    setShowAll(false);
    setLocation("idle");
    onClearedRef.current();
  }, []);

  /** Asks only when the customer taps: the browser's location, then its address. */
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation("failed");
      return;
    }
    setLocation("locating");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const found = await reverseGeocode(coords.latitude, coords.longitude);
        const line = [found.building, found.street, found.area, found.city, found.state]
          .map((part) => part?.trim())
          .filter(Boolean)
          .join("، ");
        if (!line) {
          setLocation("failed");
          return;
        }
        editCount.current += 1;
        locationRef.current = { state: found.state || null, latitude: coords.latitude, longitude: coords.longitude };
        setValues((prev) => ({ ...prev, address: line.slice(0, 200), ...(pickerOpen.current ? {} : { governorate: "" }) }));
        setDirty(true);
        stateRef.current.dirty = true;
        setLocation("idle");
      },
      (error) => setLocation(error.code === error.PERMISSION_DENIED ? "denied" : "failed"),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }, []);

  const errorFor = (field: CheckoutAddressField) =>
    errors.includes(field) && (showAll || (touched[field] && field !== "governorate"));

  return {
    values,
    countries,
    addressId,
    saving,
    saveFailed,
    location,
    needsGovernorate,
    setField,
    ensureSaved,
    selectSaved,
    startNew,
    detectLocation,
    errorFor,
    markTouched: (field: CheckoutAddressField) => setTouched((prev) => ({ ...prev, [field]: true })),
  };
}
