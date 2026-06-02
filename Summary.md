# AC Services Platform — Project State Summary

---

## 1. Project Overview

**Purpose:** A full-stack Air Conditioning services business platform for a Philippine-based AC company. Dual-purpose: an e-commerce store selling AC units + a service booking system for technicians.

**Status:** ~80% complete. Core features, homepage, customer account pages, dark mode, and i18n (EN/TH) are all live and committed.

**Implemented features:**
- JWT-based auth (register, login, logout, role-based middleware)
- Product catalog with filtering, sorting, pagination, and JSON-LD schema
- Service booking system with live technician availability calendar
- Shopping cart (Zustand + localStorage) with cart drawer and checkout
- Order creation with stock validation and atomic decrement
- Admin dashboard: orders, bookings, products CRUD, technicians view
- Full database schema with Drizzle ORM
- Homepage with 6 sections (hero, service highlights, featured products, why-choose-us, testimonials, CTA)
- Customer account pages: /account, /orders, /bookings
- Dark mode (CSS variable-based, `.dark` class toggle, FOUC-free blocking script)
- i18n: English / Thai with cookie-based server-side detection

---

## 2. Architecture

**High-level:** Next.js 16 App Router monolith. Server Components fetch data, Client Components handle interactivity. Server Actions handle all mutations. No separate API layer except where needed (availability endpoint).

**Design decisions:**
- **Prices in cents (integer)** — avoids float precision bugs. `formatPrice()` converts at display time only
- **Address/product snapshot in JSONB** — orders and bookings preserve state at transaction time
- **Specifications in JSONB** — flexible per-product without schema migrations
- **Cart in localStorage via Zustand** — no DB cart table; server re-validates stock at checkout
- **JWT in httpOnly cookie** — `jose` library, works on Edge runtime
- **URL-driven filters** — all product filtering via search params, shareable and SSR-compatible
- **Route groups for layout separation** — `(marketing)`, `(shop)`, `(booking)`, `(auth)` each have their own layout without affecting URL paths
- **Navbar is a Server Component** — reads session + lang server-side; only `MobileNav`, `UserMenu`, and `CartDrawer` are client islands
- **Dark mode via `.dark` class on `<html>`** — blocking inline script prevents FOUC; `ThemeProvider` syncs localStorage + DOM
- **i18n via cookie** — `LanguageProvider` writes `lang` cookie on toggle; server components read it via `getLang()` / `getT()` helpers

**Data flow:**
```
User → Server Component (fetch data + lang) → render HTML
User action → Client Component → Server Action → DB → revalidatePath → re-render
Booking wizard → fetch /api/availability → slot picker → Server Action → DB
Theme toggle → ThemeProvider → .dark on <html> + localStorage
Lang toggle → LanguageProvider → cookie + React state → all components re-render
```

