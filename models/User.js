const mongoose = require('mongoose');

const COMMITTEES = [
  'none',                // not yet assigned to a sub-committee
  'finance',             // Finance, Accounts & Resource Mobilization
  'marketing',           // Marketing & Sales
  'production',          // Production & Technical
  'membership_welfare'   // Membership, Welfare & Discipline
];

// Cooperative leadership positions — these are org-wide (ex-officio across
// every sub-committee), NOT a sub-committee assignment, and NOT the same
// thing as the website `role` (admin/member) below. The site admin login is
// purely a technical/website-management account; it is never treated as a
// cooperative membership record. Someone who is both the site admin AND an
// actual cooperative office-holder must register separately as a member to
// appear on the roster.
const POSITIONS = ['chair', 'secretary', 'treasurer', 'member'];

// Only one active member may hold each top office at a time (enforced in
// server.js). This rank/order is used to sort the leadership to the top of
// every members listing and the downloadable roster.
const POSITION_RANK = { chair: 0, secretary: 1, treasurer: 2, member: 10 };
const POSITION_LABELS = { chair: 'Chairperson', secretary: 'Secretary', treasurer: 'Treasurer', member: 'Member' };

// Fixed display order for grouping regular members by sub-committee.
const COMMITTEE_RANK = { finance: 0, marketing: 1, production: 2, membership_welfare: 3, none: 4 };
const COMMITTEE_LABELS = {
  none: 'Not Yet Assigned',
  finance: 'Finance, Accounts & Resource Mobilization',
  marketing: 'Marketing & Sales',
  production: 'Production & Technical',
  membership_welfare: 'Membership, Welfare & Discipline'
};

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  committee: { type: String, enum: COMMITTEES, default: 'none' },
  position: { type: String, enum: POSITIONS, default: 'member' },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  // Password reset (forgot password) — token itself is never stored, only its hash
  resetPasswordTokenHash: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash; // never expose the hash to the client
    delete ret.resetPasswordTokenHash;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

// Sort key for ranking cooperative members: leadership first (chair, then
// secretary, then treasurer), then regular members grouped by committee in
// a fixed order, then alphabetically by name within each group.
userSchema.statics.rankMembers = function rankMembers(users) {
  return [...users].sort((a, b) => {
    const posA = POSITION_RANK[a.position] ?? 10;
    const posB = POSITION_RANK[b.position] ?? 10;
    if (posA !== posB) return posA - posB;
    const comA = COMMITTEE_RANK[a.committee] ?? 5;
    const comB = COMMITTEE_RANK[b.committee] ?? 5;
    if (comA !== comB) return comA - comB;
    return String(a.name).localeCompare(String(b.name));
  });
};

userSchema.statics.COMMITTEES = COMMITTEES;
userSchema.statics.POSITIONS = POSITIONS;
userSchema.statics.POSITION_LABELS = POSITION_LABELS;
userSchema.statics.COMMITTEE_LABELS = COMMITTEE_LABELS;

module.exports = mongoose.model('User', userSchema);
