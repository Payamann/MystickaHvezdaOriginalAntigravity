/**
 * Input Validation Utilities
 * Validates user input before database operations to prevent SQL injection and XSS attacks
 */

export function validateBirthDate(date) {
  if (!date) {
    throw new Error('Birth date is required');
  }

  const parsed = new Date(date);

  // Must be valid date
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date format');
  }

  // Must be in past
  if (parsed > new Date()) {
    throw new Error('Birth date cannot be in the future');
  }

  // Must be reasonable (not before 1900)
  if (parsed.getFullYear() < 1900) {
    throw new Error('Birth date must be after 1900');
  }

  return parsed.toISOString().split('T')[0];
}

export function validateName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Name is required');
  }

  if (name.length > 100) {
    throw new Error('Name too long (max 100 characters)');
  }

  // Remove suspicious HTML/script characters
  const sanitized = name.replace(/[<>{}[\]]/g, '').trim();

  if (sanitized.length === 0) {
    throw new Error('Name contains only invalid characters');
  }

  return sanitized;
}

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }

  if (!regex.test(email)) {
    throw new Error('Invalid email format');
  }

  if (email.length > 254) {
    throw new Error('Email too long');
  }

  return email.toLowerCase().trim();
}

export function validateZodiacSign(sign) {
  const validSigns = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
  ];

  if (!sign || typeof sign !== 'string') {
    throw new Error('Zodiac sign is required');
  }

  const normalized = sign.toLowerCase().trim();

  if (!validSigns.includes(normalized)) {
    throw new Error(`Invalid zodiac sign. Valid signs: ${validSigns.join(', ')}`);
  }

  return normalized;
}

export function validateBirthTime(time) {
  if (!time || typeof time !== 'string') {
    throw new Error('Birth time required');
  }

  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (!regex.test(time)) {
    throw new Error('Invalid time format (use HH:MM)');
  }

  return time;
}

export function validateCity(city) {
  if (!city || typeof city !== 'string') {
    throw new Error('City is required');
  }

  if (city.length > 100) {
    throw new Error('City name too long');
  }

  return city.replace(/[<>{}[\]]/g, '').trim();
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    throw new Error('Password too long (max 128 characters)');
  }

  // Check for complexity
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const complexityScore = [hasUppercase, hasLowercase, hasNumber, hasSpecialChar]
    .filter(Boolean).length;

  if (complexityScore < 3) {
    throw new Error(
      'Password must contain: uppercase, lowercase, numbers, and special characters'
    );
  }

  return password;
}

export function validateString(value, fieldName, minLength = 1, maxLength = 1000) {
  if (!value || typeof value !== 'string') {
    throw new Error(`${fieldName} is required`);
  }

  if (value.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }

  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`);
  }

  return value.trim();
}

export function validateNumber(value, fieldName, min = null, max = null) {
  const num = Number(value);

  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  if (min !== null && num < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }

  if (max !== null && num > max) {
    throw new Error(`${fieldName} must be at most ${max}`);
  }

  return num;
}

export function validatePeriod(period) {
  const validPeriods = ['daily', 'weekly', 'monthly'];

  if (!period || typeof period !== 'string') {
    throw new Error('Period is required');
  }

  const normalized = period.toLowerCase().trim();

  if (!validPeriods.includes(normalized)) {
    throw new Error(`Invalid period. Valid periods: ${validPeriods.join(', ')}`);
  }

  return normalized;
}

export function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }

  // UUID v4 format check
  if (!/^[a-f0-9\-]{36}$/.test(userId)) {
    throw new Error('Invalid user ID format');
  }

  return userId;
}

export function escapeSQL(value) {
  // This is a basic escape function for use with parameterized queries
  // When possible, use parameterized queries instead
  if (typeof value === 'string') {
    return value.replace(/'/g, "''");
  }
  return value;
}
