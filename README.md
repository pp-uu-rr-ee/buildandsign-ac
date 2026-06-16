# Cool Air Services — AC Catalogue & Booking Platform

A full-stack platform for a Thailand-based air-conditioning business. It does two
things:

1. **AC catalogue** — browse air conditioners by series, pick a size, and send a
   purchase **inquiry** (no online payment; staff follow up via Line / Facebook /
   phone).
2. **Service booking** — book AC cleaning / repair / installation / inspection
   with a live technician-availability calendar. Admin sends a quote, the
   customer accepts to lock the slot, and payment is settled offline.

Built with Next.js 16 (App Router), Drizzle ORM on Supabase Postgres, and a
custom JWT auth layer. Thai is the default language with an instant EN/TH toggle.

> 📄 For deep architectural context (data model, migrations, gotchas, history),
> see **[`Summary.md`](./Summary.md)**.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + `@tailwindcss/typography` |
| UI | shadcn/ui on **@base-ui/react** (not Radix) |
| Database | Supabase Postgres |
| ORM | Drizzle ORM (`drizzle-orm/node-postgres`) |
| Auth | Custom JWT (`jose`), httpOnly cookie, `bcryptjs` |
| State | Zustand (cart, localStorage-persisted) |
| Validation | Zod v4 |
| Email | Resend |
| File storage | Cloudflare R2 (`@aws-sdk/client-s3`) |
| i18n | Custom cookie-based (Thai default) |

---

## Getting started

### 1. Prerequisites

- Node.js 20+
- A Supabase project (Postgres)
- A Cloudflare R2 bucket (for product images)
- A Resend account (for transactional email)

### 2. Install

```bash
npm install
```

### 3. Configure `.env`

Create a `.env` in the project root:

```bash
# ── Database (Supabase) ───────────────────────────────────────────────
# Pooled (transaction mode, port 6543) — used at app runtime
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres"
# Direct (port 5432) — used for migrations / seed / studio
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres"

# ── Auth ──────────────────────────────────────────────────────────────
SESSION_SECRET="<random-32-byte-base64-string>"

# ── App / business info (public) ──────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BUSINESS_NAME="Cool Air Services"
NEXT_PUBLIC_BUSINESS_PHONE="+66 2 029 9368"
NEXT_PUBLIC_LINE_URL="https://line.me/R/ti/p/@yourlineid"
NEXT_PUBLIC_FACEBOOK_URL="https://www.facebook.com/your-page"
NEXT_PUBLIC_BUSINESS_ADDRESS="123 Main Street, Bangkok"

# ── Email (Resend) ────────────────────────────────────────────────────
RESEND_API_KEY="re_..."
EMAIL_FROM="onboarding@resend.dev"   # use a verified domain in production

# ── Storage (Cloudflare R2) ───────────────────────────────────────────
STORAGE_BUCKET="your-bucket"
STORAGE_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY="..."
STORAGE_SECRET_KEY="..."
NEXT_PUBLIC_STORAGE_URL="https://pub-<hash>.r2.dev"   # public bucket base URL
```

### 4. Set up the database

```bash
npm run db:migrate          # apply all migrations (uses DIRECT_URL)
npm run db:seed             # optional: 5 demo product series with variants
npm run db:seed-tech        # optional: a test technician
```

Enable Row Level Security by running `src/db/migrations/0009_enable_rls.sql` in
the Supabase SQL editor (defense-in-depth — the app connects as superuser and
bypasses RLS, but this protects the public REST API).

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Importing the real catalogue from Google Sheets

Product data is maintained in a Google Sheet (one row per AC variant) and
imported via a custom script.

1. In Google Sheets: **File → Share → Publish to web → CSV → Publish**, copy the
   URL.
2. Run:

```bash
# Upsert (update existing series, insert new ones)
npm run db:import-sheet -- "https://docs.google.com/.../pub?output=csv"

# Or wipe everything and re-import
npm run db:import-sheet -- "https://docs.google.com/.../pub?output=csv" --replace
```

3. Verify:

```bash
npx tsx src/db/verify-import.ts
```

**Required CSV columns:** `series_name`, `category`, `size`, `price_baht`.
**Optional:** `series_name_th`, `slug`, descriptions, `status`, `is_featured`,
`image_url`, `sku`, `compare_price_baht`, `stock`, `low_stock_threshold`, and
typed specs (`brand`, `eer`, `voltage`, `refrigerant`, `warranty_text`,
`cooling_capacity_btu`, `noise_level_db`, `energy_rating`, `room_size_sqm`).
Header names are fuzzy-matched and support Thai aliases. See
`src/db/import-from-sheet.ts` for the full mapping.

