I'm continuing development of an AC services platform built with **Next.js 16.2.7** (App Router), **TypeScript**, **Tailwind CSS v4**, **Drizzle ORM + PostgreSQL**, and **shadcn/ui on @base-ui/react** (NOT Radix — no `asChild` prop).

The project is at `/Users/pure/Desktop/BuildNSign/ac-services`.
Read `Summary.md` at the project root for the full project state before doing anything.

## Critical rules — read before writing any code

1. **`@base-ui/react` not Radix** — no `asChild`, always check `src/components/ui/` source before using a primitive
2. **Next.js 16** — `cookies()`, `params`, `searchParams` are all async, must be awaited
3. **Prices always in cents** (integer) — admin forms take peso input and multiply × 100 in the server action. Display only via `formatPrice()` from `src/lib/helpers/price.ts`
4. **Server Actions signature:** `(_prev: ResultType, formData: FormData) => Promise<ResultType>`
5. **Never pass functions or Lucide icons as props** from Server → Client Components
6. **All mutations via Server Actions + `revalidatePath()`** — never direct DB calls from client
7. **Dark mode** — every component needs `dark:` variants on all bg/border/text classes
8. **i18n** — never hardcode user-visible English strings; use `const { t } = useLanguage()` in client components and `const t = await getT()` in server components. Add new strings to `src/i18n/en.ts` first, then mirror in `src/i18n/th.ts`
9. **Multi-step forms** — never use `{condition && <fields />}` for steps — inputs get removed from DOM. Use `className={condition ? "..." : "hidden"}` so all inputs stay in DOM for form submission
10. **Zod datetime** — always use `.datetime({ local: true })`. Default `.datetime()` requires a `Z` suffix and rejects local time strings like `"2026-06-05T09:00:00"`
11. **Email** — `sendBookingConfirmation()` and `sendOrderReceipt()` from `src/lib/email`. Always wrap in `try/catch` — never block user flow on email failure

## Remaining tasks (priority order from Summary.md Section 7)

1. **Sitemap + robots.txt** — `src/app/sitemap.ts` and `src/app/robots.ts`
2. **Image upload** — Cloudflare R2 or local for product images
3. **Payment gateway** — PayMongo or Stripe integration stub
4. **Forgot password** — email token flow via Resend (API key already configured)
5. **Mobile nav cart badge** — CartDrawer missing on mobile
6. **Admin customers/settings** — placeholder pages (sidebar links currently 404)
