# AC Services Platform — Project State Summary

---

## 1. Project Overview

**Purpose:** A full-stack Air Conditioning services business platform. Dual-purpose: an e-commerce store selling AC units + a service booking system for technicians. Thailand-based (THB currency).

**Status:** ✅ 100% complete. All core features, payment gateway, SEO, i18n (EN/TH with instant switching), image upload, forgot-password flow, and admin CRUD are live.

**Implemented features:**
- JWT-based auth (register, login, logout, forgot/reset password, role-based middleware)
- Product catalog with filtering, sorting, pagination, JSON-LD schema, and Cloudflare R2 image upload
- Service booking system with live technician availability calendar (login required)
- Shopping cart (Zustand + localStorage) with cart drawer and checkout
- Order creation with stock validation and atomic decrement
- **Opn Payments (Omise) card payment** — tokenization via OmiseJS, server-side charge via `api.omise.co`, 3DS redirect flow, order confirmation on return
- **Save card / remember card** — Opn Customer object attached per user, saved cards stored in `saved_cards` table, card management page at `/account/cards`
- Admin dashboard: orders, bookings, products CRUD (create + edit + images), technicians view, blog CRUD, customers/settings placeholders
- Full database schema with Drizzle ORM (5 migrations applied)
- Homepage with 6 sections (hero, service highlights, featured products, why-choose-us, testimonials, CTA)
- Customer account pages: /account, /orders, /bookings, /account/cards
- Dark mode (CSS variable-based, `.dark` class toggle, FOUC-free blocking script)
- i18n: Thai default, English/Thai toggle — instant switch via `router.refresh()`, no page reload
- Blog section: public listing + detail pages, admin CRUD
- Email notifications: booking confirmation + order receipt + password reset via Resend
- Sitemap.xml (dynamic, fetches active products + published posts) + robots.txt
- Mobile nav cart badge

---

## 2. Architecture

**High-level:** Next.js 16 App Router monolith. Server Components fetch data, Client Components handle interactivity. Server Actions handle all mutations. No separate API layer except where needed (availability endpoint, payment return).

**Design decisions:**
- **Prices in satang (integer)** — 1 THB = 100 satang, avoids float precision bugs. `formatPrice()` converts at display time only using `Intl.NumberFormat("th-TH", { currency: "THB" })`. Admin forms accept baht input and multiply × 100 before storing.
- **Address/product snapshot in JSONB** — orders and bookings preserve state at transaction time. `shippingAddress` JSONB also stores `email` field (needed for post-3DS email sending).
- **Specifications in JSONB** — flexible per-product without schema migrations
- **Cart in localStorage via Zustand** — no DB cart table; server re-validates stock at checkout. Zustand store is version 2 with a `migrate()` function that handles the `unitPriceInCents` → `unitPriceInSatang` rename.
- **JWT in httpOnly cookie** — `jose` library, works on Edge runtime
- **URL-driven filters** — all product filtering via search params, shareable and SSR-compatible
- **Route groups for layout separation** — `(marketing)`, `(shop)`, `(booking)`, `(auth)` each have their own layout without affecting URL paths
- **Navbar is a Server Component** — reads session + lang server-side; only `MobileNav`, `UserMenu`, and `CartDrawer` are client islands
- **Dark mode via `.dark` class on `<html>`** — blocking inline script prevents FOUC; `ThemeProvider` syncs localStorage + DOM
- **i18n via cookie** — default language is Thai. `LanguageProvider` writes `lang` cookie on toggle and calls `router.refresh()` so Server Components re-render instantly without a page reload. Server components read lang via `getLang()` / `getT()`.
- **Email via Resend** — fire-and-forget after DB insert; never blocks the user flow if email fails
- **Image upload via Cloudflare R2** — server-side upload (browser → Next.js Server Action → R2). No presigned URLs, no CORS configuration needed.
- **Product bilingual data** — `name_th`, `short_description_th`, `description_th` columns in DB. Admin edit form has EN/TH fields side-by-side. Front-end picks correct field at render time based on `lang`.
- **servicesConfig bilingual** — `titleTh`, `taglineTh`, `descriptionTh`, `includesTh[]`, `faqsTh[]` in `src/config/services.ts`. Single source of truth for all service content.
- **Password reset tokens** — stored in `password_reset_tokens` table (UUID token, 1-hour expiry, `used_at` for one-time use). Token sent via Resend email, validated server-side on reset.
- **Opn Payments card flow** — client tokenizes card via OmiseJS (`cdn.omise.co/omise.js`), server action receives token, calls `api.omise.co/charges`. If charge is `successful` → confirm order inline. If `pending` (3DS) → `redirect(charge.authorize_uri)`, then `/api/payment/return` handles return.
- **Saved cards** — on "Remember this card": server creates/updates Opn Customer, attaches card, saves `opn_card_id`+display info to `saved_cards` table. User's `opn_customer_id` stored on `users` row. At checkout, saved cards appear as selectable options; charging uses `customer`+`card` params instead of token.

