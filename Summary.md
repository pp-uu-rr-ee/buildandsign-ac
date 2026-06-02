# AC Services Platform — Project State Summary

---

## 1. Project Overview

**Purpose:** A full-stack Air Conditioning services business platform for a Philippine-based AC company. Dual-purpose: an e-commerce store selling AC units + a service booking system for technicians.

**Status:** ~90% complete. Core features, homepage, customer account pages, dark mode, i18n (EN/TH), blog, email notifications, and admin CRUD are all live and committed.

**Implemented features:**
- JWT-based auth (register, login, logout, role-based middleware)
- Product catalog with filtering, sorting, pagination, and JSON-LD schema
- Service booking system with live technician availability calendar (login required)
- Shopping cart (Zustand + localStorage) with cart drawer and checkout
- Order creation with stock validation and atomic decrement
- Admin dashboard: orders, bookings, products CRUD (create + edit), technicians view, blog CRUD
- Full database schema with Drizzle ORM
- Homepage with 6 sections (hero, service highlights, featured products, why-choose-us, testimonials, CTA)
- Customer account pages: /account, /orders, /bookings
- Dark mode (CSS variable-based, `.dark` class toggle, FOUC-free blocking script)
- i18n: English / Thai with cookie-based server-side detection
- Blog section: public listing + detail pages, admin CRUD
- Email notifications: booking confirmation + order receipt via Resend

---

## 2. Architecture

**High-level:** Next.js 16 App Router monolith. Server Components fetch data, Client Components handle interactivity. Server Actions handle all mutations. No separate API layer except where needed (availability endpoint).

**Design decisions:**
- **Prices in cents (integer)** — avoids float precision bugs. `formatPrice()` converts at display time only. Admin forms accept peso input and multiply × 100 before storing.
- **Address/product snapshot in JSONB** — orders and bookings preserve state at transaction time
- **Specifications in JSONB** — flexible per-product without schema migrations
- **Cart in localStorage via Zustand** — no DB cart table; server re-validates stock at checkout
- **JWT in httpOnly cookie** — `jose` library, works on Edge runtime
- **URL-driven filters** — all product filtering via search params, shareable and SSR-compatible
- **Route groups for layout separation** — `(marketing)`, `(shop)`, `(booking)`, `(auth)` each have their own layout without affecting URL paths
- **Navbar is a Server Component** — reads session + lang server-side; only `MobileNav`, `UserMenu`, and `CartDrawer` are client islands
- **Dark mode via `.dark` class on `<html>`** — blocking inline script prevents FOUC; `ThemeProvider` syncs localStorage + DOM
- **i18n via cookie** — `LanguageProvider` writes `lang` cookie on toggle; server components read it via `getLang()` / `getT()` helpers
- **Email via Resend** — fire-and-forget after DB insert; never blocks the user flow if email fails

