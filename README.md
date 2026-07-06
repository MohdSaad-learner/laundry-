# New Life — Laundry & Dry Cleaning Manager

A full admin web app for a dyers/dry-cleaning business: Dashboard, Orders,
Customers, Services, Invoices, Delivery, Inventory, Expenses, Reports, Staff,
and Settings — all backed by a real database (Supabase) with login.

This guide assumes **zero prior hosting experience**. Follow it top to bottom.

---

## What you'll end up with

- A free Supabase project = your database + login system
- A free Vercel project = your live website, with a real URL like
  `https://new-life-laundry.vercel.app`
- Your own GitHub account holding the code (so Vercel can deploy it)

Total cost: **$0** to start.

---

## Part 1 — Create your database (Supabase)

1. Go to https://supabase.com and click **Start your project** → sign up
   (GitHub or email is fine).
2. Click **New project**.
   - Name: `new-life-laundry` (anything you like)
   - Database password: generate one and **save it somewhere safe**
   - Region: pick the one closest to you
   - Click **Create new project** (takes ~1–2 minutes to spin up).
3. Once it's ready, in the left sidebar click the **SQL Editor** icon.
4. Click **New query**.
5. Open the file `supabase/schema.sql` from this project, copy its entire
   contents, paste it into the SQL editor, and click **Run**.
   - This creates every table (orders, customers, invoices, etc.) and locks
     each one down so only you can see your own data.
6. In the left sidebar, go to **Project Settings → API**.
   - Copy the **Project URL** and the **anon public** key. You'll need both
     in Part 2.
7. Still in Supabase, go to **Authentication → Providers** and make sure
   **Email** is enabled (it is by default). Optionally, under
   **Authentication → Settings**, turn off "Confirm email" while you're
   testing, so new accounts can sign in immediately — turn it back on before
   going live with real customers.

Your database is ready.

---

## Part 2 — Run the app on your computer first (recommended)

1. Install **Node.js** if you don't have it: https://nodejs.org (choose the
   LTS version), just click through the installer.
2. Unzip/open this project folder in a terminal (on Windows: right-click the
   folder → "Open in Terminal"; on Mac: right-click → "New Terminal at
   Folder").
3. Install dependencies:
   ```
   npm install
   ```
4. Create your local environment file:
   ```
   cp .env.example .env
   ```
   (On Windows, just duplicate `.env.example`, rename the copy to `.env`.)
5. Open `.env` in any text editor and paste in the **Project URL** and
   **anon public key** from Part 1, step 6:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
6. Start the app:
   ```
   npm run dev
   ```
7. Open the link it prints (usually `http://localhost:5173`) in your
   browser. Click **Sign up**, create your admin login, and confirm your
   email if prompted. You're now in your dashboard — add a customer, a
   service, and an order to make sure everything saves correctly.

---

## Part 3 — Put the code on GitHub

1. Go to https://github.com and create a free account if you don't have one.
2. Click the **+** in the top right → **New repository**.
   - Name it `new-life-laundry`
   - Keep it **Private** if you don't want the code public
   - Click **Create repository**
3. Back in your terminal, inside the project folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/new-life-laundry.git
   git push -u origin main
   ```
   (Replace `YOUR-USERNAME` with your GitHub username. GitHub will show you
   this exact command on the empty repository page too — you can copy it
   from there instead.)

---

## Part 4 — Host it online (Vercel)

1. Go to https://vercel.com and sign up using your **GitHub** account (this
   makes deployment automatic).
2. Click **Add New → Project**.
3. Find `new-life-laundry` in the list and click **Import**.
4. Vercel will detect it's a Vite app automatically. Before clicking
   Deploy, open **Environment Variables** and add the same two values from
   your `.env` file:
   - `VITE_SUPABASE_URL` → your project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Click **Deploy**. Wait ~1 minute.
6. You'll get a live link like `https://new-life-laundry.vercel.app` —
   that's your website, live on the internet.

From now on, any time you `git push` new changes to GitHub, Vercel
automatically re-deploys your site — no extra steps.

---

## Using a custom domain (optional)

If you own a domain (e.g. `newlifelaundry.com`):
1. In Vercel, open your project → **Settings → Domains** → add your domain.
2. Vercel shows you 1–2 DNS records to add at your domain registrar (wherever
   you bought the domain — GoDaddy, Namecheap, etc.).
3. Add those records there; it usually takes effect within an hour.

---

## What's included

| Module | What it does |
|---|---|
| Dashboard | Live order counts, revenue, status breakdown, 7-day trend |
| Orders | Create orders with line items, assign customer/service, track status, auto-generates an invoice |
| Customers | Full customer directory with VIP tagging and status |
| Services | Manage your price list and categories |
| Invoices | Auto-created from orders, printable preview, mark as paid |
| Delivery | Schedule deliveries from existing orders, assign staff, track status |
| Inventory | Track stock, unit price, and low-stock flags |
| Expenses | Log business expenses by category and vendor |
| Reports | Revenue vs. expenses, revenue by service, revenue by payment mode |
| Staff | Employee directory with department, role, and salary |
| Settings | Business profile shown on invoices |

## Notes on the data model

- Every table has an `owner_id`. Row Level Security means each signed-in
  account only ever sees rows it created — this is what lets multiple staff
  logins (or multiple shops) safely share the same database if you ever need
  that.
- Creating an Order automatically inserts a matching Invoice row.
- Marking an order "Delivered" automatically marks its invoice "Paid".

## If something doesn't load

- Blank dashboard / errors in the browser console mentioning "Supabase" →
  double check `.env` (locally) or the Vercel environment variables (online)
  match Part 1, step 6 exactly, with no extra spaces.
- "Row level security" errors → make sure you ran the entire `schema.sql`
  file, and that you're signed in (not browsing anonymously).
