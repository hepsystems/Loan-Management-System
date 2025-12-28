export const LOAN_PURPOSES = [
  'Business Capital',
  'Education',
  'Medical Expenses',
  'Home Improvement',
  'Agriculture',
  'Vehicle Purchase',
  'Personal Use',
  'Debt Consolidation',
  'Wedding',
  'Emergency'
];

export const LOAN_STATUSES = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under-review',
  VERIFIED: 'verified',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISBURSED: 'disbursed',
  DEFAULTED: 'defaulted',
  COMPLETED: 'completed'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  OFFICER: 'officer',
  CUSTOMER: 'customer',
  WITNESS: 'witness'
};

export const VERIFICATION_STEPS = [
  { id: 1, name: 'photo', label: 'Real-time Photo' },
  { id: 2, name: 'location', label: 'Location Verification' },
  { id: 3, name: 'witness', label: 'Witness Verification' },
  { id: 4, name: 'id', label: 'ID Verification' },
  { id: 5, name: 'mobile-money', label: 'Mobile Money Verification' }
];

export const MOBILE_MONEY_PROVIDERS = [
  { id: 'mpamba', name: 'MPamba', code: 'MP' },
  { id: 'tnm', name: 'TNM Mpamba', code: 'TM' },
  { id: 'airtel_money', name: 'Airtel Money', code: 'AM' }
];

export const INTEREST_RATES = {
  SHORT_TERM: 15, // 15% for 1-12 months
  MEDIUM_TERM: 12, // 12% for 13-24 months
  LONG_TERM: 10 // 10% for 25-60 months
};

export const LOAN_LIMITS = {
  MIN_AMOUNT: 1000,
  MAX_AMOUNT: 1000000,
  MIN_TERM: 1,
  MAX_TERM: 60
};

export const ID_TYPES = [
  'National ID',
  'Passport',
  'Driver License',
  'Voter ID'
];

export const COUNTRIES = [
  'Malawi',
  'Tanzania',
  'Zambia',
  'Zimbabwe',
  'Mozambique',
  'South Africa',
  'Kenya',
  'Uganda',
  'Rwanda'
];

export const MARITAL_STATUSES = [
  'Single',
  'Married',
  'Divorced',
  'Widowed'
];

export const EMPLOYMENT_TYPES = [
  'Employed',
  'Self-Employed',
  'Unemployed',
  'Student',
  'Retired'
];

export const INDUSTRY_TYPES = [
  'Agriculture',
  'Manufacturing',
  'Retail',
  'Services',
  'Technology',
  'Healthcare',
  'Education',
  'Construction',
  'Transportation',
  'Other'
];

export const NOTIFICATION_TYPES = {
  LOAN_APPROVED: 'loan_approved',
  LOAN_REJECTED: 'loan_rejected',
  VERIFICATION_COMPLETED: 'verification_completed',
  PAYMENT_DUE: 'payment_due',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM_ALERT: 'system_alert'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token'
  },
  LOANS: {
    BASE: '/loans',
    APPLY: '/loans/apply',
    MY_LOANS: '/loans/my-loans',
    VERIFY: '/loans/verify',
    APPROVE: '/loans/approve',
    REJECT: '/loans/reject',
    DISBURSE: '/loans/disburse'
  },
  VERIFICATIONS: {
    BASE: '/verifications',
    START: '/verifications/start',
    STATUS: '/verifications/status'
  },
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    SETTINGS: '/admin/settings',
    ANALYTICS: '/admin/analytics'
  },
  UPLOAD: '/upload'
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recent_searches'
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_APPLICATION: 'join-application',
  LEAVE_APPLICATION: 'leave-application',
  VERIFICATION_STATUS: 'verification-status',
  APPLICATION_UPDATED: 'application-updated',
  LOAN_APPROVED: 'loan-approved',
  LOAN_REJECTED: 'loan-rejected',
  NOTIFICATION: 'notification'
};
