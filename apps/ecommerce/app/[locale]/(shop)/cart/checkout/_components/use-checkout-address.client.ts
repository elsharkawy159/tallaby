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
  /** Egypt: the picked governorate code (`CAIRO`). */
  governorate: string;
  /** Only used when the store offers a country choice (F-61e). */
  country: string;
  /** Outside Egypt: the picked region key (`SA/RIYADH`). */
  regionKey: string;
  /** The picked city or area key, in Egypt (`EG/CAIRO/nasr-city`) or abroad. */
  cityKey: string;
};
type Prefill = { fullName?: string | null; phone?: string | null };
/** The store's countries (`checkoutCountries`), or null for the plain Egypt form. */
export type CheckoutCountries = { options: string[]; default: string } | null;

export type LocationState = "idle" | "locating" | "denied" | "failed";

const SAVE_AFTER_MS = 900;

const blankPlace = (countries: CheckoutCountries) => ({ country: countries?.default ?? EGYPT, regionKey: "", cityKey: "" });

/** The street part of a saved address: the lists show its place, so the city isn't repeated. */
function streetLine(a: SavedCheckoutAddress): string {
  return [a.addressLine1, a.addressLine2].map((part) => part?.trim()).filter(Boolean).join("، ");
}

/** A saved address is shown by its place keys, and only its own line in the address box. */
function fromSaved(a: SavedCheckoutAddress, countries: CheckoutCountries): Values {
  const parts = resolveAddressPlace(a)?.split("/") ?? [];
  const country = (countries ? parts[0] : null) ?? countries?.default ?? EGYPT;
  const inCountry = parts[0] === country;
  const abroad = country !== EGYPT;
  const cityKey = inCountry && parts[2] ? parts.join("/") : "";
  return {
    fullName: a.fullName ?? "",
    phone: a.phone ?? "",
    address: abroad || cityKey ? streetLine(a) : savedAddressLine(a),
    governorate: !abroad && inCountry ? (parts[1] ?? "") : "",
    country,
    regionKey: abroad && inCountry && parts[1] ? parts.slice(0, 2).join("/") : "",
    cityKey,
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
          ...(v.country === EGYPT
            ? { governorate: v.governorate || null, cityKey: v.cityKey || null }
            : { regionKey: v.regionKey || null, cityKey: v.cityKey || null }),
          ...(countriesRef.current ? { country: v.country } : {}),
          locationState: hint?.state ?? null,
          latitude: hint?.latitude ?? null,
          longitude: hint?.longitude ?? null,
        });
        if (!result.success) {
          setErrors(result.errors);
          if (result.failed) setSaveFailed(true);
          return null;
        }
        setErrors([]);
        setAddressId(result.data.id);
        stateRef.current.addressId = result.data.id;
        if (editCount.current === startedAt) {
          setDirty(false);
          stateRef.current.dirty = false;
          // The address or location named the governorate: show it in the lists.
          const [country, region] = result.data.placeKey.split("/");
          if (country === EGYPT && region && !v.governorate) {
            const next = { ...v, governorate: region, cityKey: result.data.placeKey.split("/").length > 2 ? result.data.placeKey : "" };
            stateRef.current.values = next;
            setValues(next);
          }
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
    setValues((prev) => ({
      ...prev,
      [field]: value,
      // A place below the one changed no longer applies.
      ...(field === "country" ? { regionKey: "", cityKey: "", governorate: "" } : {}),
      ...(field === "regionKey" || field === "governorate" ? { cityKey: "" } : {}),
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
        // The location decides the governorate and area again, and the save fills the lists.
        setValues((prev) => ({ ...prev, address: line.slice(0, 200), ...(prev.country === EGYPT ? { governorate: "", cityKey: "" } : {}) }));
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
    setField,
    ensureSaved,
    selectSaved,
    startNew,
    detectLocation,
    errorFor,
    markTouched: (field: CheckoutAddressField) => setTouched((prev) => ({ ...prev, [field]: true })),
  };
}
