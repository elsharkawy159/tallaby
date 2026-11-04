import { describe, expect, it } from 'vitest'
import {
  matchGovernorateInText,
  parseCheckoutAddress,
  resolveCheckoutGovernorate,
  savedAddressLine,
  validGovernorate,
} from './checkout-address.lib'
import { childrenOf, resolveAddressPlace } from '../places'

const one = (text: string) => {
  const match = matchGovernorateInText(text)
  return match.kind === 'one' ? match.code : match.kind
}

describe('matchGovernorateInText', () => {
  it('reads Arabic and English governorate names', () => {
    expect(one('15 شارع النصر، القاهرة')).toBe('CAIRO')
    expect(one('شقة 4، الجيزة')).toBe('GIZA')
    expect(one('12 Tahrir St, Alexandria')).toBe('ALEXANDRIA')
    expect(one('building 3, Cairo Governorate')).toBe('CAIRO')
  })

  it('folds Arabic spelling', () => {
    expect(one('الاسكندريه')).toBe('ALEXANDRIA')
    expect(one('اسكندرية سيدي بشر')).toBe('ALEXANDRIA')
  })

  it('reads the two-word governorates whole', () => {
    expect(one('Kafr El Sheikh, near the station')).toBe('KAFR EL SHEIKH')
    expect(one('Dahab, South Sinai')).toBe('SOUTH SINAI')
    expect(one('Port Said')).toBe('PORT SAID')
  })

  it('does not take a street for a governorate', () => {
    expect(matchGovernorateInText('شارع الجيزة').kind).toBe('none')
    expect(one('شارع الجيزة، القاهرة')).toBe('CAIRO')
    expect(one('10 Cairo Road, Alexandria')).toBe('ALEXANDRIA')
  })

  it('uses a city when no governorate is named', () => {
    const match = matchGovernorateInText('مدينة نصر، عمارة 5')
    expect(match).toMatchObject({ kind: 'one', code: 'CAIRO' })
    expect(match.kind === 'one' && match.cityKey).toBe('EG/CAIRO/nasr-city')
  })

  it('asks when two governorates are named', () => {
    expect(matchGovernorateInText('القاهرة، الجيزة').kind).toBe('many')
  })

  it('asks when a city contradicts the governorate', () => {
    expect(matchGovernorateInText('مدينة نصر، الاسكندرية').kind).toBe('many')
  })

  it('finds nothing in an address with no place name', () => {
    expect(matchGovernorateInText('عمارة 5 الدور الثالث').kind).toBe('none')
    expect(matchGovernorateInText('').kind).toBe('none')
    expect(matchGovernorateInText(null).kind).toBe('none')
  })

  it('needs whole words', () => {
    expect(matchGovernorateInText('Giza123 block').kind).toBe('none')
    expect(matchGovernorateInText('Suezcanal apartments').kind).toBe('none')
  })
})

describe('validGovernorate', () => {
  it('takes real codes and geocoder text', () => {
    expect(validGovernorate('CAIRO')).toBe('CAIRO')
    expect(validGovernorate('Cairo Governorate')).toBe('CAIRO')
    expect(validGovernorate('محافظة الجيزة')).toBe('GIZA')
  })

  it('refuses everything else', () => {
    expect(validGovernorate('__missing_state__')).toBeNull()
    expect(validGovernorate('Riyadh')).toBeNull()
    expect(validGovernorate('')).toBeNull()
    expect(validGovernorate(null)).toBeNull()
  })
})

describe('resolveCheckoutGovernorate', () => {
  it('prefers the address text over a stale picker value', () => {
    expect(resolveCheckoutGovernorate({ address: 'شارع 9، الجيزة', picked: 'CAIRO' })?.code).toBe('GIZA')
  })

  it('uses the picker when the text is unclear', () => {
    expect(resolveCheckoutGovernorate({ address: 'عمارة 5 الدور الثالث', picked: 'ASWAN' })?.code).toBe('ASWAN')
    expect(resolveCheckoutGovernorate({ address: 'القاهرة، الجيزة', picked: 'GIZA' })?.code).toBe('GIZA')
  })

  it('uses the location state last', () => {
    expect(resolveCheckoutGovernorate({ address: 'عمارة 5', locationState: 'Cairo Governorate' })?.code).toBe('CAIRO')
    expect(resolveCheckoutGovernorate({ address: 'عمارة 5', picked: 'LUXOR', locationState: 'Cairo' })?.code).toBe('LUXOR')
  })

  it('returns null rather than guess', () => {
    expect(resolveCheckoutGovernorate({ address: 'عمارة 5', picked: 'not a place' })).toBeNull()
    expect(resolveCheckoutGovernorate({ address: 'عمارة 5' })).toBeNull()
  })
})