**Data flow:**
```
User → Server Component (fetch data + lang cookie) → render HTML
User action → Client Component → Server Action → DB → revalidatePath → re-render
Lang toggle → LanguageProvider → cookie + setLang() + router.refresh() → instant update
Booking wizard → fetch /api/availability → slot picker → Server Action → DB → Resend email
Theme toggle → ThemeProvider → .dark on <html> + localStorage
Card checkout → OmiseJS (client tokenize) → createOrderAction → api.omise.co/charges
             → if successful: confirm order + email → redirect /confirmation
             → if pending (3DS): redirect authorize_uri → /api/payment/return → confirm + email → redirect /confirmation
Saved card checkout → createOrderAction → api.omise.co/charges (customer+card) → confirm
Image upload → Admin form → uploadProductImageAction → R2 PutObject → DB insert → revalidatePath
Forgot password → requestPasswordResetAction → token in DB → Resend email → /reset-password?token=...
```

**Routing structure:**
```
/ → (marketing)/(home)/page.tsx
/blog → (marketing)/blog/page.tsx
/blog/[slug] → (marketing)/blog/[slug]/page.tsx
/products → (shop)/products/page.tsx
/products/[slug] → (shop)/products/[slug]/page.tsx
/cart → (shop)/cart/page.tsx
/checkout → (shop)/checkout/page.tsx
/orders → (shop)/orders/page.tsx
/orders/[id]/confirmation → (shop)/orders/[id]/confirmation/page.tsx
/account → (shop)/account/page.tsx
/account/cards → (shop)/account/cards/page.tsx          ← saved card manager
/services → (booking)/services/page.tsx
/book/[serviceId] → (booking)/book/[serviceId]/page.tsx  ← login required
/bookings → (booking)/bookings/page.tsx
/bookings/[id]/confirmation → (booking)/bookings/[id]/confirmation/page.tsx
/login, /register, /forgot-password, /reset-password → (auth)/...
/admin/* → admin/... (role-guarded layout)
/admin/blog → admin/blog/page.tsx
/admin/blog/new → admin/blog/new/page.tsx
/admin/blog/[id]/edit → admin/blog/[id]/edit/page.tsx
/admin/products/new → admin/products/new/page.tsx
/admin/products/[id]/edit → admin/products/[id]/edit/page.tsx  ← images + details
/admin/customers → admin/customers/page.tsx  ← placeholder
/admin/settings → admin/settings/page.tsx    ← placeholder
/sitemap.xml → app/sitemap.ts (dynamic)
/robots.txt → app/robots.ts
/api/auth/session → GET session for client components
/api/availability → GET available time slots
/api/payment/return → GET — Opn 3DS return handler (verify charge → confirm order → redirect)
```

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + @tailwindcss/typography |
| UI Components | shadcn/ui built on **@base-ui/react** (NOT Radix — breaking difference) |
| Database | PostgreSQL |
| ORM | Drizzle ORM (`drizzle-orm/node-postgres`) |
| Auth | Custom JWT via `jose`, httpOnly cookies |
| Password hashing | `bcryptjs` |
| Cart state | Zustand with `persist` middleware (version 2, with localStorage migration) |
| Validation | Zod v4 (server-side in actions) |
| Forms | Native `<form>` + `useActionState` (no react-hook-form) |
| Toast notifications | Sonner |
| Icons | Lucide React |
| Dark mode | CSS variables + `.dark` class on `<html>` (ThemeProvider) |
| i18n | Custom cookie-based system — `src/i18n/en.ts` + `src/i18n/th.ts` (Thai default) |
| Email | Resend (`resend` package) — booking confirmations, order receipts, password reset |
| Image storage | Cloudflare R2 via `@aws-sdk/client-s3` (server-side upload) |
| Payment | **Opn Payments (Omise)** — OmiseJS client tokenization, `api.omise.co` server charges |
| Dev tools | `tsx` for seed scripts, `dotenv` |
| DB tooling | `drizzle-kit` (generate, migrate, studio) |

