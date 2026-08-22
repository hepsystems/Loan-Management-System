/**
 * Shared logic for creating/updating the admin account from ADMIN_* env vars.
 * Used by:
 *   - server.js on every startup (safe/idempotent — does nothing if the
 *     admin already exists), which matters on hosts like Render's free
 *     tier that have no shell/SSH access to run a one-off script.
 *   - scripts/createAdmin.js, a manual CLI wrapper for local use or hosts
 *     that do have shell access, with a --reset-password option.
 */
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdminFromEnv({ resetPassword = false } = {}) {
  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return { status: 'skipped', reason: 'ADMIN_USERNAME, ADMIN_EMAIL or ADMIN_PASSWORD not set' };
  }
  if (ADMIN_PASSWORD.length < 8) {
    return { status: 'skipped', reason: 'ADMIN_PASSWORD must be at least 8 characters' };
  }

  const username = ADMIN_USERNAME.trim().toLowerCase();
  const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

  const existing = await User.findOne({ username });

  if (existing) {
    let changed = false;
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      changed = true;
    }
    if (resetPassword) {
      existing.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);
      changed = true;
    }
    if (changed) await existing.save();
    return { status: changed ? 'updated' : 'unchanged', username };
  }

  await User.create({
    name: (ADMIN_NAME || 'Cooperative Admin').trim(),
    username,
    email: ADMIN_EMAIL.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, salt),
    role: 'admin'
  });
  return { status: 'created', username };
}

module.exports = seedAdminFromEnv;
