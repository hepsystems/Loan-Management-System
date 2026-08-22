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
const connectDB = require('../config/db');
const seedAdminFromEnv = require('./seedAdmin');

async function run() {
  const resetPassword = process.argv.includes('--reset-password');

  await connectDB();
  const result = await seedAdminFromEnv({ resetPassword });

  switch (result.status) {
    case 'skipped':
      console.error(`\n❌ ${result.reason}. Set these in your .env first:\n   ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD (min 8 chars), ADMIN_NAME (optional)\n`);
      process.exit(1);
      break;
    case 'created':
      console.log(`✅ Admin account "${result.username}" created.`);
      break;
    case 'updated':
      console.log(`🔐 Admin account "${result.username}" updated (role and/or password).`);
      break;
    case 'unchanged':
      console.log(`ℹ️  Admin "${result.username}" already exists — left password unchanged.`);
      console.log('   Re-run with --reset-password to change it.');
      break;
  }

  console.log('\nDone. You can now remove ADMIN_PASSWORD from your .env if you like.\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ create-admin failed:', err.message);
  process.exit(1);
});
