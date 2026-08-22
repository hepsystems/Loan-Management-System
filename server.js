/**
 * Nthakayathu Soya Cooperative – Backend Server
 * Express + MongoDB (Atlas) via Mongoose + JWT auth
 *
 * Setup:
 *   1. cp .env.example .env
 *   2. Fill in MONGODB_URI (MongoDB Atlas) and JWT_SECRET in .env
 *   3. npm install
 *   4. npm run migrate       (optional: imports old data/*.json content into MongoDB)
 *   5. npm run create-admin  (creates/updates your admin account from ADMIN_* vars in .env)
 *   6. npm start
 *
 * There are no baked-in demo accounts. The admin account is created from
 * environment variables the first time you run `npm run create-admin` — see
 * .env.example for ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME.
 * Everyone else registers themselves via the "Register" form (role: member).
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const News = require('./models/News');
const Impact = require('./models/Impact');
const Order = require('./models/Order');
const Proposal = require('./models/Proposal');
const Contact = require('./models/Contact');
const SiteSettings = require('./models/SiteSettings');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

if (!JWT_SECRET) {
  console.error('\n❌ JWT_SECRET is not set. Add it to your .env file (see .env.example).\n');
  process.exit(1);
}

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

// ─── Auth helpers ─────────────────────────────────────────────
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

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Auth ─────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    let { name, username, email, password, phone } = req.body || {};

    name = (name || '').trim();
    username = (username || '').trim().toLowerCase();
    email = (email || '').trim().toLowerCase();
    phone = (phone || '').trim();

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'name, username, email and password are required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      const field = existing.username === username ? 'Username' : 'Email';
      return res.status(409).json({ error: `${field} is already registered` });
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    const user = await User.create({
      name,
      username,
      email,
      phone,
      passwordHash,
      role: 'member' // public registration always creates a member, never an admin
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username or email is already registered' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ username: String(username).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

// ─── Members (admin only — never exposes passwordHash) ─────────
app.get('/api/members', adminRequired, async (req, res) => {
  // .select() is a second layer of defense on top of the User schema's
  // toJSON transform, which already strips passwordHash from every response.
  const members = await User.find()
    .select('name username email phone role createdAt')
    .sort({ createdAt: -1 });
  res.json(members);
});

// Admin can promote/demote a member, but can never edit their own role
// (prevents an admin from accidentally locking themselves out).
app.put('/api/members/:id/role', adminRequired, async (req, res) => {
  const { role } = req.body || {};
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: "role must be 'admin' or 'member'" });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }
  const member = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
    .select('name username email phone role createdAt');
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

// ─── Products ─────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  res.json(await Product.find().sort({ id: 1 }));
});

app.post('/api/products', adminRequired, async (req, res) => {
  const { name, description, price } = req.body || {};
  if (!name || !description || !price) {
    return res.status(400).json({ error: 'name, description and price are required' });
  }
  const item = await Product.create({
    id: Date.now(),
    name: String(name).trim(),
    description: String(description).trim(),
    price: String(price).trim()
  });
  res.status(201).json(item);
});

app.put('/api/products/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description, price } = req.body || {};
  const update = {};
  if (name !== undefined) update.name = String(name).trim();
  if (description !== undefined) update.description = String(description).trim();
  if (price !== undefined) update.price = String(price).trim();

  const product = await Product.findOneAndUpdate({ id }, update, { new: true });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.delete('/api/products/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = await Product.findOneAndDelete({ id });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true });
});

// ─── News ─────────────────────────────────────────────────────
app.get('/api/news', async (req, res) => {
  res.json(await News.find().sort({ id: -1 }));
});

app.post('/api/news', adminRequired, async (req, res) => {
  const { title, excerpt, date } = req.body || {};
  if (!title || !excerpt) {
    return res.status(400).json({ error: 'title and excerpt are required' });
  }
  const item = await News.create({
    id: Date.now(),
    title: String(title).trim(),
    excerpt: String(excerpt).trim(),
    date: date ? String(date).trim() : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  });
  res.status(201).json(item);
});

app.put('/api/news/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, excerpt, date } = req.body || {};
  const update = {};
  if (title !== undefined) update.title = String(title).trim();
  if (excerpt !== undefined) update.excerpt = String(excerpt).trim();
  if (date !== undefined) update.date = String(date).trim();

  const news = await News.findOneAndUpdate({ id }, update, { new: true });
  if (!news) return res.status(404).json({ error: 'News not found' });
  res.json(news);
});

app.delete('/api/news/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const news = await News.findOneAndDelete({ id });
  if (!news) return res.status(404).json({ error: 'News not found' });
  res.json({ success: true });
});

// ─── Impact stories ───────────────────────────────────────────
app.get('/api/impact', async (req, res) => {
  res.json(await Impact.find().sort({ id: 1 }));
});

app.post('/api/impact', adminRequired, async (req, res) => {
  const { name, text, meta, color } = req.body || {};
  if (!name || !text) {
    return res.status(400).json({ error: 'name and text are required' });
  }
  const item = await Impact.create({
    id: Date.now(),
    name: String(name).trim(),
    text: String(text).trim(),
    meta: meta ? String(meta).trim() : '',
    color: color || '#4a7c59'
  });
  res.status(201).json(item);
});

app.put('/api/impact/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, text, meta, color } = req.body || {};
  const update = {};
  if (name !== undefined) update.name = String(name).trim();
  if (text !== undefined) update.text = String(text).trim();
  if (meta !== undefined) update.meta = String(meta).trim();
  if (color !== undefined) update.color = String(color).trim();

  const story = await Impact.findOneAndUpdate({ id }, update, { new: true });
  if (!story) return res.status(404).json({ error: 'Impact story not found' });
  res.json(story);
});

app.delete('/api/impact/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const story = await Impact.findOneAndDelete({ id });
  if (!story) return res.status(404).json({ error: 'Impact story not found' });
  res.json({ success: true });
});

// ─── Site settings (hero stats, etc.) — edit instead of hardcode ─
app.get('/api/settings', async (req, res) => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    // First run: create the single settings doc from the site's original
    // hardcoded values, so the admin has something sensible to edit.
    settings = await SiteSettings.create({
      statMembers: '2,300+',
      statSoyaFarmers: '850+',
      statProcessing: '200t'
    });
  }
  res.json(settings);
});

app.put('/api/settings', adminRequired, async (req, res) => {
  const { statMembers, statSoyaFarmers, statProcessing } = req.body || {};
  const update = {};
  if (statMembers !== undefined) update.statMembers = String(statMembers).trim();
  if (statSoyaFarmers !== undefined) update.statSoyaFarmers = String(statSoyaFarmers).trim();
  if (statProcessing !== undefined) update.statProcessing = String(statProcessing).trim();

  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create(update);
  } else {
    Object.assign(settings, update);
    await settings.save();
  }
  res.json(settings);
});

// ─── Orders ───────────────────────────────────────────────────
app.get('/api/orders', adminRequired, async (req, res) => {
  res.json(await Order.find().sort({ createdAt: -1 }));
});

app.post('/api/orders', async (req, res) => {
  const { productId, productName, quantity, customerName, customerEmail, customerPhone, notes } = req.body || {};
  if (!productId || !customerName || !customerEmail) {
    return res.status(400).json({ error: 'productId, customerName and customerEmail are required' });
  }
  const order = await Order.create({
    id: uuidv4(),
    productId: Number(productId),
    productName: productName || '',
    quantity: quantity || 1,
    customerName: String(customerName).trim(),
    customerEmail: String(customerEmail).trim(),
    customerPhone: customerPhone ? String(customerPhone).trim() : '',
    notes: notes ? String(notes).trim() : '',
    status: 'pending'
  });
  res.status(201).json({ success: true, order });
});

// ─── Proposal requests ────────────────────────────────────────
app.get('/api/proposals', adminRequired, async (req, res) => {
  res.json(await Proposal.find().sort({ createdAt: -1 }));
});

app.post('/api/proposals', async (req, res) => {
  const { name, email, org, purpose } = req.body || {};
  if (!name || !email || !purpose) {
    return res.status(400).json({ error: 'name, email and purpose are required' });
  }
  await Proposal.create({
    id: uuidv4(),
    name: String(name).trim(),
    email: String(email).trim(),
    org: org ? String(org).trim() : '',
    purpose: String(purpose).trim(),
    status: 'pending'
  });
  // In production: send verification email with secure link to PDF
  res.status(201).json({
    success: true,
    message: 'Request received. A verification link will be sent to your email within 24 hours.'
  });
});

// ─── Contact form ─────────────────────────────────────────────
app.get('/api/contacts', adminRequired, async (req, res) => {
  res.json(await Contact.find().sort({ createdAt: -1 }));
});

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required' });
  }
  await Contact.create({
    id: uuidv4(),
    name: String(name).trim(),
    email: String(email).trim(),
    subject: subject ? String(subject).trim() : 'General enquiry',
    message: String(message).trim()
  });
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
  res.json({
    status: 'ok',
    service: 'Nthakayathu Cooperative API',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString()
  });
});

// ─── SPA fallback ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ─── Error handler (catches any unhandled async errors) ───────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🌱 Nthakayathu Cooperative server running at http://localhost:${PORT}`);
    console.log(`   API:  http://localhost:${PORT}/api/health`);
    console.log(`   Register a member: POST http://localhost:${PORT}/api/auth/register\n`);
  });
});
