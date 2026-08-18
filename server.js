/**
 * Nthakayathu Soya Cooperative – Backend Server
 * Express + JSON file store + JWT auth
 *
 * Run: npm install && npm start
 * Default: http://localhost:3000
 *
 * Demo accounts:
 *   admin  / admin123   (full admin)
 *   member / member123  (member portal)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nthakayathu-coop-dev-secret-change-in-production';
const DATA_DIR = path.join(__dirname, 'data');

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

// ─── Helpers ──────────────────────────────────────────────────
function readJSON(filename) {
  const file = path.join(DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.warn(`Could not read ${filename}:`, e.message);
    return [];
  }
}

function writeJSON(filename, data) {
  const file = path.join(DATA_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

// ─── Auth ─────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const users = readJSON('users.json');
  const user = users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name }
  });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

// ─── Products ─────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  res.json(readJSON('products.json'));
});

app.post('/api/products', adminRequired, (req, res) => {
  const { name, description, price } = req.body || {};
  if (!name || !description || !price) {
    return res.status(400).json({ error: 'name, description and price are required' });
  }
  const products = readJSON('products.json');
  const item = {
    id: Date.now(),
    name: String(name).trim(),
    description: String(description).trim(),
    price: String(price).trim()
  };
  products.push(item);
  writeJSON('products.json', products);
  res.status(201).json(item);
});

app.put('/api/products/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const products = readJSON('products.json');
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const { name, description, price } = req.body || {};
  if (name !== undefined) products[idx].name = String(name).trim();
  if (description !== undefined) products[idx].description = String(description).trim();
  if (price !== undefined) products[idx].price = String(price).trim();

  writeJSON('products.json', products);
  res.json(products[idx]);
});

app.delete('/api/products/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  let products = readJSON('products.json');
  const before = products.length;
  products = products.filter(p => p.id !== id);
  if (products.length === before) return res.status(404).json({ error: 'Product not found' });
  writeJSON('products.json', products);
  res.json({ success: true });
});

// ─── News ─────────────────────────────────────────────────────
app.get('/api/news', (req, res) => {
  res.json(readJSON('news.json'));
});

app.post('/api/news', adminRequired, (req, res) => {
  const { title, excerpt, date } = req.body || {};
  if (!title || !excerpt) {
    return res.status(400).json({ error: 'title and excerpt are required' });
  }
  const news = readJSON('news.json');
  const item = {
    id: Date.now(),
    title: String(title).trim(),
    excerpt: String(excerpt).trim(),
    date: date ? String(date).trim() : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  };
  news.unshift(item);
  writeJSON('news.json', news);
  res.status(201).json(item);
});

app.put('/api/news/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const news = readJSON('news.json');
  const idx = news.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'News not found' });

  const { title, excerpt, date } = req.body || {};
  if (title !== undefined) news[idx].title = String(title).trim();
  if (excerpt !== undefined) news[idx].excerpt = String(excerpt).trim();
  if (date !== undefined) news[idx].date = String(date).trim();

  writeJSON('news.json', news);
  res.json(news[idx]);
});

app.delete('/api/news/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  let news = readJSON('news.json');
  const before = news.length;
  news = news.filter(n => n.id !== id);
  if (news.length === before) return res.status(404).json({ error: 'News not found' });
  writeJSON('news.json', news);
  res.json({ success: true });
});

// ─── Impact stories ───────────────────────────────────────────
app.get('/api/impact', (req, res) => {
  res.json(readJSON('impact.json'));
});

app.post('/api/impact', adminRequired, (req, res) => {
  const { name, text, meta, color } = req.body || {};
  if (!name || !text) {
    return res.status(400).json({ error: 'name and text are required' });
  }
  const impact = readJSON('impact.json');
  const item = {
    id: Date.now(),
    name: String(name).trim(),
    text: String(text).trim(),
    meta: meta ? String(meta).trim() : '',
    color: color || '#4a7c59'
  };
  impact.push(item);
  writeJSON('impact.json', impact);
  res.status(201).json(item);
});

// ─── Orders ───────────────────────────────────────────────────
app.get('/api/orders', adminRequired, (req, res) => {
  res.json(readJSON('orders.json'));
});

app.post('/api/orders', (req, res) => {
  const { productId, productName, quantity, customerName, customerEmail, customerPhone, notes } = req.body || {};
  if (!productId || !customerName || !customerEmail) {
    return res.status(400).json({ error: 'productId, customerName and customerEmail are required' });
  }
  const orders = readJSON('orders.json');
  const order = {
    id: uuidv4(),
    productId: Number(productId),
    productName: productName || '',
    quantity: quantity || 1,
    customerName: String(customerName).trim(),
    customerEmail: String(customerEmail).trim(),
    customerPhone: customerPhone ? String(customerPhone).trim() : '',
    notes: notes ? String(notes).trim() : '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  writeJSON('orders.json', orders);
  res.status(201).json({ success: true, order });
});

// ─── Proposal requests ────────────────────────────────────────
app.get('/api/proposals', adminRequired, (req, res) => {
  res.json(readJSON('proposals.json'));
});

app.post('/api/proposals', (req, res) => {
  const { name, email, org, purpose } = req.body || {};
  if (!name || !email || !purpose) {
    return res.status(400).json({ error: 'name, email and purpose are required' });
  }
  const proposals = readJSON('proposals.json');
  const item = {
    id: uuidv4(),
    name: String(name).trim(),
    email: String(email).trim(),
    org: org ? String(org).trim() : '',
    purpose: String(purpose).trim(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  proposals.push(item);
  writeJSON('proposals.json', proposals);
  // In production: send verification email with secure link to PDF
  res.status(201).json({
    success: true,
    message: 'Request received. A verification link will be sent to your email within 24 hours.'
  });
});

// ─── Contact form ─────────────────────────────────────────────
app.get('/api/contacts', adminRequired, (req, res) => {
  res.json(readJSON('contacts.json'));
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required' });
  }
  const contacts = readJSON('contacts.json');
  const item = {
    id: uuidv4(),
    name: String(name).trim(),
    email: String(email).trim(),
    subject: subject ? String(subject).trim() : 'General enquiry',
    message: String(message).trim(),
    createdAt: new Date().toISOString()
  };
  contacts.push(item);
  writeJSON('contacts.json', contacts);
  res.status(201).json({ success: true, message: 'Thank you. We will get back to you soon.' });
});

// ─── Member portal stub (protected resources) ─────────────────
app.get('/api/member/dashboard', authRequired, (req, res) => {
  res.json({
    welcome: `Welcome, ${req.user.name}`,
    role: req.user.role,
    resources: {
      meetingMinutes: [
        { id: 1, title: 'AGM 2025 Minutes', date: '2025-11-12' },
        { id: 2, title: 'Board Meeting – March 2026', date: '2026-03-08' }
      ],
      productionData: {
        soyaHarvestedKg: 185000,
        farmersActive: 850,
        oilProducedLitres: 42000
      },
      trainingMaterials: [
        { id: 1, title: 'Conservation Agriculture Guide', type: 'PDF' },
        { id: 2, title: 'Soya Intercropping Best Practices', type: 'PDF' }
      ]
    }
  });
});

// ─── Health ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Nthakayathu Cooperative API', time: new Date().toISOString() });
});

// ─── SPA fallback ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌱 Nthakayathu Cooperative server running at http://localhost:${PORT}`);
  console.log(`   API:  http://localhost:${PORT}/api/health`);
  console.log(`   Admin login:  username=admin  password=admin123`);
  console.log(`   Member login: username=member password=member123\n`);
});
