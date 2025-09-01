const validateSchoolData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('School name must be at least 2 characters long');
  }
  
  if (!data.address || data.address.trim().length < 10) {
    errors.push('Address must be at least 10 characters long');
  }
  
  if (!data.city || data.city.trim().length < 2) {
    errors.push('City must be at least 2 characters long');
  }
  
  if (!data.state || data.state.trim().length < 2) {
    errors.push('State must be at least 2 characters long');
  }
  
  const contactRegex = /^[6-9]\d{9}$/;
  if (!data.contact || !contactRegex.test(data.contact)) {
    errors.push('Please enter a valid 10-digit Indian mobile number starting with 6-9');
  }
  
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!data.email_id || !emailRegex.test(data.email_id)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

module.exports = {
  validateSchoolData
};