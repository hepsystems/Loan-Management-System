const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: String,
    unique: true,
    required: true
  },
  personalInfo: {
    fullName: { type: String, required: true },
    idNumber: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    maritalStatus: { type: String }
  },
  contactInfo: {
    phoneNumber: { type: String, required: true },
    email: { type: String },
    address: {
      street: String,
      city: String,
      country: String
    }
  },
  employmentInfo: {
    employmentType: {
      type: String,
      enum: ['civil_servant', 'business_owner', 'private_sector', 'other'],
      required: true
    },
    employmentNumber: { type: String }, // For civil servants
    businessRegistrationNumber: { type: String }, // For business owners
    employerName: String,
    position: String,
    monthlyIncome: Number,
    yearsOfService: Number
  },
  loanDetails: {
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    repaymentPeriod: { type: Number, required: true }, // in months
    interestRate: { type: Number, default: 12 } // Annual percentage
  },
  verificationData: {
    realtimePhoto: {
      image: String, // Base64 encoded
      timestamp: Date,
      location: {
        latitude: Number,
        longitude: Number,
        accuracy: Number
      }
    },
    locationVerification: {
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      timestamp: Date,
      verified: { type: Boolean, default: false }
    },
    witnessVerification: {
      witnessName: String,
      witnessIdNumber: String,
      witnessSignature: String, // Base64 encoded signature
      witnessPhoto: String, // Base64 encoded
      verificationTimestamp: Date,
      verified: { type: Boolean, default: false }
    },
    idVerification: {
      idFrontImage: String,
      idBackImage: String,
      verificationMethod: String, // 'manual' or 'automated'
      verified: { type: Boolean, default: false },
      matchScore: Number // For automated verification
    },
    nameMatchVerification: {
      idName: String,
      mobileMoneyName: String,
      match: { type: Boolean, default: false },
      verified: { type: Boolean, default: false }
    }
  },
  mobileMoneyDetails: {
    provider: {
      type: String,
      enum: ['mpamba', 'tnm', 'airtel_money', null],
      default: null
    },
    phoneNumber: String,
    accountName: String,
    verified: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'verification_in_progress', 
           'approved', 'rejected', 'disbursed', 'completed', 'defaulted'],
    default: 'draft'
  },
  statusHistory: [{
    status: String,
    changedBy: String,
    timestamp: { type: Date, default: Date.now },
    notes: String
  }],
  documents: [{
    type: { type: String },
    url: String,
    uploadedAt: Date,
    verified: Boolean
  }],
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: [{
    officer: String,
    note: String,
    timestamp: Date
  }],
  disbursement: {
    amount: Number,
    transactionId: String,
    provider: String,
    phoneNumber: String,
    disbursedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', null],
      default: null
    }
  },
  repaymentSchedule: [{
    dueDate: Date,
    amount: Number,
    principal: Number,
    interest: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'defaulted']
    },
    paidAt: Date,
    transactionId: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate application ID before saving
loanApplicationSchema.pre('save', function(next) {
  if (!this.applicationId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.applicationId = `LMS${timestamp}${random}`;
  }
  next();
});

// Update status history when status changes
loanApplicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: 'system',
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`
    });
  }
  next();
});

const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);
module.exports = LoanApplication;
