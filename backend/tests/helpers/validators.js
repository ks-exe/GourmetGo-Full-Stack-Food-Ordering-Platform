/**
 * Extracted validation logic from server.js for unit/property testing.
 * These mirror the exact checks performed in the signup route.
 */

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Validate registration input data.
 * @param {{ name: any, email: any, password: any }} data
 * @returns {{ valid: boolean, errors?: string[] }}
 */
export function validateRegistration({ name, email, password }) {
  const errors = [];

  // Name validation
  if (!name || (typeof name === 'string' && name.trim().length === 0)) {
    errors.push('Name is required');
  } else if (typeof name === 'string' && name.trim().length > 50) {
    errors.push('Name must be between 1 and 50 characters');
  }

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else {
    if (!EMAIL_REGEX.test(email)) {
      errors.push('Please provide a valid email address');
    }
  }

  // Password validation
  if (!password) {
    errors.push('Password is required');
  } else if (typeof password === 'string' && password.length < 6) {
    errors.push('Password must be at least 6 characters');
  } else if (typeof password === 'string' && password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Determine isAdmin status based on email.
 * Mirrors the server logic.
 */
export function determineIsAdmin(email) {
  return email === 'gullylaila509@gmail.com';
}

/**
 * Build a registration response profile (mirrors server response shape).
 * @param {{ name: string, email: string, isAdmin: boolean }} user
 * @returns {{ name: string, email: string, isAdmin: boolean }}
 */
export function buildRegistrationProfile({ name, email, isAdmin }) {
  return { name, email, isAdmin };
}