---

## 4. Folder Structure

```
ac-services/
├── src/
│   ├── app/
│   │   ├── (auth)/              # login, register, forgot-password, reset-password
│   │   ├── (booking)/           # services catalog, book/[serviceId], bookings (list + confirmation)
│   │   ├── (marketing)/         # homepage, blog (listing + [slug]), about, contact
│   │   ├── (shop)/
│   │   │   ├── account/
│   │   │   │   ├── page.tsx
│   │   │   │   └── cards/page.tsx    ← saved payment cards manager
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   └── products/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── orders/[id]/
│   │   │   ├── bookings/[id]/
│   │   │   ├── products/[id]/edit/   # image manager + details form
│   │   │   ├── products/new/
│   │   │   ├── blog/                 # list + new + [id]/edit
│   │   │   ├── technicians/
│   │   │   ├── customers/            # placeholder
│   │   │   └── settings/             # placeholder
│   │   ├── api/
│   │   │   ├── auth/session/
│   │   │   ├── availability/
│   │   │   └── payment/return/       ← Opn 3DS return handler
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── account/
│   │   │   ├── LogoutButton.tsx
│   │   │   └── SavedCardsManager.tsx  ← delete / set-default card UI
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── layout/
│   │   ├── providers/
│   │   ├── seo/
│   │   ├── shop/                # ProductCard, ProductFilters, ProductSort, CheckoutForm (Opn card form)
│   │   └── ui/
│   ├── config/
│   │   ├── site.ts
│   │   └── services.ts
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema/
│   │   │   ├── users.ts          # + opn_customer_id column
│   │   │   ├── products.ts       # price_in_satang, compare_price_in_satang
│   │   │   ├── orders.ts         # *_in_satang columns
│   │   │   ├── bookings.ts       # quoted/final_price_in_satang
│   │   │   ├── savedCards.ts     ← NEW: saved_cards table
│   │   │   ├── technicians.ts
│   │   │   └── blog.ts
│   │   ├── migrations/
│   │   │   ├── 0000_heavy_blindfold.sql    # initial schema
│   │   │   ├── 0001_product_i18n.sql       # product TH columns
│   │   │   ├── 0002_password_reset_tokens.sql
│   │   │   ├── 0003_optimal_talisman.sql   # saved_cards table + users.opn_customer_id
│   │   │   └── 0004_thb_currency.sql       # RENAME *_in_cents → *_in_satang (all tables)
│   │   ├── seed.ts
│   │   ├── seed-technician.ts
│   │   └── seed-admin.ts
│   ├── i18n/                    # en.ts + th.ts (~210 keys, 15 namespaces)
│   ├── lib/
│   │   ├── actions/
│   │   │   ├── auth.ts
│   │   │   ├── bookings.ts
│   │   │   ├── orders.ts         # card + saved card + COD/bank flow; confirmOrder() exported
│   │   │   ├── cards.ts          ← NEW: deleteCardAction, setDefaultCardAction
│   │   │   ├── admin.ts
│   │   │   ├── blog.ts
│   │   │   └── images.ts
│   │   ├── email/
│   │   ├── helpers/
│   │   │   ├── price.ts          # formatPrice() → th-TH / THB / ฿
│   │   │   └── lang.ts
│   │   ├── hooks/
│   │   ├── payment/
│   │   │   └── opn.ts            ← NEW: createCharge, retrieveCharge, createCustomerWithCard,
│   │   │                         #       addCardToCustomer, deleteCustomerCard
│   │   ├── queries/
│   │   ├── session.ts
│   │   ├── storage.ts
│   │   ├── store/
│   │   │   └── cart.ts           # version 2 with migrate() for InCents→InSatang
│   │   └── validations/
│   │       ├── auth.ts
│   │       ├── booking.ts
│   │       └── checkout.ts       # paymentMethod enum includes "card"
│   ├── middleware.ts
│   └── types/
│       └── index.ts              # CartItem uses unitPriceInSatang
├── drizzle.config.ts
├── next.config.ts
├── .env
└── package.json
```

