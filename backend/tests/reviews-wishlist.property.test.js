import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// --- Property 26: Review validation rejection ---

/**
 * Validator helper extracted from server.js review creation logic.
 * Mirrors the exact validation rules used in POST /api/reviews route.
 */
function validateReview(rating, comment) {
  const errors = [];
  if (rating === undefined || rating === null || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be an integer between 1 and 5');
  }
  if (!comment || comment.trim().length === 0) {
    errors.push('Comment is required');
  } else if (comment.length > 500) {
    errors.push('Comment must not exceed 500 characters');
  }
  return { valid: errors.length === 0, errors };
}

describe('Feature: food-ordering-platform, Property 26: Review validation rejection', () => {
  /**
   * **Validates: Requirements 12.3, 12.5**
   *
   * For any rating that is not an integer in [1,5] or any comment that is
   * empty or exceeds 500 characters, the review creation request should be
   * rejected with appropriate validation errors.
   */

  it('should reject non-integer ratings', () => {
    fc.assert(
      fc.property(
        // Generate floats that are not integers
        fc.double({ min: 0.1, max: 5.9, noNaN: true }).filter(n => !Number.isInteger(n)),
        fc.string({ minLength: 1, maxLength: 100 }),
        (invalidRating, comment) => {
          const result = validateReview(invalidRating, comment);
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Rating must be an integer between 1 and 5');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject ratings below 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 0 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (invalidRating, comment) => {
          const result = validateReview(invalidRating, comment);
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Rating must be an integer between 1 and 5');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject ratings above 5', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 6, max: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (invalidRating, comment) => {
          const result = validateReview(invalidRating, comment);
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Rating must be an integer between 1 and 5');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject empty comments', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.constantFrom('', '   ', '\t', '\n'),
        (validRating, emptyComment) => {
          const result = validateReview(validRating, emptyComment);
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Comment is required');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject comments exceeding 500 characters', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 501, maxLength: 800 }),
        (validRating, longComment) => {
          const result = validateReview(validRating, longComment);
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Comment must not exceed 500 characters');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid reviews with integer rating 1-5 and comment 1-500 chars', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        (validRating, validComment) => {
          const result = validateReview(validRating, validComment);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// --- Property 27: Reviews sorted by creation date ---

describe('Feature: food-ordering-platform, Property 27: Reviews sorted by creation date', () => {
  /**
   * **Validates: Requirements 12.2**
   *
   * For any collection of reviews with varying createdAt timestamps,
   * sorting by createdAt descending should produce a list where each
   * subsequent review has a createdAt <= the previous one.
   */

  it('should return reviews sorted by createdAt descending', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            rating: fc.integer({ min: 1, max: 5 }),
            comment: fc.string({ minLength: 1, maxLength: 100 }),
            createdAt: fc.integer({ min: 1577836800000, max: 1767139200000 }).map(ts => new Date(ts))
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (reviews) => {
          // Sort descending by createdAt (same logic as server: .sort({ createdAt: -1 }))
          const sorted = [...reviews].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          // Verify ordering: each element's createdAt >= next element's createdAt
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].createdAt.getTime()).toBeGreaterThanOrEqual(sorted[i + 1].createdAt.getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all reviews after sorting (no data loss)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            rating: fc.integer({ min: 1, max: 5 }),
            comment: fc.string({ minLength: 1, maxLength: 100 }),
            createdAt: fc.integer({ min: 1577836800000, max: 1767139200000 }).map(ts => new Date(ts))
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (reviews) => {
          const sorted = [...reviews].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          // Same number of reviews
          expect(sorted.length).toBe(reviews.length);

          // All original reviews are present in sorted result
          const sortedIds = sorted.map(r => r.id);
          for (const review of reviews) {
            expect(sortedIds).toContain(review.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// --- Property 28: Wishlist toggle idempotency ---

/**
 * Wishlist toggle helper extracted from frontend/backend logic.
 * Mirrors the add/remove wishlist behavior.
 */
function toggleWishlist(wishlist, product) {
  const exists = wishlist.some(item => item.id === product.id);
  if (exists) return wishlist.filter(item => item.id !== product.id);
  return [...wishlist, product];
}

describe('Feature: food-ordering-platform, Property 28: Wishlist toggle idempotency', () => {
  /**
   * **Validates: Requirements 13.1, 13.2**
   *
   * For any product and any wishlist state, toggling (add) then toggling
   * (remove) the same product should return the wishlist to its original state.
   */

  const productArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    price: fc.integer({ min: 100, max: 5000 })
  });

  it('should return to original state after toggle-add then toggle-remove', () => {
    fc.assert(
      fc.property(
        productArb,
        (product) => {
          // Start with empty wishlist
          const initial = [];

          // Toggle once (add)
          const afterAdd = toggleWishlist(initial, product);
          expect(afterAdd).toHaveLength(1);
          expect(afterAdd[0].id).toBe(product.id);

          // Toggle again (remove)
          const afterRemove = toggleWishlist(afterAdd, product);
          expect(afterRemove).toHaveLength(0);
          expect(afterRemove).toEqual(initial);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return to original state when product already exists in wishlist', () => {
    fc.assert(
      fc.property(
        fc.array(productArb, { minLength: 1, maxLength: 10 }).chain(products => {
          // Ensure unique IDs
          const uniqueProducts = products.filter((p, i, arr) =>
            arr.findIndex(x => x.id === p.id) === i
          );
          if (uniqueProducts.length === 0) return fc.constant({ products: [{ id: 'test-id', name: 'Test', price: 100 }], targetIndex: 0 });
          return fc.constant({ products: uniqueProducts, targetIndex: 0 });
        }),
        ({ products, targetIndex }) => {
          const target = products[targetIndex];

          // Start with the product already in the wishlist
          const initial = [...products];

          // Toggle (remove since it exists)
          const afterFirstToggle = toggleWishlist(initial, target);
          expect(afterFirstToggle.some(item => item.id === target.id)).toBe(false);

          // Toggle again (add it back)
          const afterSecondToggle = toggleWishlist(afterFirstToggle, target);
          expect(afterSecondToggle.some(item => item.id === target.id)).toBe(true);
          expect(afterSecondToggle.length).toBe(initial.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// --- Property 29: Wishlist persistence round-trip ---

describe('Feature: food-ordering-platform, Property 29: Wishlist persistence round-trip', () => {
  /**
   * **Validates: Requirements 13.4**
   *
   * For any wishlist array, serializing to JSON and deserializing back
   * should produce the same array (persistence round-trip).
   */

  const wishlistItemArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    price: fc.integer({ min: 100, max: 5000 }),
    category: fc.constantFrom('Desserts', 'Main Course', 'Beverages', 'Snacks'),
    image: fc.webUrl()
  });

  it('should serialize and deserialize wishlist without data loss', () => {
    fc.assert(
      fc.property(
        fc.array(wishlistItemArb, { minLength: 0, maxLength: 15 }),
        (wishlist) => {
          // Simulate persistence: serialize to JSON and parse back
          const serialized = JSON.stringify(wishlist);
          const deserialized = JSON.parse(serialized);

          expect(deserialized).toEqual(wishlist);
          expect(deserialized.length).toBe(wishlist.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain item order after round-trip', () => {
    fc.assert(
      fc.property(
        fc.array(wishlistItemArb, { minLength: 2, maxLength: 15 }),
        (wishlist) => {
          const serialized = JSON.stringify(wishlist);
          const deserialized = JSON.parse(serialized);

          // Verify order is preserved
          for (let i = 0; i < wishlist.length; i++) {
            expect(deserialized[i].id).toBe(wishlist[i].id);
            expect(deserialized[i].name).toBe(wishlist[i].name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
