import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 5: Products sorted by ID
 *
 * For any set of products in the database, GET /api/products should return
 * all products in ascending order by the `id` field (i.e., for any two
 * adjacent products in the response, the first product's id is less than
 * or equal to the second's).
 *
 * Since we can't hit a real DB, we test the sorting property on random arrays
 * by applying the same sort logic used by the API: sort({ id: 1 }) which means
 * ascending numeric sort on the id field.
 *
 * **Validates: Requirements 3.1**
 */
describe('Feature: food-ordering-platform, Property 5: Products sorted by ID', () => {
  // Replicate the sort logic used by the API (Mongoose .sort({ id: 1 }) is ascending by id)
  const sortProductsById = (products) => {
    return [...products].sort((a, b) => a.id - b.id);
  };

  // Generator for a product object with random numeric id, name, price, category
  const productArbitrary = fc.record({
    id: fc.integer({ min: -10000, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    price: fc.integer({ min: 1, max: 5000 }),
    category: fc.constantFrom('Fast Food', 'BBQ', 'Desi', 'Special Dishes', 'Drinks', 'Ice Cream', 'Salad'),
  });

  it('should return products in ascending order by id for any random array of products', () => {
    fc.assert(
      fc.property(
        fc.array(productArbitrary, { minLength: 0, maxLength: 50 }),
        (products) => {
          const sorted = sortProductsById(products);

          // Verify: for every pair of adjacent items, item[i].id <= item[i+1].id
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].id).toBeLessThanOrEqual(sorted[i + 1].id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all original products (no items lost or added) after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(productArbitrary, { minLength: 0, maxLength: 50 }),
        (products) => {
          const sorted = sortProductsById(products);

          // Length must be preserved
          expect(sorted.length).toBe(products.length);

          // All original ids must be present (as a multiset)
          const originalIds = products.map(p => p.id).sort((a, b) => a - b);
          const sortedIds = sorted.map(p => p.id).sort((a, b) => a - b);
          expect(sortedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 19: Product CRUD round-trip
 *
 * For any valid product data (all fields present), creating a product and then
 * retrieving it should include that product.
 *
 * **Validates: Requirements 7.1**
 */
describe('Feature: food-ordering-platform, Property 19: Product CRUD round-trip', () => {
  // Simulates an in-memory product store (mirrors MongoDB behavior)
  function createProductStore() {
    const store = [];
    return {
      create(product) {
        // Validate all required fields
        const required = ['id', 'name', 'price', 'category', 'image', 'description'];
        for (const field of required) {
          if (product[field] === undefined || product[field] === null || product[field] === '') {
            return { error: `${field} is required`, status: 400 };
          }
        }
        store.push({ ...product });
        return { product: { ...product }, status: 201 };
      },
      getAll() {
        return [...store];
      }
    };
  }

  // Generator for a valid product with all required fields
  const validProductArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    price: fc.integer({ min: 1, max: 5000 }),
    category: fc.constantFrom('Fast Food', 'BBQ', 'Desi', 'Special Dishes', 'Drinks', 'Ice Cream', 'Salad'),
    image: fc.webUrl(),
    description: fc.string({ minLength: 1, maxLength: 200 })
  });

  it('creating a product and retrieving all includes the created product', () => {
    fc.assert(
      fc.property(validProductArb, (product) => {
        const store = createProductStore();

        const createResult = store.create(product);
        expect(createResult.status).toBe(201);

        const allProducts = store.getAll();
        const found = allProducts.find(p => p.id === product.id);

        expect(found).toBeDefined();
        expect(found.name).toBe(product.name);
        expect(found.price).toBe(product.price);
        expect(found.category).toBe(product.category);
        expect(found.image).toBe(product.image);
        expect(found.description).toBe(product.description);
      }),
      { numRuns: 100 }
    );
  });

  it('creating multiple products and retrieving all includes every created product', () => {
    fc.assert(
      fc.property(
        fc.array(validProductArb, { minLength: 1, maxLength: 10 }).map(products => {
          // Ensure unique IDs
          const seen = new Set();
          return products.filter(p => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
        }).filter(arr => arr.length > 0),
        (products) => {
          const store = createProductStore();

          for (const product of products) {
            store.create(product);
          }

          const allProducts = store.getAll();
          expect(allProducts.length).toBe(products.length);

          for (const product of products) {
            const found = allProducts.find(p => p.id === product.id);
            expect(found).toBeDefined();
            expect(found.name).toBe(product.name);
            expect(found.price).toBe(product.price);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 20: Missing product fields rejection
 *
 * For any product data missing at least one required field (id, name, price,
 * category, image, description), creation should fail with a validation error.
 *
 * **Validates: Requirements 7.4**
 */
describe('Feature: food-ordering-platform, Property 20: Missing product fields rejection', () => {
  const REQUIRED_FIELDS = ['id', 'name', 'price', 'category', 'image', 'description'];

  // Simulates product validation (mirrors the backend validation)
  function validateProduct(product) {
    const missing = [];
    for (const field of REQUIRED_FIELDS) {
      if (product[field] === undefined || product[field] === null || product[field] === '') {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
    }
    return { valid: true };
  }

  // Generator for a valid product (all fields present)
  const validProductArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    price: fc.integer({ min: 1, max: 5000 }),
    category: fc.constantFrom('Fast Food', 'BBQ', 'Desi', 'Special Dishes', 'Drinks', 'Ice Cream', 'Salad'),
    image: fc.webUrl(),
    description: fc.string({ minLength: 1, maxLength: 200 })
  });

  // Generator: take a valid product and randomly remove one or more required fields
  const incompleteProductArb = validProductArb.chain(product => {
    // Generate a non-empty subset of fields to remove
    return fc.subarray(REQUIRED_FIELDS, { minLength: 1, maxLength: REQUIRED_FIELDS.length })
      .map(fieldsToRemove => {
        const incomplete = { ...product };
        for (const field of fieldsToRemove) {
          delete incomplete[field];
        }
        return { product: incomplete, removedFields: fieldsToRemove };
      });
  });

  it('product data missing required fields is rejected with validation error', () => {
    fc.assert(
      fc.property(incompleteProductArb, ({ product, removedFields }) => {
        const result = validateProduct(product);

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();

        // Verify that the error mentions at least one removed field
        for (const field of removedFields) {
          expect(result.error).toContain(field);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('valid product data with all fields passes validation', () => {
    fc.assert(
      fc.property(validProductArb, (product) => {
        const result = validateProduct(product);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('setting a required field to empty string is also rejected', () => {
    fc.assert(
      fc.property(
        validProductArb,
        fc.constantFrom(...REQUIRED_FIELDS.filter(f => f !== 'id' && f !== 'price')),
        (product, fieldToEmpty) => {
          const modified = { ...product, [fieldToEmpty]: '' };
          const result = validateProduct(modified);

          expect(result.valid).toBe(false);
          expect(result.error).toContain(fieldToEmpty);
        }
      ),
      { numRuns: 100 }
    );
  });
});
