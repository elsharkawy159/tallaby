# Simple one-page checkout

Roadmap: `ROADMAP.md` F-64. Owner's decisions: 2026-11-04.

## Goal

One form: full name, mobile, country, full address on one line, and note. A location button fills in the address. Saved details fill in next time. Item counts change on the checkout page.

## The main decision: the order path doesn't change

Today every step takes a `shippingAddressId`: `createOrder`, `placeOrderFromCart`, `recalculateCheckoutSummary`, coupons, order rate limits and `saveCheckoutLead`. They read `user_addresses`.

So the form saves into `user_addresses` and passes the row's id on. `place-order.ts` isn't touched, and zones, rates, cash-on-delivery rules, blocked phones and leads see an ordinary address. No migration.

## Saving

`saveCheckoutAddress` (`apps/ecommerce/actions/checkout-address.ts`) takes the session's user (a guest gets their `guest_uid` user row) and never a client user id.

- The form saves about a second after the customer stops typing, and always before an order is placed. Saves run one at a time, so a row isn't created twice.
- With an `addressId`, the row must belong to the session's user. Editing updates it, unless a past order uses it. Then a new row is created, because orders point at this row and a past order's address must not change.
- Without an `addressId`, the same phone, address and governorate reuse the existing row.
- A user's first address becomes the default. A new row replacing the default stays the default.
- An untouched saved address isn't saved again, so older rows keep their separate city and second line.

## Governorate

Shipping prices, zones and Bosta need a governorate (`state`). The form has none, so `resolveCheckoutGovernorate` reads it from the address on the server:

1. Look for governorate names in Arabic and English in the address, using the place data and `normalizeGovernorate`'s aliases.
2. Ignore a name right after a street word: "شارع الجيزة" isn't Giza, and "Cairo Road" isn't Cairo.
3. With no governorate named, a city or area name decides it: "مدينة نصر" is Cairo.
4. A named governorate that disagrees with a city found only in another governorate counts as two matches.

One match is used. With none or several, the form shows one governorate picker under the address. The picker's value, or the state from the location button, is used then, and only if it's a real governorate.

A wrong guess charges the wrong delivery price, so anything unclear asks. The address can't be saved without a governorate, so this form can never reach `place-order.ts`'s `__missing_state__` rate.

## City and area

`city` is required by the table. It gets the matched city or area name, in the customer's language, otherwise the governorate's name. `resolveAddressPlace` then prices a city zone if the name is known, and otherwise the governorate's zone. That's its existing behaviour.

**Bosta:** `resolveBostaDestination` also searches the address line. If no district is found, the order stays in the seller's shipping queue with `district_needed` and the seller picks a district. That path already exists; this form may reach it more often, since customers no longer pick a city.

## Country

Shown with Egypt selected, and read-only. Checkout can only validate Egyptian mobiles and addresses until F-61.

## Location button

Nothing is asked for or sent until the customer taps it. Then the browser asks for permission, `reverseGeocode` (`map-location-step.lib.ts`) calls Nominatim, and the address field fills in and stays editable. A loading icon shows meanwhile. On refusal or failure, a short message appears and the customer types.

**Nominatim limits:** the public service allows about one request a second per app, requires attribution and isn't meant for heavy use. Check its current policy before launch. The browser calls it directly, so each customer's request is theirs and comes only from a tap. The existing map already works this way, so no server proxy is built. Move to a proxy or a paid provider if traffic grows.

## Filling in

The default address fills in, else the newest. A signed-in user with no address gets their name and phone from the account. Edit Address lists the saved addresses and offers a new one, which clears this same form. Managing and deleting stay in the profile.

## Item counts

Plus and minus on the summary's lines use `updateCartItem`, which checks stock on the server, then `recalculateCheckoutSummary`. There's no pricing on the client. Removing the last item goes back to the cart. A coupon that stops applying is removed from the screen, with a message. `placeOrderFromCart` checks everything again.

## Note

With no store checkout form, the note sits under the address. A store with its own checkout form (F-25) keeps its card, which holds the note.

## Email

The form never asked for an email, so nothing changes here. A signed-in customer's email comes from their account. A guest has only a placeholder address, so **guests get no customer emails**, which limits what Order Notifications can do for stores with mostly guest customers.
