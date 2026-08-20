/**
 * One-time migration: imports data/*.json (the old file-based store) into MongoDB Atlas.
 *
 * Usage:
 *   1. Set MONGODB_URI in your .env
 *   2. npm run migrate
 *
 * Safe to re-run: existing documents (matched by their `id`/`username`) are skipped,
 * not duplicated.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');

const User = require('../models/User');
const Product = require('../models/Product');
const News = require('../models/News');
const Impact = require('../models/Impact');
const Order = require('../models/Order');
const Proposal = require('../models/Proposal');
const Contact = require('../models/Contact');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJSON(filename) {
  const file = path.join(DATA_DIR, filename);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  } catch (e) {
    console.warn(`Could not parse ${filename}:`, e.message);
    return [];
  }
}

async function migrateUsers() {
  const users = readJSON('users.json');
  let created = 0;
  for (const u of users) {
    const exists = await User.findOne({ username: u.username.toLowerCase() });
    if (exists) continue;
    // The old file already stores a bcrypt hash, so we carry it over as-is
    // rather than re-hashing (which would break the known demo passwords).
    await User.create({
      username: u.username.toLowerCase(),
      email: u.email || `${u.username.toLowerCase()}@nthakayathu.local`,
      passwordHash: u.passwordHash,
      role: u.role || 'member',
      name: u.name || u.username
    });
    created++;
  }
  console.log(`👤 Users: ${created} created, ${users.length - created} skipped (already existed)`);
}

async function migrateSimple(Model, filename, label) {
  const items = readJSON(filename);
  let created = 0;
  for (const item of items) {
    const exists = await Model.findOne({ id: item.id });
    if (exists) continue;
    await Model.create(item);
    created++;
  }
  console.log(`📦 ${label}: ${created} created, ${items.length - created} skipped (already existed)`);
}

async function run() {
  await connectDB();

  await migrateUsers();
  await migrateSimple(Product, 'products.json', 'Products');
  await migrateSimple(News, 'news.json', 'News');
  await migrateSimple(Impact, 'impact.json', 'Impact stories');
  await migrateSimple(Order, 'orders.json', 'Orders');
  await migrateSimple(Proposal, 'proposals.json', 'Proposals');
  await migrateSimple(Contact, 'contacts.json', 'Contacts');

  console.log('\n✅ Migration complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
