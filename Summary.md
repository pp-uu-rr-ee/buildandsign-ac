# AC Services Platform — Project State Summary

> Last updated end of the variants + inquiry-flow refactor session. This file is
> the single source of truth for picking the project back up in a new session.
> When something here contradicts older memory, **this file wins**.

---

## 1. Project Overview

**Purpose:** Full-stack Air Conditioning business platform for Thailand (THB).
Dual-purpose: an e-commerce-style **AC catalogue with inquiry checkout** (no
online payment) + a **service booking system** for technicians.

**Big shifts made in the latest session (read this first):**
1. **Payments fully removed.** No more Opn/Omise, no saved cards, no card forms,
   no `/api/payment/*`. Buying an AC and settling a booking are now **inquiry /
   contact flows** (Line / Facebook / phone). DB columns for payment are dropped.
2. **Products are now series + variants.** A `products` row is a *series* (e.g.
   "Carrier Inverter Split Type"); each buyable size/SKU is a `product_variants`
   row. Cart, orders, stock, and pricing all key off **variant**.
3. **Hybrid specs.** Common specs are typed columns (brand, eer, voltage,
   cooling BTU, room size, energy rating, …); anything else stays in a
   `specifications` JSONB. Energy rating lives on the **variant** and renders as
   star icons.
4. **Customer identity is the account.** name / email / phone come from the
   logged-in user row. Checkout & booking show them read-only — no re-entry.
5. **DB is Supabase Postgres** (pooled at runtime, direct URL for migrations).
6. **66 product series / ~261 variants imported** from a Google Sheet via a
   custom CSV importer.

**Status:** Working end-to-end. TypeScript clean (`npx tsc --noEmit` passes).
`npm run build` succeeds.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.7 (App Router, Turbopack). **Breaking-changed vs training data — read `node_modules/next/dist/docs/` before writing Next-specific code.** |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + @tailwindcss/typography |
| UI primitives | shadcn/ui built on **@base-ui/react** (NOT Radix — no `asChild`, different conventions; read component source in `src/components/ui/` before using a new primitive) |
| Database | **Supabase Postgres** |
| ORM | Drizzle ORM (`drizzle-orm/node-postgres`, `pg` Pool) |
| Auth | Custom JWT via `jose`, httpOnly cookie (`ac_session`), Edge-compatible |
| Password hashing | `bcryptjs` |
| Cart state | Zustand `persist` (localStorage key `ac-cart`, **version 3**, keyed by variantId) |
| Validation | Zod v4 (server-side, inside actions) |
| Forms | Native `<form>` + `useActionState` / `useTransition` (no react-hook-form for app forms) |
| Toasts | Sonner |
| Icons | Lucide React (note: **no `Facebook` icon export** — use `ExternalLink`) |
| Dark mode | CSS vars + `.dark` class on `<html>`, FOUC-free blocking script |
| i18n | Custom cookie-based, Thai default — `src/i18n/en.ts` + `src/i18n/th.ts` |
| Email | Resend (booking confirm, order/inquiry receipt, password reset, quote-ready) |
| Image storage | Cloudflare R2 via `@aws-sdk/client-s3` (server-side upload, no CORS) |
| Dev tooling | `tsx` for scripts, `dotenv`, `drizzle-kit` |

---

## 3. Database & Supabase