---

## Data model in brief

A **product** is a *series* (e.g. "Carrier Inverter Split Type") holding the
shared, customer-facing info. Each buyable size is a **product_variant** with its
own SKU, price, stock, and size-specific specs. The cart, orders, and stock all
key off the **variant**.

```
products (series) ──< product_variants (sizes / SKUs)
        │
        └──< product_images (shared across variants)

orders ──< order_items (snapshots productId + variantId + size + price)
bookings (quote → accept → settle offline)
users (JWT auth; phone required to order/book)
```

See **[`Summary.md`](./Summary.md)** §4 for exact columns.

---

## Key flows

- **Buy an AC** → product page → pick size → cart → checkout (contact info is
  read-only from your account; only address is entered) → "Send Inquiry" →
  confirmation page with Line/Facebook/phone buttons. Staff confirm later and
  stock is decremented then.
- **Book a service** → choose service → 3-step wizard (date/time → details →
  review). Admin sets a quote, customer accepts to lock the slot, payment is
  settled offline.
- **Account** → edit name/phone (email is fixed); phone is mandatory before
  ordering or booking.

There is **no online payment** — this build is inquiry/contact based.

---

## Admin

Admin area at `/admin` (role-guarded by middleware + a server-side re-check in
the layout):

- **Products** — list with min price, stock, and variant counts; debounced smart
  search + status/category filters; create/edit series; manage **variants**
  (price, stock, SKU, cooling BTU, noise, energy rating, room size) inline.
- **Orders / Bookings** — smart search (incl. JSONB customer fields and
  technician name), status filters, detail pages.
- **Customers** — list with order/booking counts and total spent.
- **Dashboard** — totals, low-stock (variant-level), revenue.
- **Blog** — public listing + admin CRUD.

---

## Project structure

```
src/
├── app/
│   ├── (marketing)/   # home, blog, about, contact, legal
│   ├── (shop)/        # products, cart, checkout, orders, account
│   ├── (booking)/     # services, book/[serviceId], bookings
│   ├── (auth)/        # login, register, forgot/reset password
│   ├── admin/         # dashboard, products, orders, bookings, customers, blog
│   └── api/           # availability, auth/session, cron/cleanup-orders
├── components/        # shop/, booking/, admin/, account/, layout/, ui/, …
├── config/            # site.ts, services.ts
├── db/
│   ├── schema/        # Drizzle tables
│   ├── migrations/    # SQL migrations + meta journal
│   ├── import-from-sheet.ts, verify-import.ts, backfill-typed-specs.ts
│   └── seed*.ts
├── i18n/              # en.ts, th.ts
├── lib/
│   ├── actions/       # server actions (orders, bookings, admin, auth, images)
│   ├── queries/       # read queries (products, admin, account, availability)
│   ├── store/cart.ts  # Zustand cart
│   ├── validations/   # Zod schemas
│   ├── email/         # Resend templates
│   └── session.ts, storage.ts, helpers/
└── middleware.ts      # auth + role routing
```

---

## Scripts

```bash
npm run dev              # start dev server
npm run build            # production build
npm run start            # run the production build
npm run lint             # eslint
npx tsc --noEmit         # type-check

npm run db:migrate       # apply migrations
npm run db:studio        # Drizzle Studio
npm run db:seed          # seed demo products
npm run db:seed-tech     # seed a test technician
npm run db:import-sheet -- "<csv_url>" [--replace]   # import catalogue
```

> `db:generate` (drizzle-kit) needs an interactive TTY. In non-interactive
> shells, write the migration SQL by hand and update `meta/_journal.json` — see
> `Summary.md` §3.

---

## Conventions

- **Prices are stored in satang** (integer; 1 THB = 100 satang). Display with
  `formatPrice()`.
- **Next.js 16:** `cookies()`, `params`, `searchParams` are async — `await` them.
- **UI primitives are @base-ui/react, not Radix** — no `asChild`; read the
  component source before using a new one.
- **i18n:** Thai is the default. Add keys to `en.ts`, then mirror in `th.ts`.
  Server components use `getT()` / `getLang()`; client components use
  `useLanguage()`.
- **Mutations go through Server Actions**, validated with Zod inside the action.
- **Image uploads** flow browser → Server Action → R2 (no presigned URLs / CORS).
  `next.config.ts` raises the Server Action body limit to 12 MB.

---

## License

Private project. All rights reserved.
