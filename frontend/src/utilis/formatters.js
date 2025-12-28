export const formatters = {
  currency: (amount, currency = 'MWK', locale = 'en-MW') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  date: (dateString, format = 'medium') => {
    const date = new Date(dateString);
    
    const formats = {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      medium: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      },
      timeOnly: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      },
      relative: (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return formatters.date(dateString, 'short');
      }
    };

    if (format === 'relative') {
      return formats.relative(date);
    }

    return date.toLocaleDateString('en-US', formats[format] || formats.medium);
  },

  percentage: (value, decimals = 2) => {
    return `${parseFloat(value).toFixed(decimals)}%`;
  },

  phoneNumber: (phone) => {
    if (!phone) return '';
    
    // Format Malawi phone numbers
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('265')) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    } else if (cleaned.startsWith('0')) {
      return `+265 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    return phone;
  },

  truncateText: (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  capitalize: (text) => {
    return text.replace(/\b\w/g, char => char.toUpperCase());
  },

  bytesToSize: (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  },

  formatLoanId: (id) => {
    return `LOAN-${id.slice(-8).toUpperCase()}`;
  },

  formatApplicationId: (id) => {
    return `APP-${id.slice(-8).toUpperCase()}`;
  },

  maskSensitiveData: (data, type) => {
    switch (type) {
      case 'email':
        const [username, domain] = data.split('@');
        return `${username.slice(0, 3)}***@${domain}`;
      case 'phone':
        return data.slice(0, -4).replace(/\d/g, '*') + data.slice(-4);
      case 'nationalId':
        return '***' + data.slice(-4);
      case 'account':
        return '****' + data.slice(-4);
      default:
        return data;
    }
  }
};
