I'm continuing development of an AC services platform built with **Next.js 16.2.7** (App Router), **TypeScript**, **Tailwind CSS v4**, **Drizzle ORM + PostgreSQL**, and **shadcn/ui on @base-ui/react** (NOT Radix — no `asChild` prop).

The project is at `/Users/pure/Desktop/BuildNSign/ac-services`.
Read `Summary.md` at the project root for the full project state before doing anything.

---

## Critical rules — read before writing any code

1. **`@base-ui/react` not Radix** — no `asChild`, always check `src/components/ui/` source before using a primitive
2. **Next.js 16** — `cookies()`, `params`, `searchParams` are all async, must be awaited
3. **Prices always in satang** (integer, 1 THB = 100 satang) — admin forms take baht input and multiply × 100 in the server action. Display only via `formatPrice()` from `src/lib/helpers/price.ts`. Column names are `*_in_satang`, TypeScript properties are `*InSatang`
4. **Server Actions signature:** `(_prev: ResultType, formData: FormData) => Promise<ResultType>`
5. **Never pass functions or Lucide icons as props** from Server → Client Components
6. **All mutations via Server Actions + `revalidatePath()`** — never direct DB calls from client
7. **Dark mode** — every component needs `dark:` variants on all bg/border/text classes
8. **i18n** — never hardcode user-visible strings; use `const { lang, t } = useLanguage()` in client components and `const t = await getT()` / `const lang = await getLang()` in server components. Add new strings to `src/i18n/en.ts` first, then mirror in `src/i18n/th.ts`
9. **Multi-step forms** — never use `{condition && <fields />}` for steps — inputs get removed from DOM. Use `className={condition ? "..." : "hidden"}` so all inputs stay in DOM for form submission
10. **Zod datetime** — always use `.datetime({ local: true })`. Default `.datetime()` requires a `Z` suffix and rejects local time strings like `"2026-06-05T09:00:00"`
11. **Email** — `sendBookingConfirmation()`, `sendOrderReceipt()`, `sendPasswordReset()` from `src/lib/email`. Always wrap in `try/catch` — never block user flow on email failure
12. **Image upload** — always server-side via `uploadProductImageAction(productId, formData)` in `src/lib/actions/images.ts`. Never use presigned URLs (CORS issue with the R2 API token). File goes browser → Next.js Server Action → R2 `PutObjectCommand`
13. **Bilingual product content** — products have `name`/`nameTh`, `shortDescription`/`shortDescriptionTh`, `description`/`descriptionTh` in DB. Pick at render time: `lang === "th" && product.nameTh ? product.nameTh : product.name`
14. **servicesConfig** — `src/config/services.ts` is the single source of truth for service data. Has both EN and TH fields (`titleTh`, `taglineTh`, `descriptionTh`, `includesTh`, `faqsTh`). Strip the `icon` field before passing to any Client Component
15. **Language is Thai by default** — `getLang()` returns `"th"` when no cookie exists. `LanguageProvider` initialises to `"th"`. Toggle calls `router.refresh()` so Server Components re-render instantly without a page reload
16. **Card payment form** — the submit button is `type="button"` with `onClick`. After OmiseJS tokenizes, call `fd.set("opnToken", token)` directly on the `FormData` object — do NOT set a hidden input via ref and then read it with `new FormData(form)` (React reconciler timing issue)
17. **Opn Payments API** — server calls go to `https://api.omise.co` (NOT `api.opn.ooo`). Currency must be `"THB"` (account is Thailand). OmiseJS CDN: `https://cdn.omise.co/omise.js`
18. **Zustand cart store is version 2** — has a `migrate()` function that renames `unitPriceInCents` → `unitPriceInSatang` from localStorage. Never remove or downgrade the version number

---

## Architecture snapshot

- **Server Components** fetch data + call `getT()` / `getLang()` for translations
- **Client Components** use `useLanguage()` for translations, `useActionState` / `useTransition` for mutations
- **Language switch** → `LanguageProvider.toggle()` sets cookie + `setLang()` + `router.refresh()` — no page reload
- **R2 upload** → `uploadProductImageAction` receives `FormData` with a `File`, converts to `Buffer`, calls `PutObjectCommand`; `NEXT_PUBLIC_STORAGE_URL` is the public base URL used by `next/image`
- **Password reset** → `password_reset_tokens` table; token is a 64-char hex string, expires 1 hr, one-time use (`used_at`); `requestPasswordResetAction` always returns success (prevents email enumeration)
- **Card payment** → client tokenizes via OmiseJS → `createOrderAction` creates order + calls `api.omise.co/charges` → if `successful`: confirm inline; if `pending` (3DS): redirect to `authorize_uri` → `/api/payment/return` verifies charge + confirms order
- **Saved cards** → Opn Customer object per user (`users.opn_customer_id`), card metadata in `saved_cards` table; at checkout, saved cards shown as radio options, charged via `customer`+`card` params
- **DB migrations applied:** `0000` initial · `0001` product i18n · `0002` password_reset_tokens · `0003` saved_cards + opn_customer_id · `0004` rename all `*_in_cents` → `*_in_satang`

---

## Remaining tasks

None — all planned features are complete.

---

## Key file locations

| What | Where |
|------|-------|
| i18n strings | `src/i18n/en.ts` + `src/i18n/th.ts` |
| Lang helpers | `src/lib/helpers/lang.ts` — `getLang()`, `getT()` |
| Lang provider | `src/components/providers/LanguageProvider.tsx` — `useLanguage()` |
| Price helper | `src/lib/helpers/price.ts` — `formatPrice()` (th-TH/THB/฿), `discountPercent()` |
| R2 storage | `src/lib/storage.ts` — `uploadToR2()`, `deleteFromR2()` |
| Image actions | `src/lib/actions/images.ts` — `uploadProductImageAction`, `saveProductImageAction`, `setPrimaryImageAction`, `deleteProductImageAction` |
| Auth actions | `src/lib/actions/auth.ts` — login, register, logout, requestPasswordReset, resetPassword |
| Order actions | `src/lib/actions/orders.ts` — `createOrderAction` (all payment paths), `confirmOrder()` |
| Card actions | `src/lib/actions/cards.ts` — `deleteCardAction`, `setDefaultCardAction` |
| Admin actions | `src/lib/actions/admin.ts` — product CRUD, order/booking status |
| Opn API client | `src/lib/payment/opn.ts` — `createCharge`, `retrieveCharge`, `createCustomerWithCard`, `addCardToCustomer`, `deleteCustomerCard` |
| Payment return | `src/app/api/payment/return/route.ts` — 3DS return handler |
| Email | `src/lib/email/index.ts` — `sendBookingConfirmation`, `sendOrderReceipt`, `sendPasswordReset` |
| Services config | `src/config/services.ts` — bilingual service data |
| DB schema | `src/db/schema/` — all tables; `index.ts` re-exports everything |
| Saved cards schema | `src/db/schema/savedCards.ts` |
| Session | `src/lib/session.ts` — `getSession()`, `createSession()`, `deleteSession()` |
| Product queries | `src/lib/queries/products.ts` — includes `nameTh`, `shortDescriptionTh`, `priceInSatang` in selects |
| Cart store | `src/lib/store/cart.ts` — Zustand v2 with localStorage migration |
| Checkout form | `src/components/shop/CheckoutForm.tsx` — OmiseJS, saved cards, card form |
| Saved cards UI | `src/components/account/SavedCardsManager.tsx` — delete/set-default |
| Account cards page | `src/app/(shop)/account/cards/page.tsx` |
