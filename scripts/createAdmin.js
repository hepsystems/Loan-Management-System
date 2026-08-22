/**
 * Creates (or updates the password of) the cooperative's admin account
 * from environment variables. This replaces the old approach of committing
 * a pre-hashed "admin/admin123" account to the repo.
 *
 * Usage:
 *   1. Add to your .env:
 *        ADMIN_USERNAME=someadmin
 *        ADMIN_EMAIL=admin@yourdomain.com
 *        ADMIN_PASSWORD=a-strong-unique-password
 *        ADMIN_NAME=Cooperative Admin
 *   2. npm run create-admin
 *   3. Log in on the site with ADMIN_USERNAME / ADMIN_PASSWORD, then remove
 *      ADMIN_PASSWORD from .env (it's no longer needed once the account exists).
 *
 * Safe to re-run: if the account already exists, pass --reset-password to
 * update its password; otherwise the script leaves the existing account alone.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  const resetPassword = process.argv.includes('--reset-password');

  if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('\n❌ Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD in your .env first.\n');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error('\n❌ ADMIN_PASSWORD should be at least 8 characters.\n');
    process.exit(1);
  }

  await connectDB();

  const username = ADMIN_USERNAME.trim().toLowerCase();
  const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

  const existing = await User.findOne({ username });

  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
    }
    if (resetPassword) {
      existing.passwordHash = passwordHash;
      console.log(`🔐 Password reset for existing admin "${username}".`);
    } else {
      console.log(`ℹ️  Admin "${username}" already exists — left password unchanged.`);
      console.log('   Re-run with --reset-password to change it.');
    }
    await existing.save();
  } else {
    await User.create({
      name: (ADMIN_NAME || 'Cooperative Admin').trim(),
      username,
      email: ADMIN_EMAIL.trim().toLowerCase(),
      passwordHash,
      role: 'admin'
    });
    console.log(`✅ Admin account "${username}" created.`);
  }

  console.log('\nDone. You can now remove ADMIN_PASSWORD from your .env if you like.\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ create-admin failed:', err.message);
  process.exit(1);
});