**Routing structure:**
```
/ → (marketing)/(home)/page.tsx
/products → (shop)/products/page.tsx
/products/[slug] → (shop)/products/[slug]/page.tsx
/cart → (shop)/cart/page.tsx
/checkout → (shop)/checkout/page.tsx
/orders → (shop)/orders/page.tsx                    ← NEW
/orders/[id]/confirmation → (shop)/orders/[id]/confirmation/page.tsx
/account → (shop)/account/page.tsx                  ← NEW
/services → (booking)/services/page.tsx
/book/[serviceId] → (booking)/book/[serviceId]/page.tsx
/bookings → (booking)/bookings/page.tsx             ← NEW
/bookings/[id]/confirmation → (booking)/bookings/[id]/confirmation/page.tsx
/login, /register, /forgot-password → (auth)/...
/admin/* → admin/... (role-guarded layout)
/api/auth/session → GET session for client components
/api/availability → GET available time slots
```

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui built on **@base-ui/react** (NOT Radix — breaking difference) |
| Database | PostgreSQL |
| ORM | Drizzle ORM (`drizzle-orm/node-postgres`) |
| Auth | Custom JWT via `jose`, httpOnly cookies |
| Password hashing | `bcryptjs` |
| Cart state | Zustand with `persist` middleware |
| Validation | Zod (server-side in actions) |
| Forms | Native `<form>` + `useActionState` (no react-hook-form used yet) |
| Toast notifications | Sonner |
| Icons | Lucide React |
| Dark mode | CSS variables + `.dark` class on `<html>` (ThemeProvider) |
| i18n | Custom cookie-based system — `src/i18n/en.ts` + `src/i18n/th.ts` |
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
│   │   ├── (marketing)/         # homepage, blog, about, contact
│   │   ├── (shop)/              # products, cart, checkout, orders (list + confirmation), account
│   │   ├── admin/               # full admin panel, role-guarded
│   │   │   ├── dashboard/
│   │   │   ├── orders/[id]/
│   │   │   ├── bookings/[id]/
│   │   │   ├── products/[id]/edit/
│   │   │   └── technicians/
│   │   ├── api/
│   │   │   ├── auth/session/    # GET — returns session for client hooks
│   │   │   └── availability/    # GET — returns time slots for booking wizard
│   │   ├── layout.tsx           # root layout — ThemeProvider, LanguageProvider, blocking theme script
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── account/             # LogoutButton (client)
│   │   ├── admin/               # StatCard, StatusBadge, DataTable, OrderStatusUpdater,
│   │   │                        # BookingStatusUpdater, ProductEditForm, ToggleProductStatus
│   │   ├── auth/                # LoginForm, RegisterForm (both use useLanguage)
│   │   ├── booking/             # BookingCalendar, SlotPicker, BookingWizard (all use useLanguage)
│   │   ├── layout/              # Navbar (server, uses getT), Footer (server, uses getT),
│   │   │                        # MobileNav (client, uses useLanguage), UserMenu (client, useLanguage+useTheme)
│   │   ├── providers/           # ThemeProvider, LanguageProvider
│   │   ├── seo/                 # ProductJsonLd, LocalBusinessJsonLd
│   │   ├── shop/                # ProductCard, ProductFilters, ProductSort, Pagination,
│   │   │                        # ImageGallery, AddToCartButton, CartDrawer (useLanguage),
│   │   │                        # CartPageClient, CheckoutForm
│   │   └── ui/                  # shadcn primitives
│   ├── config/
│   │   ├── site.ts              # Business info, SEO, JSON-LD source of truth
│   │   └── services.ts          # 4 service types with pricing, FAQs, includes
│   ├── db/
│   │   ├── index.ts             # Drizzle instance + pg Pool
│   │   ├── schema/              # users, products, orders, bookings, technicians, blog
│   │   ├── migrations/          # 0000_heavy_blindfold.sql (all tables)
│   │   ├── seed.ts              # 6 AC products
│   │   ├── seed-technician.ts   # Test technician (Mon–Sat schedule)
│   │   └── seed-admin.ts        # Admin user
│   ├── i18n/                    # ← NEW
│   │   ├── en.ts                # Full English translations (~150 keys, 14 namespaces)
│   │   ├── th.ts                # Full Thai translations (mirrors en.ts)
│   │   └── index.ts             # Language type, translations record export
│   ├── lib/
│   │   ├── actions/             # auth.ts, bookings.ts, orders.ts, admin.ts
│   │   ├── helpers/
│   │   │   ├── price.ts         # formatPrice, discountPercent
│   │   │   └── lang.ts          # getLang(), getT() — server-side cookie reader ← NEW
│   │   ├── hooks/               # useSession.ts
│   │   ├── queries/             # products.ts, availability.ts, admin.ts, account.ts ← NEW
│   │   ├── session.ts           # createSession, getSession, deleteSession
│   │   ├── store/               # cart.ts (Zustand)
│   │   └── validations/         # auth.ts, booking.ts, checkout.ts
│   ├── middleware.ts            # Route guards: /account, /bookings, /orders, /checkout, admin
│   └── types/
│       └── index.ts             # Inferred DB types + composite types + CartItem, TimeSlot
├── drizzle.config.ts
├── .env.example
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

**Prices:** Always stored and computed in cents (integer). Convert to ₱ only at display time using `formatPrice()` from `src/lib/helpers/price.ts`.

**Mutations always use Server Actions**, never direct DB calls from client. Client components call server actions via `useActionState` or `useTransition`.

**`revalidatePath()`** must be called in admin actions after every mutation.

**Zod validation** happens inside server actions, never client-side only.

**Dark mode:** Toggle `.dark` class on `<html>`. Use `dark:` Tailwind variants in all components. Never hardcode `bg-white` without a `dark:bg-gray-900` (or similar) counterpart.

**i18n:** All UI strings come from `src/i18n/en.ts` / `src/i18n/th.ts`.
- **Client components:** use `const { t } = useLanguage()` from `@/components/providers/LanguageProvider`
- **Server components:** use `const t = await getT()` from `@/lib/helpers/lang`
- Never hardcode user-visible English strings in components — always pull from `t.*`
- Adding new strings: add to `en.ts` first, then mirror in `th.ts`

**Comments:** None unless WHY is non-obvious. No JSDoc.

**No `asChild`** anywhere — wrong library version.

---

## 6. Current Implementation State