**Data flow:**
```
User → Server Component (fetch data + lang) → render HTML
User action → Client Component → Server Action → DB → revalidatePath → re-render
Booking wizard → fetch /api/availability → slot picker → Server Action → DB → Resend email
Theme toggle → ThemeProvider → .dark on <html> + localStorage
Lang toggle → LanguageProvider → cookie + React state → all components re-render
Order checkout → Server Action → DB → Resend email → redirect confirmation
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
/services → (booking)/services/page.tsx
/book/[serviceId] → (booking)/book/[serviceId]/page.tsx       ← login required
/bookings → (booking)/bookings/page.tsx
/bookings/[id]/confirmation → (booking)/bookings/[id]/confirmation/page.tsx
/login, /register, /forgot-password → (auth)/...
/admin/* → admin/... (role-guarded layout)
/admin/blog → admin/blog/page.tsx
/admin/blog/new → admin/blog/new/page.tsx
/admin/blog/[id]/edit → admin/blog/[id]/edit/page.tsx
/admin/products/new → admin/products/new/page.tsx
/api/auth/session → GET session for client components
/api/availability → GET available time slots
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
| Cart state | Zustand with `persist` middleware |
| Validation | Zod v4 (server-side in actions) |
| Forms | Native `<form>` + `useActionState` (no react-hook-form used yet) |
| Toast notifications | Sonner |
| Icons | Lucide React |
| Dark mode | CSS variables + `.dark` class on `<html>` (ThemeProvider) |
| i18n | Custom cookie-based system — `src/i18n/en.ts` + `src/i18n/th.ts` |
| Email | Resend (`resend` package) — booking confirmations + order receipts |
| Dev tools | `tsx` for seed scripts, `dotenv` |
| DB tooling | `drizzle-kit` (generate, migrate, studio) |

---

## 4. Folder Structure

```
ac-services/
├── src/
│   ├── app/
│   │   ├── (auth)/              # login, register, forgot-password — own layout
│   │   ├── (booking)/           # services catalog, book/[serviceId], bookings (list + confirmation)
│   │   ├── (marketing)/         # homepage, blog (listing + [slug]), about, contact
│   │   ├── (shop)/              # products, cart, checkout, orders (list + confirmation), account
│   │   ├── admin/               # full admin panel, role-guarded
│   │   │   ├── dashboard/
│   │   │   ├── orders/[id]/
│   │   │   ├── bookings/[id]/
│   │   │   ├── products/[id]/edit/
│   │   │   ├── products/new/    # ← NEW
│   │   │   ├── blog/            # ← NEW (list + new + [id]/edit)
│   │   │   └── technicians/
│   │   ├── api/
│   │   │   ├── auth/session/
│   │   │   └── availability/
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── account/
│   │   ├── admin/               # StatCard, StatusBadge, DataTable, OrderStatusUpdater,
│   │   │                        # BookingStatusUpdater, ProductEditForm, ProductCreateForm,
│   │   │                        # ToggleProductStatus, PostForm, DeletePostButton ← NEW
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── layout/
│   │   ├── providers/
│   │   ├── seo/
│   │   ├── shop/
│   │   └── ui/
│   ├── config/
│   │   ├── site.ts
│   │   └── services.ts
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema/              # users, products, orders, bookings, technicians, blog
│   │   ├── migrations/
│   │   ├── seed.ts
│   │   ├── seed-technician.ts
│   │   └── seed-admin.ts
│   ├── i18n/                    # en.ts (~150 keys, 15 namespaces), th.ts, index.ts
│   ├── lib/
│   │   ├── actions/             # auth.ts, bookings.ts, orders.ts, admin.ts, blog.ts ← NEW
│   │   ├── email/               # index.ts, templates.ts ← NEW
│   │   ├── helpers/
│   │   │   ├── price.ts
│   │   │   └── lang.ts
│   │   ├── hooks/
│   │   ├── queries/             # products.ts, availability.ts, admin.ts, account.ts, blog.ts ← NEW
│   │   ├── session.ts
│   │   ├── store/
│   │   └── validations/         # auth.ts, booking.ts, checkout.ts
│   ├── middleware.ts
│   └── types/
│       └── index.ts
├── drizzle.config.ts
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

**Prices:** Always stored and computed in cents (integer). Convert to ₱ only at display time using `formatPrice()` from `src/lib/helpers/price.ts`. Admin forms receive peso input and multiply × 100 in the server action before storing.

**Mutations always use Server Actions**, never direct DB calls from client. Client components call server actions via `useActionState` or `useTransition`.

**`revalidatePath()`** must be called in admin actions after every mutation.

**Zod validation** happens inside server actions, never client-side only. Use `.datetime({ local: true })` for datetime fields — this Zod version requires `Z` suffix by default.

**Multi-step forms:** Never use `{condition && <fields />}` for steps — inputs get removed from DOM and won't submit. Use `className={condition ? "..." : "hidden"}` instead.

**Dark mode:** Toggle `.dark` class on `<html>`. Use `dark:` Tailwind variants in all components. Never hardcode `bg-white` without a `dark:bg-gray-900` (or similar) counterpart.

