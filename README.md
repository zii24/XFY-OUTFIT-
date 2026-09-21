# XFY Outfit

A curated fashion discovery and commerce platform for independent Indonesian fashion brands. Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase.

## Stack

- **Frontend:** Next.js 14, React 18, TypeScript (strict), Tailwind CSS, Framer Motion, Lucide icons
- **Backend:** Next.js Server Actions + Route conventions (no separate API server)
- **Database & Auth:** Supabase (Postgres + Row Level Security + Auth)

## 1. Setup

```bash
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Create the database

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql` (schema + RLS policies).
3. Run `supabase/seed.sql` (6 demo brands, 24 demo products, 4 collections, 3 journal articles, one clearly-marked demo order). **Every brand and product in the seed is fictional** — do not present it as a real business.
4. Copy your project's URL and anon key from **Project Settings → API** into `.env.local`.

### Create your first admin user

Admin accounts are intentionally not self-serve (see `app/admin/(dashboard)/settings/page.tsx` for the same note in-product):

1. In Supabase, go to **Authentication → Users → Add user**, create yourself an account with email + password.
2. In the SQL editor:
   ```sql
   insert into admin_users (user_id, email)
   values ('<the user's UUID from step 1>', '<their email>');
   ```
3. Sign in at `/admin/login`.

### Run it

```bash
npm run dev
```

Storefront: `http://localhost:3000`. Admin: `http://localhost:3000/admin`.

**I could not run `npm install` / `npm run build` / `npm run typecheck` in the sandbox this was built in — it has no network access.** Please run `npm run typecheck` and `npm run build` locally before deploying; I've hand-verified every `@/…` import path resolves and the route structure matches the spec, but that's not a substitute for the compiler.

## 2. Environment variables

See `.env.example`. In short:

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Everything | Public, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything | Public — RLS is what actually protects data, not secrecy of this key |
| `SUPABASE_SERVICE_ROLE_KEY` | Nothing yet | Reserved for a future trusted server job (e.g. a cron). **Never** import it into a `"use client"` file or send it to the browser. Not currently used anywhere in this codebase. |
| `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` | Real payments | Leave blank — see "Payments" below |

## 3. What's fully working

- Full storefront: home, shop with functional filters/sort/search, product detail with gallery/variants/stock validation, brand directory + detail, collections, journal, about, submit-a-brand.
- Cart and wishlist (guest, localStorage-backed per the V1 spec), grouped by checkout destination (XFY / Shopee / Etsy).
- Multi-step checkout that creates a real `orders` row via a Server Action, **re-validating stock and price against the database** rather than trusting the client cart.
- Admin: Supabase-authenticated login, role-gated `/admin/*` (both in `middleware.ts` and again in the layout), full product CRUD, full brand CRUD, order list with status updates, a homepage CMS (hero + announcement bar), collections CRUD, journal CRUD.
- SEO: per-page metadata, Open Graph, JSON-LD Product schema, `sitemap.ts`, `robots.ts`.
- Accessibility: semantic landmarks, visible focus states, labelled form fields + inline errors, `aria-live` on quantity steppers, `prefers-reduced-motion` respected, keyboard-operable dialogs.

## 4. What's intentionally stubbed (and why)

Per the brief's own instruction — *"If a feature is not fully implemented, create a clear placeholder... rather than pretending it is functional"* — these are honest simplifications, not bugs:

- **Payments.** No gateway is wired up. Checkout creates an order with `payment_status = 'awaiting_payment'` (or `pending_manual` for cash-on-delivery) and stops — it never claims a payment succeeded without verification. Wire up Midtrans/Xendit in `lib/actions/orders.ts` when you have credentials.
- **Image upload.** Admin product/brand forms take image **URLs** (one per line), not a file-picker upload. Wire up Supabase Storage's upload API and swap the textarea for a dropzone when ready — the data model (`product_images`, `logo_url`, `cover_image_url`) already supports it.
- **Newsletter signup.** UI-only; no email provider connected. Swap `components/home/newsletter.tsx`'s handler for a real provider (Resend, Mailchimp, etc.) via a Server Action.
- **Stock decrement on order creation** happens as sequential `UPDATE`s in `lib/actions/orders.ts`, not inside a single DB transaction/stored procedure. Fine for MVP traffic; move to a Postgres function (`FOR UPDATE` row lock) before you expect concurrent checkouts on the same low-stock item.
- **Team roles.** `admin_users` is binary — a row grants full admin access. No scoped/read-only roles yet (noted in-product on `/admin/settings`).
- **International checkout.** Country is fixed to Indonesia in the checkout form, matching the brief's "don't overbuild international commerce in V1."

## 5. Database schema

See `supabase/migrations/0001_init.sql` for the authoritative, commented definition. Summary:

`brands`, `products`, `product_images`, `product_variants`, `collections`, `collection_products` (join table), `customers`, `orders`, `order_items`, `wishlist_items` (reserved for a future authenticated-customer sync — V1 wishlist lives in the browser), `journal_articles`, `brand_submissions`, `site_settings` (single-row homepage CMS), `admin_users`.

**Row Level Security** is on for every table. The short version: anyone can read `published`/`status='published'` rows; only a row in `admin_users` can write to catalog tables or read draft content; anyone can *insert* a customer/order/order-item (guest checkout) but only admins can read them back. See the migration file for the exact policies — don't take my summary as the source of truth.

## 6. Project structure

```
app/
  (storefront)/       # public routes, wrapped in header/footer/cart+wishlist providers
  admin/
    login/             # unguarded
    (dashboard)/        # everything else under /admin — guarded by middleware.ts + layout.tsx
components/
  ui/                  # hand-rolled shadcn-style primitives (button, input, select, …)
  layout/ product/ brand/ collection/ home/ admin/
context/               # cart + wishlist React context (localStorage)
lib/
  supabase/            # client.ts (browser), server.ts (RSC/Server Actions), middleware.ts
  data/                # read queries, one file per domain
  actions/             # Server Actions (mutations) — every one re-checks admin_users server-side
  validations/         # zod schemas
types/
supabase/
  migrations/0001_init.sql
  seed.sql
```

## 7. Security notes

- Every mutation in `lib/actions/*.ts` re-verifies the caller against `admin_users` server-side — the client is never trusted, even though `middleware.ts` also blocks the route.
- Checkout totals, stock, and prices are recomputed server-side from the database in `createOrder`; the client-supplied cart is only used to know *which* products and quantities were requested.
- `SUPABASE_SERVICE_ROLE_KEY` is documented but unused — nothing in this codebase needs to bypass RLS. Keep it that way unless you have a specific, reviewed reason not to.

## 8. Known limitations / next steps

- No automated tests yet (unit or e2e). I'd start with Playwright for the checkout flow given it's the highest-stakes path.
- No CI pipeline. Add `npm run typecheck && npm run lint && npm run build` as a GitHub Actions check before merging.
- Product search (`/shop?q=`) is a simple `ILIKE` on product name — fine for a few hundred SKUs, not fine at marketplace scale. Consider Postgres full-text search or a hosted search service (Algolia/Meilisearch) if the catalog grows.
- No pagination on `/shop` or `/admin/products` — both load the full published set. Add cursor pagination once the catalog exceeds a couple hundred items.
