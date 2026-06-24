import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Validator helpers extracted from server.js registration logic.
 * These mirror the exact validation rules used in the signup route.
 */
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

function validateEmail(email) {
  if (!email) return { valid: false, error: 'Email is required' };
  if (!EMAIL_REGEX.test(email)) return { valid: false, error: 'Please provide a valid email address' };
  return { valid: true };
}

function validatePassword(password) {
  if (!password) return { valid: false, error: 'Password is required' };
  if (typeof password === 'string' && password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  if (typeof password === 'string' && password.length > 128) return { valid: false, error: 'Password must not exceed 128 characters' };
  return { valid: true };
}

function validateName(name) {
  if (!name || (typeof name === 'string' && name.trim().length === 0)) return { valid: false, error: 'Name is required' };
  if (typeof name === 'string' && name.trim().length > 50) return { valid: false, error: 'Name must be between 1 and 50 characters' };
  return { valid: true };
}

function validateRegistration(name, email, password) {
  const errors = [];
  const nameResult = validateName(name);
  if (!nameResult.valid) errors.push(nameResult.error);
  const emailResult = validateEmail(email);
  if (!emailResult.valid) errors.push(emailResult.error);
  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) errors.push(passwordResult.error);
  return { valid: errors.length === 0, errors };
}

describe('Feature: food-ordering-platform, Property 3: Invalid registration input rejection', () => {
  /**
   * Validates: Requirements 1.4
   *
   * For any email string that does not match the pattern
   * ^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$,
   * or for any password shorter than 6 characters or longer than 128 characters,
   * the registration request should be rejected with a validation error.
   */

  it('should reject emails without @ symbol', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@')),
        (invalidEmail) => {
          const result = validateEmail(invalidEmail);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please provide a valid email address');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject emails with spaces', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).map(s => {
          // Insert a space at a random position to ensure it has a space
          const pos = Math.floor(s.length / 2);
          return s.slice(0, pos) + ' ' + s.slice(pos);
        }),
        (emailWithSpace) => {
          const result = validateEmail(emailWithSpace);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject emails with invalid TLDs (single char or 4+ char TLDs)', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.stringMatching(/^\w+$/,{ minLength: 1, maxLength: 10 }),
          fc.stringMatching(/^\w+$/,{ minLength: 1, maxLength: 10 }),
          // Generate TLDs with length 1 or 4+ (invalid per regex which requires 2-3)
          fc.oneof(
            fc.stringMatching(/^[a-z]$/, { minLength: 1, maxLength: 1 }),
            fc.stringMatching(/^[a-z]{4,8}$/, { minLength: 4, maxLength: 8 })
          )
        ),
        ([localPart, domain, tld]) => {
          const invalidEmail = `${localPart}@${domain}.${tld}`;
          const result = validateEmail(invalidEmail);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject passwords shorter than 6 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 5 }),
        (shortPassword) => {
          const result = validatePassword(shortPassword);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Password must be at least 6 characters');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject passwords longer than 128 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 129, maxLength: 256 }),
        (longPassword) => {
          const result = validatePassword(longPassword);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Password must not exceed 128 characters');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject registration when email is invalid (does not match regex)', () => {
    fc.assert(
      fc.property(
        // Valid name
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Invalid email - arbitrary strings that don't match email regex
        fc.string({ minLength: 1, maxLength: 60 }).filter(s => !EMAIL_REGEX.test(s)),
        // Valid password
        fc.string({ minLength: 6, maxLength: 128 }),
        (name, invalidEmail, password) => {
          const result = validateRegistration(name, invalidEmail, password);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject registration when password is outside valid range', () => {
    fc.assert(
      fc.property(
        // Valid name
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Valid email
        fc.constant('testuser@example.com'),
        // Invalid password - either too short or too long
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 5 }),
          fc.string({ minLength: 129, maxLength: 256 })
        ),
        (name, email, invalidPassword) => {
          const result = validateRegistration(name, email, invalidPassword);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// --- Property 2: Duplicate email rejection ---

/**
 * Property 2: Duplicate email rejection
 *
 * For any valid registration data, if a user is registered with a given email,
 * a subsequent registration attempt with the same email should be rejected with
 * an error, regardless of other field values.
 *
 * Validates: Requirements 1.2
 *
 * This test uses a pure logic approach: a simple in-memory user store (Map)
 * simulates the registration behavior from server.js without needing a real database.
 */

function registerUser(store, name, email, password) {
  // Validate input using the same logic as server.js
  const { valid, errors } = validateRegistration(name, email, password);
  if (!valid) {
    return { success: false, error: errors.join(', '), errors };
  }

  // Check for duplicate email (mirrors: User.findOne({ email }))
  if (store.has(email)) {
    return { success: false, error: 'User already exists with this email' };
  }

  // Register the user
  store.set(email, { name, email, password });
  return { success: true, user: { name, email } };
}

// Generators for valid registration data
const validNameArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(n => n.trim().length > 0 && n.trim().length <= 50);

const validEmailArb = fc.tuple(
  fc.stringMatching(/^\w+$/, { minLength: 1, maxLength: 8 }),
  fc.stringMatching(/^\w+$/, { minLength: 1, maxLength: 8 }),
  fc.constantFrom('com', 'org', 'net', 'io', 'pk')
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`)
  .filter(email => EMAIL_REGEX.test(email));

const validPasswordArb = fc.string({ minLength: 6, maxLength: 30 });

describe('Feature: food-ordering-platform, Property 2: Duplicate email rejection', () => {
  /**
   * **Validates: Requirements 1.2**
   */

  it('should reject a second registration with the same email regardless of other field values', () => {
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        validPasswordArb,
        validNameArb,
        validPasswordArb,
        (name1, email, password1, name2, password2) => {
          const store = new Map();

          // First registration should succeed
          const firstResult = registerUser(store, name1, email, password1);
          expect(firstResult.success).toBe(true);

          // Second registration with the SAME email (but potentially different name/password)
          // should always be rejected
          const secondResult = registerUser(store, name2, email, password2);
          expect(secondResult.success).toBe(false);
          expect(secondResult.error).toBe('User already exists with this email');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept both registrations individually as valid data', () => {
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        validPasswordArb,
        validNameArb,
        validPasswordArb,
        (name1, email, password1, name2, password2) => {
          // Verify both sets of registration data are independently valid
          const result1 = validateRegistration(name1, email, password1);
          const result2 = validateRegistration(name2, email, password2);

          expect(result1.valid).toBe(true);
          expect(result2.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject duplicate email even when registering with identical data', () => {
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        validPasswordArb,
        (name, email, password) => {
          const store = new Map();

          // Register the user once
          const firstResult = registerUser(store, name, email, password);
          expect(firstResult.success).toBe(true);

          // Try to register again with the exact same data
          const duplicateResult = registerUser(store, name, email, password);
          expect(duplicateResult.success).toBe(false);
          expect(duplicateResult.error).toBe('User already exists with this email');
        }
      ),
      { numRuns: 100 }
    );
  });
});


// --- Property 4: Invalid credentials rejection ---

/**
 * Property 4: Invalid credentials rejection
 *
 * For any email/password combination where the email is not registered or the
 * password does not match the stored value, the login response should be a
 * rejection with the message "Invalid email or password" without revealing
 * which field was incorrect.
 *
 * Validates: Requirements 2.2
 *
 * This test uses a pure logic approach: a simple in-memory user store (Map)
 * simulates the login behavior from server.js without needing a real database.
 */

function loginUser(store, email, password) {
  // Mirrors the login logic in server.js:
  // User.findOne({ email, password }) — checks both email AND password match
  if (!email) {
    return { success: false, error: 'Email is required', status: 400 };
  }
  if (!password) {
    return { success: false, error: 'Password is required', status: 400 };
  }

  // Look up user by email
  const user = store.get(email);

  // If email not found OR password doesn't match, return generic error
  if (!user || user.password !== password) {
    return { success: false, error: 'Invalid email or password', status: 401 };
  }

  // Successful login
  return {
    success: true,
    user: { name: user.name, email: user.email, isAdmin: user.isAdmin || false },
    status: 200
  };
}

describe('Feature: food-ordering-platform, Property 4: Invalid credentials rejection', () => {
  /**
   * **Validates: Requirements 2.2**
   */

  it('should reject login with wrong password (same email, different password) with generic error', () => {
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        validPasswordArb,
        // Generate a different password that doesn't match the original
        validPasswordArb,
        (name, email, correctPassword, wrongPassword) => {
          // Ensure the wrong password is actually different
          fc.pre(wrongPassword !== correctPassword);

          const store = new Map();
          // Register the user
          const regResult = registerUser(store, name, email, correctPassword);
          expect(regResult.success).toBe(true);

          // Attempt login with wrong password
          const loginResult = loginUser(store, email, wrongPassword);
          expect(loginResult.success).toBe(false);
          expect(loginResult.status).toBe(401);
          expect(loginResult.error).toBe('Invalid email or password');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject login with unregistered email (any password) with generic error', () => {
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        validPasswordArb,
        // Generate a different email for the login attempt
        validEmailArb,
        validPasswordArb,
        (name, registeredEmail, registeredPassword, unregisteredEmail, anyPassword) => {
          // Ensure the unregistered email is different from the registered one
          fc.pre(unregisteredEmail !== registeredEmail);

          const store = new Map();
          // Register a user with one email
          const regResult = registerUser(store, name, registeredEmail, registeredPassword);
          expect(regResult.success).toBe(true);

          // Attempt login with a different (unregistered) email
          const loginResult = loginUser(store, unregisteredEmail, anyPassword);
          expect(loginResult.success).toBe(false);
          expect(loginResult.status).toBe(401);
          expect(loginResult.error).toBe('Invalid email or password');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return the same error message regardless of whether email or password was wrong (no information leakage)', () => {
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        validPasswordArb,
        validEmailArb,
        validPasswordArb,
        (name, registeredEmail, correctPassword, unregisteredEmail, wrongPassword) => {
          // Ensure we have distinct scenarios
          fc.pre(unregisteredEmail !== registeredEmail);
          fc.pre(wrongPassword !== correctPassword);

          const store = new Map();
          // Register a user
          const regResult = registerUser(store, name, registeredEmail, correctPassword);
          expect(regResult.success).toBe(true);

          // Scenario 1: Wrong password (correct email)
          const wrongPasswordResult = loginUser(store, registeredEmail, wrongPassword);

          // Scenario 2: Wrong email (unregistered email)
          const wrongEmailResult = loginUser(store, unregisteredEmail, correctPassword);

          // Both should fail with the exact same error message — no information leakage
          expect(wrongPasswordResult.success).toBe(false);
          expect(wrongEmailResult.success).toBe(false);
          expect(wrongPasswordResult.error).toBe(wrongEmailResult.error);
          expect(wrongPasswordResult.error).toBe('Invalid email or password');
          expect(wrongPasswordResult.status).toBe(wrongEmailResult.status);
        }
      ),
      { numRuns: 100 }
    );
  });
});