**i18n:** All UI strings come from `src/i18n/en.ts` / `src/i18n/th.ts`.
- **Client components:** use `const { t } = useLanguage()` from `@/components/providers/LanguageProvider`
- **Server components:** use `const t = await getT()` from `@/lib/helpers/lang`
- Never hardcode user-visible English strings in components — always pull from `t.*`
- Adding new strings: add to `en.ts` first, then mirror in `th.ts`

**Email:** Use `sendBookingConfirmation()` / `sendOrderReceipt()` from `src/lib/email`. Always wrap in `try/catch` — email failure must never block user flow. `EMAIL_FROM` must be a Resend-verified sender domain (currently `onboarding@resend.dev` for dev/testing).

---

## 6. Current Implementation State

### ✅ Complete
- Database schema (all tables, enums, relations)
- Drizzle migrations applied to PostgreSQL
- Seed data: 6 products, 1 technician, 1 admin user
- Auth system (register, login, logout, session, middleware)
- Layout system (Navbar, Footer, MobileNav, UserMenu, CartDrawer, admin sidebar)
- Product catalog: listing with filters/sort/pagination, detail page with gallery
- Service booking: services page, 3-step wizard, availability API, confirmation page (login required)
- Shopping cart: Zustand store, CartDrawer, CartPageClient
- Checkout: form, order server action, stock decrement, confirmation page
- Admin: dashboard stats, orders list+detail+status update, bookings list+detail+technician assignment, products list+edit+toggle+**create**, technicians card grid, **blog CRUD**
- JSON-LD schemas: Product, LocalBusiness
- Global error boundary, 404, loading spinner
- Homepage — hero, service highlights, featured products, why-choose-us, testimonials, CTA
- Customer account pages — /account (profile + stats), /orders (history), /bookings (history)
- Dark mode — full site coverage, FOUC-free, persisted in localStorage
- i18n (EN/TH) — 15 namespaces, ~150 keys, cookie-based server-side detection
- **Blog section** — public listing + detail pages (HTML content, tags, reading time, SEO metadata)
- **Admin blog CRUD** — create, edit, delete posts; tag management; status (draft/published/archived)
- **Admin create product** — `/admin/products/new` with slug auto-generation
- **Email notifications** — booking confirmation + order receipt via Resend (fire-and-forget)
- **Guest booking blocked** — `/book/*` requires login, redirects to `/login?callbackUrl=...`

### 🔶 Partially complete
- Forgot password page — UI only, no email sending logic
- Cart badge on mobile nav — CartDrawer exists on desktop Navbar only
- Admin customers/settings pages — linked in sidebar but not built

### ❌ Not yet built
- Sitemap.xml and robots.txt
- Payment gateway integration (GCash / PayMongo)
- Image upload for products (currently placeholder/URL input only)
- Review/rating submission after booking completion
- `/admin/customers` and `/admin/settings` pages

---

## 7. Remaining Tasks (priority order)

1. **Sitemap + robots.txt** — `src/app/sitemap.ts`, `src/app/robots.ts` (quick SEO win)
2. **Image upload** — Cloudflare R2 or local for product images
3. **Payment gateway** — PayMongo or Stripe integration stub
4. **Forgot password** — email token flow via Resend (infrastructure already in place)
5. **Mobile nav cart badge** — CartDrawer on mobile
6. **Admin customers/settings** — placeholder pages to avoid 404 from sidebar links

---

## 8. i18n System

**Translation files:** `src/i18n/en.ts` and `src/i18n/th.ts`

**Namespaces:**
| Namespace | Contents |
|---|---|
| `nav` | Navbar links, auth buttons, dropdown items, theme/lang toggles |
| `home` | All homepage section text |
| `services` | Services page hero, badges, card content |
| `booking` | Full 3-step booking wizard (steps, fields, labels, messages, calendar days) |
| `cart` | Cart drawer + cart page |
| `checkout` | Checkout form labels + payment methods |
| `account` | Account overview page |
| `orders` | Orders list page + status labels |
| `bookingsPage` | Bookings list page + status/service labels |
| `auth` | Login + register forms |
| `footer` | All footer columns and links |
| `products` | Product card labels |
| `blog` | Blog listing + detail page strings |
| `common` | Shared micro-strings |