describe('parseCheckoutAddress', () => {
  const good = { fullName: 'سارة أحمد', phone: '01012345678', address: '15 شارع النصر، القاهرة' }

  it('fills the columns the table needs', () => {
    const parsed = parseCheckoutAddress(good, 'ar')
    expect(parsed).toMatchObject({
      ok: true,
      value: { state: 'CAIRO', country: 'Egypt', addressLine1: '15 شارع النصر، القاهرة', phone: '01012345678' },
    })
    expect(parsed.ok && parsed.value.city).toBeTruthy()
  })

  it('names a matched city, in the language of the checkout', () => {
    const en = parseCheckoutAddress({ ...good, address: 'Nasr City, Cairo' }, 'en')
    expect(en.ok && en.value.city).toBe('Nasr City')
  })

  it('cleans the phone', () => {
    const parsed = parseCheckoutAddress({ ...good, phone: '010 1234-5678' }, 'ar')
    expect(parsed.ok && parsed.value.phone).toBe('01012345678')
    const arabicDigits = parseCheckoutAddress({ ...good, phone: '٠١٠١٢٣٤٥٦٧٨' }, 'ar')
    expect(arabicDigits.ok && arabicDigits.value.phone).toBe('01012345678')
  })

  it('names each bad field', () => {
    const parsed = parseCheckoutAddress({ fullName: 'a', phone: '123', address: 'x' }, 'ar')
    expect(parsed).toEqual({ ok: false, errors: ['fullName', 'phone', 'address'], needsGovernorate: false })
  })

  it('asks for a governorate only for an address worth saving', () => {
    const parsed = parseCheckoutAddress({ ...good, address: 'عمارة 5 الدور الثالث' }, 'ar')
    expect(parsed).toEqual({ ok: false, errors: ['governorate'], needsGovernorate: true })
  })

  it('refuses a made-up governorate from the client', () => {
    const parsed = parseCheckoutAddress({ ...good, address: 'عمارة 5 الدور الثالث', governorate: '__missing_state__' }, 'ar')
    expect(parsed.ok).toBe(false)
  })

  it('refuses a malformed payload and a too-long address', () => {
    expect(parseCheckoutAddress(null, 'ar').ok).toBe(false)
    expect(parseCheckoutAddress({ ...good, address: `القاهرة ${'x'.repeat(200)}` }, 'ar').ok).toBe(false)
    expect(parseCheckoutAddress({ ...good, latitude: 500 }, 'ar').ok).toBe(false)
  })
})

describe('savedAddressLine', () => {
  it('joins the columns a saved address has', () => {
    expect(savedAddressLine({ addressLine1: '5 شارع النصر', addressLine2: 'الدور 2', city: 'المعادي' })).toBe(
      '5 شارع النصر، الدور 2، المعادي',
    )
  })

  it('does not repeat a city already in the line', () => {
    expect(savedAddressLine({ addressLine1: '5 شارع النصر، المعادي', city: 'المعادي' })).toBe('5 شارع النصر، المعادي')
    expect(savedAddressLine({ addressLine1: 'x' })).toBe('x')
  })
})

describe("parseCheckoutAddress abroad (F-61e)", () => {
  const base = { fullName: "Sara Ahmed", phone: "0512345678", address: "12 King Fahd Road", country: "SA" };

  it("saves the picked place's names, which resolve back to the same place", () => {
    const result = parseCheckoutAddress({ ...base, regionKey: "SA/RIYADH", cityKey: "SA/RIYADH/riyadh" }, "en");
    expect(result).toMatchObject({ ok: true, value: { phone: "+966512345678", country: "Saudi Arabia", state: "Riyadh", city: "Riyadh" } });
    if (result.ok) expect(resolveAddressPlace(result.value)).toBe("SA/RIYADH/riyadh");
  });

  it("resolves every Saudi region and city back to itself, in both languages", () => {
    for (const locale of ["ar", "en"]) {
      for (const region of childrenOf("SA")) {
        const regionOnly = parseCheckoutAddress({ ...base, regionKey: region.key }, locale);
        if (!regionOnly.ok) throw new Error(region.key);
        expect(resolveAddressPlace(regionOnly.value)?.startsWith(region.key)).toBe(true);
        for (const city of childrenOf(region.key)) {
          const parsed = parseCheckoutAddress({ ...base, regionKey: region.key, cityKey: city.key }, locale);
          if (!parsed.ok) throw new Error(city.key);
          expect(resolveAddressPlace(parsed.value)).toBe(city.key);
        }
      }
    }
  });

  it("asks for a region where the country has them, and checks the phone by country", () => {
    expect(parseCheckoutAddress(base, "en")).toMatchObject({ ok: false, errors: ["region"] });
    expect(parseCheckoutAddress({ ...base, phone: "01012345678", regionKey: "SA/RIYADH" }, "en")).toMatchObject({ ok: false, errors: ["phone"] });
    expect(parseCheckoutAddress({ ...base, regionKey: "EG/CAIRO" }, "en")).toMatchObject({ ok: false, errors: ["region"] });
    expect(parseCheckoutAddress({ ...base, regionKey: "SA/RIYADH", cityKey: "EG/CAIRO/nasr-city" }, "en")).toMatchObject({ ok: true, value: { city: "Riyadh" } });
  });

  it("takes a country with no regions in the data on its address line", () => {
    const result = parseCheckoutAddress({ ...base, country: "FR", phone: "+33 6 12 34 56 78" }, "en");
    expect(result).toMatchObject({ ok: true, value: { country: "France", phone: "+33612345678" } });
    if (result.ok) expect(resolveAddressPlace(result.value)).toBe("FR");
  });

  it("leaves the Egyptian form exactly as it was", () => {
    const plain = { fullName: "Sara Ahmed", phone: "01012345678", address: "شارع التحرير، القاهرة" };
    expect(parseCheckoutAddress({ ...plain, country: "EG" }, "ar")).toEqual(parseCheckoutAddress(plain, "ar"));
    expect(parseCheckoutAddress(plain, "ar")).toMatchObject({ ok: true, value: { country: "Egypt", state: "CAIRO", phone: "01012345678" } });
    expect(parseCheckoutAddress({ ...plain, phone: "0512345678" }, "ar")).toMatchObject({ ok: false, errors: ["phone"] });
  });
});