---

## 5. Coding Conventions and Rules

**Naming:**
- Files: `PascalCase` for components, `camelCase` for utilities/queries/actions
- DB columns: `snake_case` (Drizzle maps to camelCase in TypeScript)
- Route segments: lowercase kebab-case

**Server Actions signature:** Always `(prevState, formData)` — required by `useActionState`
```ts
export async function myAction(_prev: ResultType, formData: FormData): Promise<ResultType>
```

**shadcn/ui critical note:** This project uses `@base-ui/react` NOT `@radix-ui`. Key differences:
- No `asChild` prop on any component
- `DropdownMenuLabel` must be wrapped in `DropdownMenuGroup`
- `SheetTrigger`, `DropdownMenuTrigger` render their own element — pass className directly
- Always read the component source before using a new primitive

**Never pass functions/components as props from Server → Client Components.** Strip non-serialisable fields (e.g. Lucide icons from config objects) before passing to `"use client"` components.

**Prices:** Always stored and computed in satang (integer). 1 THB = 100 satang. `formatPrice()` converts at display time using `Intl.NumberFormat("th-TH", { currency: "THB" })` → displays as ฿. Admin forms accept baht input; server action multiplies × 100 before storing.

**Mutations always use Server Actions**, never direct DB calls from client. Client components call server actions via `useActionState` or `useTransition`.

**`revalidatePath()`** must be called in admin actions after every mutation.

**Zod validation** happens inside server actions, never client-side only. Use `.datetime({ local: true })` for datetime fields — this Zod version requires `Z` suffix by default.

**Multi-step forms:** Never use `{condition && <fields />}` for steps — inputs get removed from DOM and won't submit. Use `className={condition ? "..." : "hidden"}` instead.

**Card payment form:** The "Place Order" button is `type="button"` with an `onClick` handler. For card + new card: OmiseJS tokenizes client-side, then `fd.set("opnToken", token)` is set directly on a manually built `FormData`, then `formAction(fd)` is called via `startTransition`. Do NOT rely on setting hidden input `.value` via ref before creating `new FormData(form)` — React's reconciler may not sync in time.

**Dark mode:** Toggle `.dark` class on `<html>`. Use `dark:` Tailwind variants in all components. Never hardcode `bg-white` without a `dark:bg-gray-900` (or similar) counterpart.

**i18n:** All UI strings come from `src/i18n/en.ts` / `src/i18n/th.ts`. Thai is the default language (cookie fallback = `"th"`).
- **Client components:** use `const { lang, t } = useLanguage()` from `@/components/providers/LanguageProvider`
- **Server components:** use `const t = await getT()` and `const lang = await getLang()` from `@/lib/helpers/lang`
- Never hardcode user-visible strings — always pull from `t.*`
- Adding new strings: add to `en.ts` first, then mirror in `th.ts`
- For bilingual DB content (products): pick `nameTh ?? name` at render time based on `lang`

**Language toggle** calls `router.refresh()` after setting the cookie — Server Components re-render with the new lang instantly, no full page reload.

**Image upload:** Always use `uploadProductImageAction(productId, formData)` from `src/lib/actions/images.ts`. Upload goes browser → Next.js server → R2 (no presigned URLs, no CORS). The `NEXT_PUBLIC_STORAGE_URL` env var is the R2 public base URL.

**Email:** `src/lib/email/index.ts` exports `sendBookingConfirmation()`, `sendOrderReceipt()`, `sendPasswordReset()`. Always wrap in `try/catch`. Requires `RESEND_API_KEY` in `.env`.

