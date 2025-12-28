export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone) => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
  },

  nationalId: (id) => {
    // Malawi National ID format: Usually 7-9 digits
    const idRegex = /^\d{7,9}$/;
    return idRegex.test(id);
  },

  password: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: {
        length: password.length >= minLength ? null : `Must be at least ${minLength} characters`,
        uppercase: hasUpperCase ? null : 'Must contain uppercase letter',
        lowercase: hasLowerCase ? null : 'Must contain lowercase letter',
        number: hasNumbers ? null : 'Must contain number',
        specialChar: hasSpecialChar ? null : 'Must contain special character',
      }
    };
  },

  loanAmount: (amount, min = 1000, max = 1000000) => {
    return amount >= min && amount <= max;
  },

  loanTerm: (term, min = 1, max = 60) => {
    return term >= min && term <= max;
  },

  dateOfBirth: (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  },

  coordinates: (lat, lng) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  fileSize: (file, maxSizeMB = 5) => {
    return file.size <= maxSizeMB * 1024 * 1024;
  },

  fileType: (file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']) => {
    return allowedTypes.includes(file.type);
  }
};

export const formatErrors = (validationResult) => {
  if (validationResult.isValid) return null;
  
  const errors = Object.values(validationResult.errors).filter(error => error !== null);
  return errors.join(', ');
};

export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const rule = rules[field];
    
    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = 'This field is required';
      return;
    }
    
    if (value && rule.type) {
      switch (rule.type) {
        case 'email':
          if (!validators.email(value)) errors[field] = 'Invalid email format';
          break;
        case 'phone':
          if (!validators.phone(value)) errors[field] = 'Invalid phone number';
          break;
        case 'nationalId':
          if (!validators.nationalId(value)) errors[field] = 'Invalid National ID format';
          break;
        case 'password':
          const passwordValidation = validators.password(value);
          if (!passwordValidation.isValid) {
            errors[field] = formatErrors(passwordValidation);
          }
          break;
        case 'number':
          if (isNaN(value)) errors[field] = 'Must be a number';
          else if (rule.min && value < rule.min) errors[field] = `Minimum value is ${rule.min}`;
          else if (rule.max && value > rule.max) errors[field] = `Maximum value is ${rule.max}`;
          break;
        case 'date':
          if (rule.minAge && !validators.dateOfBirth(value)) errors[field] = 'Must be at least 18 years old';
          break;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
