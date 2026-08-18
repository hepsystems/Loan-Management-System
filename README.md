# Nthakayathu Soya Cooperative

Full-stack website for the Nthakayathu agricultural cooperative (Malawi) — public site, member portal, and admin tools.

## Quick start

```bash
cd Nthakayathucooperative-main
npm install
npm start
```

Open **http://localhost:3000**

### Demo accounts

| Username | Password  | Role   |
|----------|-----------|--------|
| admin    | admin123  | Admin  |
| member   | member123 | Member |

## What was fixed / added

### Backend (`server.js`)
- Express server serving the frontend and REST API
- JSON file persistence under `data/`
- JWT authentication (no more `?admin=true`)
- Endpoints:
  - `POST /api/auth/login`
  - `GET/POST/PUT/DELETE /api/products`
  - `GET/POST/PUT/DELETE /api/news`
  - `GET/POST /api/impact`
  - `POST /api/orders` (+ admin list)
  - `POST /api/proposals` (+ admin list)
  - `POST /api/contact` (+ admin list)
  - `GET /api/member/dashboard` (protected)
  - `GET /api/health`

### Frontend
- Loads products, news, and impact from the API
- Admin controls only appear after a successful **admin** login
- Product / news changes are saved permanently via the API
- Orders, proposal requests, and contact messages are stored on the server
- Login form uses username (demo credentials shown under the form)

## Project structure

```
Nthakayathucooperative-main/
├── server.js          # Express backend
├── package.json
├── data/              # JSON persistence
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

1. Change `JWT_SECRET` (env var) and use strong passwords.
2. Replace JSON files with a real database (PostgreSQL / MongoDB).
3. Add email delivery (e.g. Nodemailer / Resend) for proposals and order confirmations.
4. Add HTTPS, rate limiting, and proper input validation.
5. Implement full Chichewa translations and real member registration.
6. Replace placeholder images with authentic Malawi soya photography.

## License

See LICENSE.txt