### ✅ Complete
- Database schema (all tables, enums, relations)
- Drizzle migrations applied to PostgreSQL
- Seed data: 6 products, 1 technician, 1 admin user
- Auth system (register, login, logout, session, middleware)
- Layout system (Navbar, Footer, MobileNav, UserMenu, CartDrawer, admin sidebar)
- Product catalog: listing with filters/sort/pagination, detail page with gallery
- Service booking: services page, 3-step wizard, availability API, confirmation page
- Shopping cart: Zustand store, CartDrawer, CartPageClient
- Checkout: form, order server action, stock decrement, confirmation page
- Admin: dashboard stats, orders list+detail+status update, bookings list+detail+technician assignment, products list+edit+toggle, technicians card grid
- JSON-LD schemas: Product, LocalBusiness
- Global error boundary, 404, loading spinner
- **Homepage** — hero, service highlights, featured products, why-choose-us, testimonials, CTA
- **Customer account pages** — /account (profile + stats), /orders (history), /bookings (history)
- **Dark mode** — full site coverage, FOUC-free, persisted in localStorage
- **i18n (EN/TH)** — 14 namespaces, ~150 keys, cookie-based server-side detection, all client + server components wired

### 🔶 Partially complete
- Admin products — no create new product page yet (only edit)
- Admin blog — route exists in sidebar but no page built
- Forgot password page — UI only, no email sending logic
- Cart badge on mobile nav — CartDrawer exists on desktop Navbar only

### ❌ Not yet built
- Blog / articles section (posts, tags, MDX rendering)
- Email notifications (booking confirmations, order receipts)
- Sitemap.xml and robots.txt
- Payment gateway integration (GCash / PayMongo stub exists)
- Image upload for products (currently placeholder paths)
- Admin blog CRUD
- Admin create new product
- Review/rating submission after booking completion
- `/admin/customers` and `/admin/settings` pages (linked in sidebar, not built)

---

## 7. Remaining Tasks (priority order)

1. **Blog section** — `/blog` listing, `/blog/[slug]` detail, admin CRUD, MDX or HTML rendering
2. **Email notifications** — booking confirmation + order receipt via Resend
3. **Admin: create product** — `/admin/products/new` page
4. **Sitemap + robots.txt** — `src/app/sitemap.ts`, `src/app/robots.ts`
5. **Image upload** — Cloudflare R2 or local for product images
6. **Payment gateway** — PayMongo or Stripe integration stub

**Known issues / blockers:**
- Product images are placeholder paths (`/images/products/[slug].jpg`) — no real images or upload system yet
- `forgot-password` has no backend logic — needs Resend + token table
- Mobile nav doesn't include CartDrawer (only desktop Navbar has it)
- Admin sidebar links to `/admin/customers` and `/admin/settings` — those pages don't exist yet

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
| `common` | Shared micro-strings |

**Language switching:**
- User toggles in the UserMenu dropdown
- `LanguageProvider` flips React state (instant client re-render) + writes `lang=<en|th>` cookie (1-year)
- Server components call `getLang()` / `getT()` from `src/lib/helpers/lang.ts` which reads the cookie via Next.js `cookies()`
- On any page navigation, server-rendered HTML arrives already in the correct language

---

## 9. Dark Mode System

- CSS variables defined in `globals.css` under `:root` (light) and `.dark` (dark)
- Tailwind v4 custom variant: `@custom-variant dark (&:is(.dark *))`
- Blocking inline `<script>` in `<head>` reads `localStorage.theme` and applies `.dark` before paint — no flash
- `ThemeProvider` manages React state, syncs with `localStorage` and `document.documentElement.classList`
- All components use `dark:` variants. Convention: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-gray-100`, `border-gray-200 dark:border-gray-800`

---

## 10. Environment and Configuration

**Required `.env.local` variables:**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ac_services"

# Auth (generate: openssl rand -base64 32)
SESSION_SECRET="your-32-char-secret-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (when building notifications)
RESEND_API_KEY=""
EMAIL_FROM="no-reply@coolairservices.com"

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
- **Technician availability** — weekly schedule stored as JSON keyed `"0"–"6"` (0=Sunday). Sundays are always off. Calendar disables Sundays and >60 days ahead.
- **Stock decrement** uses `` sql`${products.stock} - ${qty}` `` — atomic, not read-then-write.
- **Service booking does not require login** — guests can book (userId nullable). Orders require login (middleware guard on `/checkout`).
- **Admin double-guard** — middleware blocks non-admins AND `admin/layout.tsx` re-checks server-side. Both are intentional.
- **`servicesConfig`** in `src/config/services.ts` is the single source of truth for service types, pricing, and FAQs. Do not duplicate this data in the DB. Strip the `icon` field before passing to client components.
- **i18n strings** — never hardcode user-visible English text in components. Always use `t.*` from `useLanguage()` (client) or `getT()` (server).
- **Dark mode** — every new component must include `dark:` variants for all background, border, and text color classes.
- **Git history:** 3 commits — initial scaffold (`b25cdd3`), core platform (`b0641d6`), admin dashboard (`56073a1`).
