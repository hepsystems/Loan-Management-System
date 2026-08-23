# Nthakayathu Soya Cooperative

Full-stack website for the Nthakayathu agricultural cooperative (Malawi) — public site, member portal, and admin tools.

## Quick start

```bash
cd Nthakayathucooperative-main
npm install
cp .env.example .env
```

Then edit `.env` and fill in:

- `MONGODB_URI` — your MongoDB Atlas connection string (Atlas → Database → Connect → Drivers)
- `JWT_SECRET` — a long random string, e.g. generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

Then, **optionally**, import the old demo content (products, news, impact stories — no accounts) into your new MongoDB database:

```bash
npm run migrate
```

Create your own admin account (there are no baked-in demo accounts). Add to `.env`:

```
ADMIN_USERNAME=youradminname
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=a-strong-unique-password
ADMIN_NAME=Cooperative Admin
```

then run:

```bash
npm run create-admin
```

Log in with those credentials, then feel free to delete `ADMIN_PASSWORD` from `.env` — it's only read once by the script.

Finally:

```bash
npm start
```

Open **http://localhost:3000**

Regular members self-register from the **Membership Portal → Register** link on the site — no admin action needed. As an admin, once logged in you'll see a **Registered Members** table under the login form on the Membership section.

## What was fixed / added

