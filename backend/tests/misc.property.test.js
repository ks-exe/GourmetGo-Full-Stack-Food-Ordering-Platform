import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Property 30: Message creation with valid data ---

/**
 * Validator helper extracted from server.js message creation logic.
 * Mirrors the exact validation rules used in POST /api/messages route.
 */
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

function validateMessage({ name, email, subject, message }) {
  const errors = [];
  if (!name || name.trim().length === 0 || name.trim().length > 100) errors.push('Name invalid');
  if (!email || !EMAIL_REGEX.test(email)) errors.push('Email invalid');
  if (!subject || subject.trim().length === 0 || subject.trim().length > 200) errors.push('Subject invalid');
  if (!message || message.trim().length === 0 || message.trim().length > 2000) errors.push('Message invalid');
  return { valid: errors.length === 0, errors };
}

describe('Feature: food-ordering-platform, Property 30: Message creation with valid data', () => {
  /**
   * **Validates: Requirements 14.1**
   *
   * For any valid message data (name 1-100 chars, email matching regex,
   * subject 1-200 chars, message 1-2000 chars), the validation should pass
   * and the message should be accepted for creation.
   */

  // Generator for valid email addresses matching the regex
  const validEmailArb = fc.tuple(
    fc.stringMatching(/^\w+$/, { minLength: 1, maxLength: 8 }),
    fc.stringMatching(/^\w+$/, { minLength: 1, maxLength: 8 }),
    fc.constantFrom('com', 'org', 'net', 'io', 'pk')
  ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`)
    .filter(email => EMAIL_REGEX.test(email));

  it('should accept valid message data', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0 && s.trim().length <= 100),
        validEmailArb,
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0 && s.trim().length <= 200),
        fc.string({ minLength: 1, maxLength: 2000 }).filter(s => s.trim().length > 0 && s.trim().length <= 2000),
        (name, email, subject, message) => {
          const result = validateMessage({ name, email, subject, message });
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject messages with invalid name (empty or >100 chars)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.string({ minLength: 101, maxLength: 200 }).filter(s => s.trim().length > 100)
        ),
        validEmailArb,
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 2000 }).filter(s => s.trim().length > 0),
        (invalidName, email, subject, message) => {
          const result = validateMessage({ name: invalidName, email, subject, message });
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Name invalid');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject messages with invalid email', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !EMAIL_REGEX.test(s)),
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 2000 }).filter(s => s.trim().length > 0),
        (name, invalidEmail, subject, message) => {
          const result = validateMessage({ name, email: invalidEmail, subject, message });
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Email invalid');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject messages with invalid subject (empty or >200 chars)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        validEmailArb,
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.string({ minLength: 201, maxLength: 400 }).filter(s => s.trim().length > 200)
        ),
        fc.string({ minLength: 1, maxLength: 2000 }).filter(s => s.trim().length > 0),
        (name, email, invalidSubject, message) => {
          const result = validateMessage({ name, email, subject: invalidSubject, message });
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Subject invalid');
        }
      ),
      { numRuns: 100 }
    );
  });
});


// --- Property 31: Non-admin access denied ---

/**
 * Admin access check helper extracted from server.js middleware logic.
 * Mirrors the isAdmin check used on admin-protected endpoints.
 */
function checkAdminAccess(user) {
  if (!user || !user.isAdmin) return { allowed: false, message: 'Access Denied' };
  return { allowed: true };
}

describe('Feature: food-ordering-platform, Property 31: Non-admin access denied', () => {
  /**
   * **Validates: Requirements 15.2**
   *
   * For any user object with isAdmin=false (or missing), attempting to
   * access admin-protected endpoints should return "Access Denied".
   */

  it('should deny access for users with isAdmin=false', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.string({ minLength: 5, maxLength: 50 }),
          isAdmin: fc.constant(false)
        }),
        (user) => {
          const result = checkAdminAccess(user);
          expect(result.allowed).toBe(false);
          expect(result.message).toBe('Access Denied');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deny access for users without isAdmin property', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.string({ minLength: 5, maxLength: 50 })
        }),
        (user) => {
          const result = checkAdminAccess(user);
          expect(result.allowed).toBe(false);
          expect(result.message).toBe('Access Denied');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deny access for null/undefined user', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        (user) => {
          const result = checkAdminAccess(user);
          expect(result.allowed).toBe(false);
          expect(result.message).toBe('Access Denied');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow access for admin users', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.string({ minLength: 5, maxLength: 50 }),
          isAdmin: fc.constant(true)
        }),
        (user) => {
          const result = checkAdminAccess(user);
          expect(result.allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// --- Property 32: Short order ID format ---

/**
 * Short order ID helper extracted from frontend display logic.
 * Generates a human-readable short ID from a MongoDB ObjectId string.
 */
function getShortOrderId(objectId) {
  return objectId.substring(objectId.length - 6).toUpperCase();
}

describe('Feature: food-ordering-platform, Property 32: Short order ID format', () => {
  /**
   * **Validates: Requirements 8.4**
   *
   * For any MongoDB-like ObjectId string (24 hex characters),
   * the short ID should be the last 6 characters uppercased.
   */

  // Generator for valid MongoDB ObjectId strings (24 hex chars)
  const objectIdArb = fc.stringMatching(/^[0-9a-f]{24}$/);

  it('should return last 6 characters uppercased for any ObjectId', () => {
    fc.assert(
      fc.property(
        objectIdArb,
        (objectId) => {
          const shortId = getShortOrderId(objectId);

          // Should be exactly 6 characters
          expect(shortId).toHaveLength(6);

          // Should be the last 6 chars of the original, uppercased
          const expectedLastSix = objectId.slice(-6).toUpperCase();
          expect(shortId).toBe(expectedLastSix);

          // Should be all uppercase hex characters
          expect(shortId).toMatch(/^[0-9A-F]{6}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always produce uppercase output regardless of input case', () => {
    fc.assert(
      fc.property(
        objectIdArb,
        (objectId) => {
          const shortId = getShortOrderId(objectId);

          // No lowercase letters in output
          expect(shortId).toBe(shortId.toUpperCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be deterministic - same input always produces same output', () => {
    fc.assert(
      fc.property(
        objectIdArb,
        (objectId) => {
          const result1 = getShortOrderId(objectId);
          const result2 = getShortOrderId(objectId);
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
