# StageNZ - AI Virtual Staging

## Stack
- Next.js 15 + Tailwind
- NextAuth (Google + Email magic link)
- Supabase (Postgres DB + image storage)
- Replicate (AI staging model)
- Stripe (subscriptions)
- Netlify (hosting)

## Setup

### 1. Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env.local
```
Fill in all values (see below for where to get each one).

### 3. Supabase
- Create project at supabase.com
- Run `supabase-schema.sql` in the SQL editor
- Create a storage bucket called `renders`, set to public

### 4. Google OAuth
- Go to console.cloud.google.com
- Create OAuth 2.0 credentials
- Add `http://localhost:3000/api/auth/callback/google` as authorised redirect URI

### 5. Stripe
- Create 3 products in Stripe dashboard: Starter ($29), Pro ($79), Agency ($199)
- Set them as recurring monthly subscriptions
- Copy the price IDs into .env.local
- Set up webhook: endpoint `/api/webhooks/stripe`, events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`

### 6. Replicate
- Sign up at replicate.com
- Get API token

### 7. Run
```bash
npm run dev
```

## Plans
| Plan | Price | Renders |
|------|-------|---------|
| Starter | $29/mo | 20 |
| Pro | $79/mo | 100 |
| Agency | $199/mo | Unlimited |

## Pages
- `/` - Landing page
- `/login` - Sign in (Google or magic link)
- `/dashboard` - User dashboard, recent renders
- `/staging` - Upload and stage a room
- `/account` - Billing and plan management