### Backend (`server.js`)
- Express server serving the frontend and REST API
- **MongoDB Atlas persistence via Mongoose** (replaces the old JSON file store)
- Environment variables loaded from `.env` via `dotenv` (see `.env.example`)
- JWT authentication
- **New: member self-registration** (`POST /api/auth/register`) — validates input, checks for duplicate username/email, hashes the password with bcrypt, and signs the user in immediately
- Endpoints:
  - `POST /api/auth/register` — create a new member account (requires a valid, unused join code — see Join codes below)
  - `POST /api/auth/login` (rejects blocked accounts)
  - `GET /api/auth/me` (protected)
  - `POST /api/auth/forgot-password` — request a password reset (see Forgot password below)
  - `POST /api/auth/reset-password` — complete a password reset with a token
  - `GET/POST/PUT/DELETE /api/products`
  - `GET/POST/PUT/DELETE /api/news`
  - `GET/POST/PUT/DELETE /api/impact`
  - `GET /api/members` (admin only — cooperative members only, ranked; never includes the website admin account, never returns password hashes)
  - `PUT /api/members/:id/status` (admin only — block/unblock a member; blocked members can't log in)
  - `PUT /api/members/:id/committee` (admin only — correct/reassign a member's sub-committee)
  - `PUT /api/members/:id/position` (admin only — correct/reassign Chair/Secretary/Treasurer/Member)
  - `DELETE /api/members/:id` (admin only — permanently remove a member account)
  - `GET /api/members/export` (admin only — downloads a formatted PDF roster of all cooperative members)
  - `GET/POST /api/invite-codes` (admin only — list / generate join codes)
  - `DELETE /api/invite-codes/:id` (admin only — revoke a join code)
  - `GET/PUT /api/settings` (hero stats — public read, admin write)
  - `POST /api/orders` (+ admin list)
  - `POST /api/proposals` (+ admin list)
  - `POST /api/contact` (+ admin list)
  - `GET /api/member/dashboard` (protected)
  - `GET /api/health` (reports MongoDB connection status)

### Website admin vs cooperative membership
The website admin login (created via `npm run create-admin` / `ADMIN_*` env vars) is a **technical, site-management account only** — it is never treated as a cooperative membership record. It has `role: 'admin'` and is deliberately excluded from `/api/members`, the roster PDF, and every membership-facing feature. There is no way to register a new admin through the public Register form — that form always creates `role: 'member'`. If the person running the website is also an actual cooperative office-holder or committee member, they need a **separate** member account through the normal Register form to appear on the roster — their admin login and their cooperative membership are two different accounts.

### Join codes (invite-only registration)
Public registration now requires a join code. As an admin, open **Membership → Join Codes** to generate one (optionally with a note, a max number of uses, and an expiry). Give the code to the person you want to join — they enter it on the Register form. This is what keeps random signups out while still letting invited people self-register instead of you creating every account by hand.

### Leadership positions, ranking & badges
At registration, a member picks a **Position**: Chairperson, Secretary, Treasurer, or (default) Committee Member. The three top offices are ex-officio across every sub-committee, so picking one skips the committee picker entirely — only regular "Committee Member" registrations select a sub-committee. Only one active member can hold each of Chair/Secretary/Treasurer at a time; a duplicate registration attempt is rejected with a message to have the admin reassign the office first.

Everywhere members are listed (the admin table and the roster PDF), they're **ranked automatically**: Chair, then Secretary, then Treasurer at the top (shown with a gold badge), followed by regular members grouped by sub-committee in a fixed order (Finance → Marketing → Production → Membership/Welfare/Discipline → Not Yet Assigned), alphabetically within each group. The admin can correct anyone's position or committee after the fact via the dropdowns in the Registered Members table — this also re-enforces the single-holder rule for the top 3 offices.

### Downloadable members roster
Admins can click **Download Roster** in the Registered Members panel to get a formatted PDF (`GET /api/members/export`) with the cooperative's name as a letterhead, a generated timestamp, a Leadership section, and each sub-committee as its own section — all in ranked order. The website admin account is never included, and only active members are listed.

### Sub-committee selection
The four sub-committee options are Finance/Accounts/Resource Mobilization, Marketing & Sales, Production & Technical, and Membership/Welfare/Discipline (or "not yet assigned"), matching the structure shared by the Chair. This is separate from `role` (admin vs member) — committee/position describe a member's place in the cooperative; `role` is purely a website permission level and is never set by anyone through registration.

### Blocking / removing members
In the admin **Registered Members** table, every listed member has **Block** and **Remove** buttons (the website admin account never appears here, so there's no self-block risk):
- **Block** — the account and its data stay, but the person can no longer log in. Use this when someone's status is uncertain (e.g. no longer active, or you're not sure they're still a member). **Unblock** reverses it.
- **Remove** — permanently deletes the account. Use this once you're sure — e.g. she is not a member anymore, or changed her mind about joining. This cannot be undone.

### Forgot password
Currently the reset link is **logged to the server console** (not emailed) since no email service is configured yet — see item 3 under Production notes below for how to wire up real email delivery. Until then, an admin can watch the server logs (or SSH/Render logs) after a member clicks "Forgot password?", and relay the link to them directly.

### Frontend
- Loads products, news, impact, and hero stats from the API
- Admin controls only appear after a successful **admin** login
- Product / news / impact-story changes are saved permanently via the API
- Hero stats ("2,300+ Members" etc.) are editable by the admin instead of hardcoded in HTML
- Admins see a **Registered Members** table (name, username, email, phone, role, joined date) under the login form
- Orders, proposal requests, and contact messages are stored on the server
- **New: working "Register" modal** — creates a real account in MongoDB and signs the new member in automatically

## Project structure

```
Nthakayathucooperative-main/
├── server.js           # Express backend
├── package.json
├── .env.example         # Copy to .env and fill in real values (never commit .env)
├── config/
│   └── db.js            # Mongoose connection setup
├── models/               # Mongoose schemas (source of truth is MongoDB, not data/*.json)
│   ├── User.js
│   ├── Product.js
│   ├── News.js
│   ├── Impact.js
│   ├── Order.js
│   ├── Proposal.js
│   └── Contact.js
├── scripts/
│   └── migrate.js        # One-time import of data/*.json into MongoDB Atlas
├── data/                 # Legacy JSON files — kept only as the migration source
│   ├── products.json
│   ├── news.json
│   ├── impact.json
│   ├── orders.json
│   ├── proposals.json
│   ├── contacts.json
│   └── users.json
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

## Production notes

1. Set `MONGODB_URI` and `JWT_SECRET` as environment variables in your hosting provider (e.g. Render → Environment tab) — never commit `.env`.
2. In MongoDB Atlas, restrict Network Access to your server's IP (or `0.0.0.0/0` only if you understand the tradeoff), and create a dedicated database user with a strong password rather than reusing your Atlas account login.
3. Add email delivery (e.g. Nodemailer / Resend) for proposals, order confirmations, and the "forgot password" flow — the reset-token logic is fully implemented, it just logs the link to the server console instead of emailing it (see `/api/auth/forgot-password` in `server.js`).
4. Add HTTPS, rate limiting (especially on `/api/auth/login` and `/api/auth/register` to slow brute-force attempts), and additional input validation/sanitization.
5. Implement full Chichewa translations.
6. Replace placeholder images with authentic Malawi soya photography.

## License

See LICENSE.txt