**Connection (`.env`):**
```bash
# Pooled (transaction mode, port 6543) — app runtime
DATABASE_URL="postgresql://postgres.<ref>:<pwd>@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
# Direct (port 5432) — migrations / seed / studio
DIRECT_URL="postgresql://postgres.<ref>:<pwd>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```
- `src/db/index.ts` uses `DATABASE_URL` via a `pg` Pool (`max: 10`).
- `drizzle.config.ts` should point migrations at **`DIRECT_URL`** (pooled
  transaction mode can't run some migration DDL). Confirm this is set if a
  migration ever hangs.
- The app connects as the `postgres` superuser, which **bypasses RLS**.

**RLS:** Migration `0009_enable_rls.sql` (hand-written) enables RLS on every
table + adds anon read policies for public catalogues (active products, product
images of active products, published posts, tags). All private tables (users,
orders, order_items, bookings, technicians, password_reset_tokens, savedCards
back when it existed) have **no anon policy = full deny**. This is
defense-in-depth against someone hitting the Supabase REST API with the anon
key. The app itself is unaffected (superuser).

**Migrations (apply with `npm run db:migrate`):**

| # | File | What |
|---|---|---|
| 0000 | `0000_heavy_blindfold.sql` | initial schema |
| 0001 | `0001_product_i18n.sql` | product TH columns |
| 0002 | `0002_password_reset_tokens.sql` | reset tokens table |
| 0003 | `0003_optimal_talisman.sql` | (was saved_cards + opn_customer_id — later dropped) |
| 0004 | `0004_thb_currency.sql` | `*_in_cents` → `*_in_satang` |
| 0005 / 0006 | misc | earlier feature migrations |
| 0007 | `0007_next_quasar.sql` | **drop payment**: saved_cards table, users.opn_customer_id, orders payment cols, bookings deposit/balance cols, payment_status enum; order_status enum loses `refunded` |
| 0008 | `0008_cold_venom.sql` | **product_variants table**; drop price/sku/stock/lowStockThreshold from products; order_items gets `product_variant_id` + `product_variant_size` |
| 0009 | `0009_enable_rls.sql` | hand-written RLS (renamed from a generated `0008_enable_rls`) |
| 0009b | `0009_petite_energizer.sql` | **typed spec columns** (products: brand, eer, voltage, refrigerant, warranty_text, energy_rating; product_variants: cooling_capacity_btu, noise_level_db, dimensions, power_consumption_w) |
| 0010 | `0010_room_size.sql` | drop `power_consumption_w`, add `room_size_sqm` (integer) |
| 0011 | `0011_room_size_label.sql` | `room_size_sqm` integer → **varchar(30)** (allow ranges like "25-30") |
| 0012 | `0012_move_energy_rating.sql` | drop `products.energy_rating`; drop `product_variants.dimensions`; add `product_variants.energy_rating` |

> Note: there is filename overlap around 0008/0009 because the RLS file was
> hand-added. The journal (`src/db/migrations/meta/_journal.json`) is the real
> order of truth; later migrations (0010–0012) were hand-written + journal
> entries + stub snapshot files added because `drizzle-kit generate` needs a TTY
> and errored in this non-interactive shell. **When adding a migration in this
> environment: write the SQL, copy the previous `meta/NNNN_snapshot.json` to the
> new number, and append a `_journal.json` entry, then `npm run db:migrate`.**

---

## 4. Data Model (current)

### `products` = a series (shared, customer-facing)
`id, name, nameTh, slug (unique), description, descriptionTh, shortDescription,
shortDescriptionTh, category (enum), status (enum: active|draft|archived|
out_of_stock), brand, eer (numeric 5,2 → string), voltage, refrigerant,
warrantyText, specifications (JSONB extras), metaTitle, metaDescription,
isFeatured, sortOrder, createdAt, updatedAt`

- **No price / sku / stock here** — those live on variants.
- `category` enum: split | window | portable | central | cassette | ducted.
  CSV "Wall-mounted" maps to `split`.

### `product_variants` = one buyable SKU
`id, productId (FK cascade), size (e.g. "1.0 HP"), sortOrder (smaller first),
sku (unique), priceInSatang, comparePriceInSatang, stock, lowStockThreshold,
coolingCapacityBtu (int), noiseLevelDb (numeric 4,1 → string), energyRating
(varchar — "5", "5*", "5**", "5***", "5****", "5*****"), roomSizeSqm (varchar,
free text e.g. "25-30"), specifications (JSONB extras), createdAt, updatedAt`

### `product_images`
`id, productId (FK cascade), url, altText, isPrimary, sortOrder` — series-level
(shared across all variants).

### `order_items`
Adds `productVariantId` (FK set null) + `productVariantSize` (varchar snapshot)
on top of the existing `productId`, `productName`, `productSku`,
`unitPriceInSatang`, `quantity`, `totalInSatang`.

### `orders`
No payment columns. `status` enum: pending | confirmed | processing | shipped |
delivered | cancelled. New inquiry orders are created `status=pending`,
`paymentMethod="inquiry"` is **not** a column anymore — orders just carry totals
+ shippingAddress JSONB (incl. `email`). Admin confirms an inquiry which
decrements stock via `confirmOrderAtomic`.

### `bookings`
Payment columns removed (no deposit/balance/payment_status). Keeps:
`quotedPriceInSatang, quoteConfirmedAt, quoteAcceptedAt`, status enum (pending |
confirmed | in_progress | completed | cancelled | no_show), serviceAddress JSONB,
acUnitDetails JSONB, technicianNotes, review fields, etc.

### `users`
`opn_customer_id` dropped. Standard fields incl. `phone` (now required for
ordering/booking).

---

## 5. Key Flows

### AC purchase = inquiry (no payment)
1. Product detail (`/products/[slug]`) → `ProductVariantPicker` (client): pick a
   **size** → price / discount / stock / specs table all update live. Add to
   cart stores `{variantId, productId, name, size, slug, imageUrl,
   unitPriceInSatang, quantity}`.
2. Cart (`/cart`) + drawer show series name + `· size`.
3. Checkout (`/checkout`, login required): contact info (name/email/phone) shown
   **read-only** from the account with an "Edit account" link; only the shipping
   **address** is entered. Submit button = "ส่งคำสอบถาม / Send Inquiry".
4. `createOrderAction`: re-prices each line by `variantId` from the DB, snapshots
   name + size, creates `orders` row `status=pending` (stock NOT decremented),
   fires a best-effort Resend receipt, redirects to confirmation.
5. Confirmation (`/orders/[id]/confirmation`): shows reference number, estimated
   total, and **contact channel buttons** (Line / Facebook / phone) from env.
6. Admin confirms later → `confirmOrderAtomic(orderId, items)` decrements
   **variant** stock and sets order `confirmed`.

### Service booking
- `/services` → choose service → `/book/[serviceId]` (login required).
  `BookingWizard` (3 steps): date/time → details (contact read-only from
  account, address + AC units entered) → review → submit. No payment.
- Slot engine: `src/lib/queries/availability.ts` returns all slots; only
  `confirmed/in_progress/completed` bookings block a slot. `SlotPicker` shows
  booked slots **greyed out + disabled** (not hidden) so the grid is stable.
- `BookingCalendar` builds date strings with **local** y/m/d (not
  `toISOString()`) to avoid the off-by-one-day timezone bug.
- Flow: customer books (pending) → admin sets a quote (`setBookingQuoteAction`)
  → customer **accepts** quote (`acceptBookingQuoteAction`, slot locked,
  conflict-checked in a transaction) → settle offline. The old
  `BookingPayBalance` is now `BookingContactToPay` (shows quoted total + Line/FB/
  phone buttons).
- Booking confirmation page also shows the Line/FB/phone contact block.

### Auth / identity
- Register requires name + email + phone (all required).
- `updateProfileAction` (in `src/lib/actions/auth.ts`) lets users edit name +
  phone on `/account` (email read-only); refreshes the JWT so the nav name
  updates instantly. Phone is mandatory before ordering/booking — server actions
  reject with a message + link to `/account` if missing.
- `ProfileForm` (`src/components/account/ProfileForm.tsx`) auto-opens its editor
  when phone is missing.

---

## 6. Admin

- `/admin/products` — list shows series with **min price ("From ฿X")**, total
  stock, and variant count. Uses the reusable **`AdminListToolbar`** (debounced
  smart search + status chips + category dropdown). Row actions: Edit, toggle
  status, **Delete** (`DeleteProductButton` → `deleteProductAction`, type
  "delete" to confirm).
- `/admin/products/[id]/edit` — three sections:
  1. **Product images** (`ProductImageManager`).
  2. **Variants** (`VariantsManager`) — add / inline-edit / delete each size.
     Fields: size, sortOrder, sku, price (฿), compare (฿), stock, **low @**
     (lowStockThreshold), Cooling BTU, Noise (dB), **Energy Rating dropdown**
     (`5 / 5* / 5** / 5*** / 5**** / 5*****`), Room size (m², free text). Inline
     edit by clicking a row.
  3. **Product details** (`ProductEditForm`) — name/slug/desc (EN+TH),
     category, status, **typed series specs** (Brand, EER, Voltage, Refrigerant,
     Warranty), `SpecsEditor` for free-form extras, featured checkbox.
- `/admin/products/new` (`ProductCreateForm`) — series-level only; you add
  variants after creation on the edit page.
- `/admin/orders` and `/admin/bookings` — also use `AdminListToolbar`. Orders
  search covers order#, customer name/phone/email/city (JSONB). Bookings search
  covers booking#, customer fields, and **technician name** (needs the join in
  the count query too).
