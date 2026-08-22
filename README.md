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
  - `POST /api/auth/register` — create a new member account
  - `POST /api/auth/login`
  - `GET /api/auth/me` (protected)
  - `GET/POST/PUT/DELETE /api/products`
  - `GET/POST/PUT/DELETE /api/news`
  - `GET/POST/PUT/DELETE /api/impact`
  - `GET /api/members` (admin only — never returns password hashes)
  - `PUT /api/members/:id/role` (admin only — promote/demote a member)
  - `GET/PUT /api/settings` (hero stats — public read, admin write)
  - `POST /api/orders` (+ admin list)
  - `POST /api/proposals` (+ admin list)
  - `POST /api/contact` (+ admin list)
  - `GET /api/member/dashboard` (protected)
  - `GET /api/health` (reports MongoDB connection status)

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
3. Add email delivery (e.g. Nodemailer / Resend) for proposals, order confirmations, and a real "forgot password" flow (currently a placeholder link).
4. Add HTTPS, rate limiting (especially on `/api/auth/login` and `/api/auth/register` to slow brute-force attempts), and additional input validation/sanitization.
5. Implement full Chichewa translations.
6. Replace placeholder images with authentic Malawi soya photography.

## License

See LICENSE.txt