---

## 6. Current Implementation State

### ✅ Complete
- Database schema (all tables, enums, relations) — **5 migrations applied**
- Auth system (register, login, logout, forgot/reset password)
- Layout system (Navbar, Footer, MobileNav + cart badge, UserMenu, CartDrawer, admin sidebar)
- Product catalog: listing with filters/sort/pagination, detail page with gallery
- **Bilingual products** — `name_th`, `short_description_th`, `description_th` in DB; admin edit form has EN/TH fields; front-end renders correct language automatically
- **Cloudflare R2 image upload** — drag-and-drop in admin, set primary, delete; server-side upload (no CORS)
- Service booking: services page (bilingual), 3-step wizard, availability API, confirmation page (login required)
- Shopping cart: Zustand store (v2, with localStorage migration), CartDrawer, CartPageClient
- Checkout: form, order server action, stock decrement, confirmation page
- **Opn Payments card payment** — OmiseJS client tokenization, server charge via `api.omise.co`, 3DS redirect flow, `/api/payment/return` confirms order on return
- **Saved cards / Remember card** — Opn Customer object per user, `saved_cards` table, card management at `/account/cards`
- **THB currency** — all prices display as ฿ (Thai Baht). DB columns are `*_in_satang`. `formatPrice()` uses `th-TH/THB`.
- Admin: dashboard, orders, bookings, products (create + edit + images), technicians, blog CRUD, customers/settings placeholders
- JSON-LD schemas: Product, LocalBusiness
- Global error boundary, 404, loading spinner
- Homepage — all 6 sections fully bilingual
- Services page — fully bilingual (hero, badges, each card: title/tagline/description/includes/FAQs)
- Products page + detail — all UI strings via i18n, Thai product name/description shown when lang=th
- Customer account pages — /account, /orders (history), /bookings (history), /account/cards
- Dark mode — full site coverage, FOUC-free, persisted in localStorage
- i18n (EN/TH) — Thai default, ~210 keys across 15 namespaces, instant switch (no reload)
- Blog section — public listing + detail pages + admin CRUD
- Email notifications — booking confirmation, order receipt, password reset (all via Resend)
- Forgot/reset password — token table, server actions, email template, /forgot-password + /reset-password pages
- Sitemap.xml + robots.txt — dynamic, SEO-ready
- Mobile nav cart badge

### ❌ Not yet built
- None — all planned features are complete

---

## 7. Payment System (Opn Payments)

**Provider:** Opn Payments (formerly Omise). API at `https://api.omise.co`. OmiseJS CDN at `https://cdn.omise.co/omise.js`.

**Payment methods at checkout:**
| Method | Flow |
|---|---|
| Cash on Delivery | Manual — order created, stock decremented, email sent |
| GCash | Manual — order created, instructions sent by staff |
| Bank Transfer | Manual — order created, admin confirms receipt |
| Credit/Debit Card | Online — OmiseJS tokenizes, server charges via Opn API |

**Card payment flow:**
1. User selects "Credit/Debit Card", fills card form
2. JS tokenizes card via `window.Omise.createToken()` → gets `tokn_...`
3. `FormData` built from form, `fd.set("opnToken", token)` added explicitly
4. `createOrderAction` server action: creates order (pending) → `createCharge(THB, token)` → if `successful`: decrement stock + email + redirect to `/confirmation`; if `pending` (3DS): `redirect(authorize_uri)` → Opn redirects to `/api/payment/return?charge_id=...` → verify → confirm order + email → redirect
5. Failed charge: order marked `cancelled/failed`, error returned to user

**Saved card flow:**
1. User checks "Remember this card" on new card payment
2. After tokenization: server calls `createCustomerWithCard()` or `addCardToCustomer()` → saves `opn_card_id` + display info to `saved_cards` table + `opn_customer_id` on user row
3. Future checkouts: saved cards shown as radio options; selecting one charges via `customer` + `card` params (no token)
4. User can delete/set-default at `/account/cards`

