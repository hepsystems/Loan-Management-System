const mongoose = require('mongoose');

// Singleton document — there should only ever be one SiteSettings row.
// Holds small bits of homepage copy that used to be hardcoded in index.html
// (the hero stats), so an admin can update them from the site itself.
const siteSettingsSchema = new mongoose.Schema({
  statMembers: { type: String, trim: true, default: '2,300+' },
  statSoyaFarmers: { type: String, trim: true, default: '850+' },
  statProcessing: { type: String, trim: true, default: '200t' }
}, { timestamps: true });

siteSettingsSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