- `/admin/customers` — **real page now** (was a placeholder). `getCustomers`
  lists role=customer users with correlated-subquery aggregates: order count,
  booking count, total spent (orders past pending). Search name/email/phone +
  verified chip filter. Order count links to `/admin/orders?search=<email>`.
- `/admin/dashboard` — `getDashboardStats` low-stock count now joins
  `product_variants` (stock ≤ lowStockThreshold AND parent active); revenue =
  sum of orders with status `delivered`.

### Admin gotchas
- **`isFeatured` checkbox bug (fixed):** `z.coerce.boolean()` makes
  `Boolean("false") === true`. `productSchema.isFeatured` now uses
  `z.union([z.literal("true"), z.literal("false"), z.boolean()]).transform(...)`.
  Don't reintroduce `z.coerce.boolean()` for checkbox-as-string.
- **Server Action body limit:** image upload goes through a Server Action;
  default is 1 MB. `next.config.ts` sets `experimental.serverActions.bodySizeLimit
  = "12mb"` (uploads capped at 10 MB in code). Restart dev server after editing
  next.config.

---

## 7. Specs rendering (product detail)

`ProductVariantPicker` builds `mergedSpecs` in this order so **variant-specific
values appear at the TOP** of the table, then series-shared values:
```
typedVariant (Cooling Capacity, Noise Level, Energy Rating, Recommended Room Size)
→ variant JSONB extras
→ typedShared (Brand, EER, Voltage, Refrigerant, Warranty)
→ series JSONB extras
```
- `renderSpecValue(value)` turns a trailing-asterisk value (`"5***"`) into the
  leading text + that many filled amber **star icons** (`<Star fill-current>`).
  Generic — only energy rating uses this pattern today.