**Key files:**
- `src/lib/payment/opn.ts` — API client: `createCharge`, `retrieveCharge`, `createCustomerWithCard`, `addCardToCustomer`, `deleteCustomerCard`
- `src/lib/actions/orders.ts` — `createOrderAction` (all payment paths), `confirmOrder` (stock + status update)
- `src/lib/actions/cards.ts` — `deleteCardAction`, `setDefaultCardAction`
- `src/app/api/payment/return/route.ts` — 3DS return handler
- `src/components/shop/CheckoutForm.tsx` — card form UI, OmiseJS loading, saved card selection

---

## 8. Database Migrations

| Migration | File | Contents |
|---|---|---|
| 0000 | `0000_heavy_blindfold.sql` | Initial schema — all tables |
| 0001 | `0001_product_i18n.sql` | `name_th`, `short_description_th`, `description_th` on products |
| 0002 | `0002_password_reset_tokens.sql` | `password_reset_tokens` table |
| 0003 | `0003_optimal_talisman.sql` | `saved_cards` table + `opn_customer_id` on users |
| 0004 | `0004_thb_currency.sql` | RENAME all `*_in_cents` → `*_in_satang` across products, orders, order_items, bookings |

---

## 9. i18n System

**Default language:** Thai (`"th"`). Users with no cookie see Thai. Toggle sets `lang` cookie and calls `router.refresh()`.

**Translation files:** `src/i18n/en.ts` and `src/i18n/th.ts`

**Namespaces (15 total):**
| Namespace | Contents |
|---|---|
| `nav` | Navbar links, auth buttons, dropdown items, theme/lang toggles |
| `home` | All homepage section text (hero, services, products, why-choose-us, testimonials, CTA) |
| `services` | Services page hero, badges, card labels (content itself is in servicesConfig) |
| `booking` | Full 3-step booking wizard (steps, fields, labels, messages, calendar days) |
| `cart` | Cart drawer + cart page |
| `checkout` | Checkout form labels, payment methods, card form labels, remember card |
| `account` | Account overview page |
| `orders` | Orders list page + status labels |
| `bookingsPage` | Bookings list page + status/service labels |
| `auth` | Login + register forms |
| `footer` | All footer columns and links |
| `products` | Product card labels + page headings + filter/sort labels + detail page labels |
| `blog` | Blog listing + detail page strings |
| `common` | Shared micro-strings |

**Bilingual config data** (not in i18n files — in source):
- `servicesConfig` in `src/config/services.ts` — every service has `title`/`titleTh`, `tagline`/`taglineTh`, `description`/`descriptionTh`, `includes`/`includesTh`, `faqs`/`faqsTh`
- `products` DB table — `name_th`, `short_description_th`, `description_th` columns

---

## 10. Dark Mode System

- CSS variables defined in `globals.css` under `:root` (light) and `.dark` (dark)
- Tailwind v4 custom variant: `@custom-variant dark (&:is(.dark *))`
- Blocking inline `<script>` in `<head>` reads `localStorage.theme` and applies `.dark` before paint — no flash
- `ThemeProvider` manages React state, syncs with `localStorage` and `document.documentElement.classList`
- All components use `dark:` variants. Convention: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-gray-100`, `border-gray-200 dark:border-gray-800`

---

## 11. Environment and Configuration

**`.env` variables:**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5433/buildandsign"

# Auth
SESSION_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="onboarding@resend.dev"   # use verified domain for production

# Storage (Cloudflare R2)
STORAGE_BUCKET="your-bucket-name"
STORAGE_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY="..."
STORAGE_SECRET_KEY="..."
NEXT_PUBLIC_STORAGE_URL="https://pub-<hash>.r2.dev"  # or custom domain

# Payments (Opn Payments / Omise)
PAYMENT_SECRET_KEY="skey_..."    # server-side key — never expose to client
PAYMENT_PUBLIC_KEY="pkey_..."    # used server-side to pass to CheckoutPage → CheckoutForm prop
```

**Setup commands:**
```bash
npm install
npm run db:migrate              # apply all 5 migrations
npm run db:seed                 # seed 6 products
npm run db:seed-tech            # seed test technician
npx tsx src/db/seed-admin.ts    # seed admin user
npm run dev
```