---

## 9. Dark Mode System

- CSS variables defined in `globals.css` under `:root` (light) and `.dark` (dark)
- Tailwind v4 custom variant: `@custom-variant dark (&:is(.dark *))`
- Blocking inline `<script>` in `<head>` reads `localStorage.theme` and applies `.dark` before paint — no flash
- `ThemeProvider` manages React state, syncs with `localStorage` and `document.documentElement.classList`
- All components use `dark:` variants. Convention: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-gray-100`, `border-gray-200 dark:border-gray-800`

---

## 10. Environment and Configuration

**`.env` variables:**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5433/buildandsign"

# Auth
SESSION_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="onboarding@resend.dev"   # use verified domain for production

# Storage (when building image upload)
STORAGE_BUCKET=""
STORAGE_ENDPOINT=""
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""

# Payments
PAYMENT_SECRET_KEY=""
PAYMENT_PUBLIC_KEY=""
```

**Setup commands:**
```bash
npm install
npm run db:migrate              # apply schema to PostgreSQL
npm run db:seed                 # seed 6 products
npm run db:seed-tech            # seed test technician
npx tsx src/db/seed-admin.ts    # seed admin user
npm run dev
```

**Dev credentials:**
- Admin: `admin@coolairservices.com` / `Admin1234`
- Technician: `tech@coolairservices.com` / `Password1`

---

## 11. Important Context to Remember

- **`@base-ui/react` NOT Radix** — shadcn components behave differently. No `asChild`. Always check component source in `src/components/ui/` before use.
- **Next.js 16.2.7** — not v13/14/15. `cookies()`, `params`, `searchParams` are all **async** and must be awaited.
- **PHP currency** — business is in the Philippines. Currency is ₱ (PHP). `formatPrice()` uses `Intl.NumberFormat("en-PH", { currency: "PHP" })`.
- **Prices in cents** — stored as centavos (e.g. 2899900 = ₱28,999). Admin forms accept peso input; server action multiplies × 100 before storing.
- **Technician availability** — weekly schedule stored as JSON keyed `"0"–"6"` (0=Sunday). Sundays are always off. Calendar disables Sundays and >60 days ahead.
- **Stock decrement** uses `` sql`${products.stock} - ${qty}` `` — atomic, not read-then-write.
- **Service booking requires login** — `/book/*` is protected by middleware. Guests are redirected to `/login?callbackUrl=...`.
- **Orders do not require login** at the middleware level but session is captured if present.
- **Admin double-guard** — middleware blocks non-admins AND `admin/layout.tsx` re-checks server-side. Both are intentional.
- **`servicesConfig`** in `src/config/services.ts` is the single source of truth for service types, pricing, and FAQs. Do not duplicate this data in the DB. Strip the `icon` field before passing to client components.
- **i18n strings** — never hardcode user-visible English text in components. Always use `t.*` from `useLanguage()` (client) or `getT()` (server).
- **Dark mode** — every new component must include `dark:` variants for all background, border, and text color classes.
- **Multi-step forms** — never use `{condition && <fields />}` — use `className={condition ? "..." : "hidden"}` so inputs stay in DOM for form submission.
- **Zod datetime** — use `.datetime({ local: true })` for datetime fields. Default `.datetime()` requires `Z` suffix and rejects local time strings.
- **Email** — `src/lib/email/index.ts` exports `sendBookingConfirmation()` and `sendOrderReceipt()`. Always call inside `try/catch`. Requires `RESEND_API_KEY` in `.env`.
- **Blog content** — stored as raw HTML in the `content` column. Rendered via `dangerouslySetInnerHTML` on the detail page. Admin-only input = trusted source.
- **Git history:** 3 commits — initial scaffold (`b25cdd3`), core platform (`b0641d6`), admin dashboard (`56073a1`).