- Energy-rating label is localized: "ฉลากประหยัดไฟ" (th) / "Energy Rating" (en).
- Room size renders verbatim + " m²" (e.g. "25-30 m²").

---

## 8. Google Sheet → DB import

**Script:** `src/db/import-from-sheet.ts` (`npm run db:import-sheet -- <url> [--replace]`).
- Reads a **published CSV** URL (or local file). Custom inline CSV parser
  (handles quotes/commas/newlines, BOM).
- **One row per variant.** Groups by `series_name` (NOT the per-row `slug`,
  which is a per-variant SKU slug). Series slug derived from `series_name`.
- Header aliasing (`HEADER_ALIASES`, fuzzy lowercase + strip non-alnum, Thai
  aliases). Category aliasing (`CATEGORY_ALIASES`: "Wall-mounted" → split).
  Status aliasing (`STATUS_ALIASES`: "inactive" → archived).
- Typed columns mapped: series → brand, eer, voltage, refrigerant, warranty_text;
  variant → cooling_capacity_btu, noise_level_db, energy_rating, room_size_sqm.
  `spec.<KEY>` → series JSONB, `variant_spec.<KEY>` → variant JSONB.
- Upsert by series slug (re-inserts that series' variants); `--replace` wipes
  everything first.
- `src/db/verify-import.ts` prints counts + samples + series-without-variants.
- `src/db/backfill-typed-specs.ts` moves common keys out of JSONB into typed
  columns (idempotent; only needed if old data had JSONB specs).

**Current data:** ~66 series, ~261 variants imported (Samsung, Daikin, Carrier,
Mitsubishi Electric/Heavy, AUX, Gree, Midea, Haier, Hisense, TCL). All category
`split` (+ 1 window). One series ("Hisense FIXEDSpeed (DJ)") has 0 variants
because its CSV rows had blank prices + status inactive.

---

## 9. Contact channels (env)

```bash
NEXT_PUBLIC_LINE_URL="https://line.me/R/ti/p/@893blxlh?..."
NEXT_PUBLIC_FACEBOOK_URL="https://www.facebook.com/your-page-here"   # ← set real URL
NEXT_PUBLIC_BUSINESS_PHONE="+66 2 029 9368"
```
Used on: checkout form, order confirmation, booking confirmation, booking detail
"contact to pay" card. Buttons hide automatically if the env var is empty. The
Facebook button uses the `ExternalLink` lucide icon (no `Facebook` export).

---

## 10. Folder / file pointers

```
src/
├── app/
│   ├── (shop)/checkout/page.tsx          # loads account, passes read-only contact
│   ├── (shop)/orders/[id]/confirmation/  # inquiry confirmation + contact buttons
│   ├── (shop)/products/[slug]/page.tsx   # passes variants + sharedTyped to picker
│   ├── (shop)/account/page.tsx           # + ProfileForm
│   ├── (booking)/book/[serviceId]/       # loads account → BookingWizard
│   ├── (booking)/bookings/[id]/          # detail: AcceptQuoteCard / BookingContactToPay
│   ├── (booking)/services/page.tsx       # ServicesHeroSlideshow hero
│   ├── admin/products /orders /bookings /customers /dashboard
│   └── api/availability, api/auth/session, api/cron/cleanup-orders
│       (NO api/payment/* anymore)
├── components/
│   ├── shop/ProductVariantPicker.tsx     # size picker + dynamic specs + star ratings
│   ├── shop/ProductCard.tsx              # "From ฿X" + N sizes
│   ├── shop/CheckoutForm.tsx             # inquiry form, read-only contact, channel buttons
│   ├── shop/CartPageClient.tsx, CartDrawer.tsx   # show size
│   ├── booking/BookingWizard.tsx         # read-only contact, local-date calendar
│   ├── booking/SlotPicker.tsx            # greyed-out booked slots
│   ├── booking/BookingCalendar.tsx       # local y/m/d formatDate
│   ├── booking/BookingPayBalance.tsx     # exports BookingContactToPay
│   ├── booking/ServicesHeroSlideshow.tsx # auto-advancing hero (user set interval=3000)
│   ├── account/ProfileForm.tsx
│   └── admin/AdminListToolbar.tsx, VariantsManager.tsx, SpecsEditor.tsx,
│            DeleteProductButton.tsx, ProductEditForm.tsx, ProductCreateForm.tsx,
│            OrderStatusUpdater.tsx, BookingQuoteForm.tsx
├── db/
│   ├── schema/ (products.ts has products + product_variants + product_images)
│   ├── migrations/ (0000–0012, see §3)
│   ├── import-from-sheet.ts, verify-import.ts, backfill-typed-specs.ts
│   └── seed.ts (5 demo series w/ variants — superseded by the sheet import)
├── lib/
│   ├── actions/orders.ts   # createOrderAction (inquiry), confirmOrderAtomic, cleanupStalePendingOrders
│   ├── actions/bookings.ts # createBooking, setQuote, acceptQuote, cancel, tech actions, cleanup
│   ├── actions/admin.ts    # product/variant CRUD, deleteProduct, parseSpecsJson, ENERGY handling
│   ├── actions/auth.ts     # register/login/logout/reset + updateProfileAction
│   ├── queries/products.ts # variant-aware listing (min/max price, total stock, variant count)
│   ├── queries/admin.ts    # getOrders/getBookings/getCustomers/getDashboardStats/getAdminProducts
│   ├── store/cart.ts       # Zustand v3, keyed by variantId
│   └── validations/ checkout.ts (cartItemSchema uses variantId), booking.ts (no name/phone)
└── i18n/ en.ts, th.ts      # added confirmation.inquiry*, contact*, products.quantity/addToCart, etc.
```

---

## 11. Conventions / gotchas (still apply)

- **Prices in satang** (integer, ×100 from baht). `formatPrice()` →
  `Intl.NumberFormat("th-TH", { currency: "THB" })` → ฿.
- **Next.js 16 async APIs:** `cookies()`, `params`, `searchParams` are async —
  await them.
- **@base-ui/react not Radix.** No `asChild`. Read `src/components/ui/` source.
- **Server Actions signature** for `useActionState`: `(prevState, formData)`.
- **Multi-step forms:** keep fields in the DOM with `className={cond ? "" :
  "hidden"}`, never `{cond && <fields/>}` (removed inputs don't submit).
- **i18n:** Thai default. Client: `useLanguage()`. Server: `getT()` / `getLang()`.
  Add keys to `en.ts` then mirror in `th.ts`. Bilingual DB fields: pick
  `nameTh ?? name` etc. at render based on `lang`.
- **Drizzle numerics come back as strings** (eer, noiseLevelDb) — handle the cast.
- **Cart store version 3**, keyed by `variantId`; `migrate()` drops legacy items
  without a `variantId`. Don't downgrade.
- **Stock decrement** is atomic per variant via
  `` sql`${productVariants.stock} - ${qty}` `` with a `stock >= qty` guard.
- **Email** always in try/catch, never blocks the user.
- **lucide-react has no `Facebook`** — use `ExternalLink`.

---

## 12. Known follow-ups / not done

- `NEXT_PUBLIC_FACEBOOK_URL` is still a placeholder — set the real page URL.
- Old payment env vars (`PAYMENT_SECRET_KEY`, `PAYMENT_PUBLIC_KEY`,
  `PAYMENT_WEBHOOK_SECRET`) can be deleted from `.env` — unused now.
- "Hisense FIXEDSpeed (DJ)" series has no buyable variants (blank prices in
  sheet) — fix the sheet + re-import if it should sell.
- Variant-level JSONB `specifications` has **no admin UI** (only typed fields +
  series SpecsEditor). Add a variant SpecsEditor if needed.
- `db:generate` needs a TTY; in this shell migrations were hand-written. If you
  get a clean interactive terminal, regular `drizzle-kit generate` works again.
- Migration file numbering has a cosmetic 0008/0009 overlap (RLS file). Journal
  is authoritative.

---

## 13. Common commands

```bash
npm run dev
npm run build
npx tsc --noEmit                 # type-check (run after edits)
npm run db:migrate               # apply migrations (uses DIRECT_URL)
npm run db:import-sheet -- "<published_csv_url>"            # upsert from sheet
npm run db:import-sheet -- "<published_csv_url>" --replace  # wipe + import
npx tsx src/db/verify-import.ts  # sanity-check imported data
npm run db:seed                  # 5 demo series (optional; sheet import is the real data)
```

**Dev credentials (from earlier seed; verify they still exist after a reset):**
- Admin: `admin@coolairservices.com` / `Admin1234`
- Technician: `tech@coolairservices.com` / `Password1`