**Dev credentials:**
- Admin: `admin@coolairservices.com` / `Admin1234`
- Technician: `tech@coolairservices.com` / `Password1`

---

## 12. Important Context to Remember

- **`@base-ui/react` NOT Radix** — shadcn components behave differently. No `asChild`. Always check component source in `src/components/ui/` before use.
- **Next.js 16.2.7** — `cookies()`, `params`, `searchParams` are all **async** and must be awaited.
- **THB currency** — Thailand-based business. Currency is ฿ (THB). `formatPrice()` uses `Intl.NumberFormat("th-TH", { currency: "THB" })`.
- **Prices in satang** — stored as satang integer (e.g. 2899900 = ฿28,999). Admin forms accept baht input; server action multiplies × 100 before storing. Column names are `*_in_satang`. TypeScript properties are `*InSatang`.
- **Opn Payments API** — server-side calls go to `https://api.omise.co` (NOT `api.opn.ooo` — that domain does not resolve). OmiseJS client script is `https://cdn.omise.co/omise.js`. Account is Thailand (`TH`) and supports THB, not PHP.
- **Card form submit** — button is `type="button"`. Do NOT use `onSubmit` + hidden input ref trick for the token. Use `window.Omise.createToken()` in the onClick handler, then `fd.set("opnToken", token)` on a manually-built `FormData`, then `formAction(fd)`.
- **Cart localStorage migration** — Zustand store is version 2 with `migrate()` that renames `unitPriceInCents` → `unitPriceInSatang` in persisted items. Do not remove this.
- **Thai is the default language** — `getLang()` returns `"th"` when no cookie is set. The `LanguageProvider` initialises to `"th"`.
- **Language switch is instant** — `LanguageProvider.toggle()` sets cookie + `setLang()` + `router.refresh()`. Client components update synchronously; Server Components re-render from server with new cookie. No full page reload.
- **Bilingual product fields** — always query `nameTh`, `shortDescriptionTh`, `descriptionTh` alongside the English fields. Pick the correct one at render time: `lang === "th" && product.nameTh ? product.nameTh : product.name`.
- **servicesConfig** — single source of truth for service data. Has both EN and TH fields. Never duplicate in DB. Strip `icon` field before passing to client components.
- **R2 image upload** — server-side only. Use `uploadProductImageAction(productId, formData)`. The browser sends the file to Next.js, Next.js uploads to R2 using `PutObjectCommand`. `NEXT_PUBLIC_STORAGE_URL` must be set for `next/image` remotePatterns to work.
- **password_reset_tokens table** — tokens are plain hex strings (not hashed), expire after 1 hour, invalidated after use via `used_at`. `requestPasswordResetAction` always returns success to prevent email enumeration.
- **Technician availability** — weekly schedule stored as JSON keyed `"0"–"6"` (0=Sunday). Sundays always off. Calendar disables Sundays and >60 days ahead.
- **Stock decrement** uses `` sql`${products.stock} - ${qty}` `` — atomic, not read-then-write. For card payments, stock is only decremented after charge is confirmed (not on order creation).
- **Service booking requires login** — `/book/*` is protected by middleware. Guests are redirected to `/login?callbackUrl=...`.
- **Admin double-guard** — middleware blocks non-admins AND `admin/layout.tsx` re-checks server-side. Both intentional.
- **Multi-step forms** — never use `{condition && <fields />}` — use `className={condition ? "..." : "hidden"}` so inputs stay in DOM.
- **Zod datetime** — use `.datetime({ local: true })`. Default requires `Z` suffix and rejects local time strings.
- **Email** — always wrap in `try/catch`. Never block user flow on email failure.
- **Blog content** — stored as raw HTML, rendered via `dangerouslySetInnerHTML`. Admin-only input = trusted source.
- **shippingAddress JSONB** — now includes optional `email` field (stored at order creation). Used by the 3DS return handler to send the order receipt email post-redirect.
- **confirmOrder()** — exported from `src/lib/actions/orders.ts`. Decrements stock atomically and sets order status to `confirmed` + paymentStatus to `paid`. Used by both the inline card flow and the `/api/payment/return` route handler.
