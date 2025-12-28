class VerificationService {
  /**
   * Verify location coordinates
   */
  async verifyLocation(coordinates, application) {
    // Implement location verification logic
    // This could check if location is within expected area
    // or compare with previous locations
    
    // For now, return a simulated verification
    return {
      verified: true,
      message: 'Location verified successfully',
      confidence: 0.95
    };
  }

  /**
   * Verify ID name matches mobile money name
   */
  async verifyIDMatch(idName, mobileMoneyName) {
    // Simple string comparison with some flexibility
    const normalizeName = (name) => {
      return name.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedIdName = normalizeName(idName);
    const normalizedMobileName = normalizeName(mobileMoneyName);

    // Calculate similarity score
    const similarity = this.calculateSimilarity(normalizedIdName, normalizedMobileName);
    
    return {
      match: similarity >= 0.8, // 80% similarity threshold
      score: similarity,
      message: similarity >= 0.8 
        ? 'Names match successfully' 
        : 'Name mismatch detected'
    };
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / parseFloat(longer.length);
  }

  levenshteinDistance(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    return track[str2.length][str1.length];
  }

  /**
   * Verify employment information
   */
  async verifyEmployment(employmentInfo) {
    const { employmentType, employmentNumber, businessRegistrationNumber } = employmentInfo;
    
    if (employmentType === 'civil_servant') {
      return await this.verifyCivilServant(employmentNumber);
    } else if (employmentType === 'business_owner') {
      return await this.verifyBusinessRegistration(businessRegistrationNumber);
    }
    
    return { verified: false, message: 'Invalid employment type' };
  }

  async verifyCivilServant(employmentNumber) {
    // Integrate with government civil servant database
    // For now, simulate verification
    return {
      verified: employmentNumber && employmentNumber.length > 5,
      message: employmentNumber && employmentNumber.length > 5 
        ? 'Civil servant verified' 
        : 'Invalid employment number'
    };
  }

  async verifyBusinessRegistration(registrationNumber) {
    // Integrate with business registration database
    // For now, simulate verification
    return {
      verified: registrationNumber && registrationNumber.length > 5,
      message: registrationNumber && registrationNumber.length > 5
        ? 'Business registration verified'
        : 'Invalid registration number'
    };
  }
}

module.exports = new VerificationService();
