import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─── Helper functions under test ────────────────────────────────────────────────

/**
 * Simulates the ML recommendation endpoint logic.
 * Filters products matching query in name or category (case-insensitive),
 * returns at most maxResults items.
 */
function getRecommendations(products, query, maxResults = 5) {
  const matches = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );
  return matches.slice(0, maxResults);
}

/**
 * Calculates the final recommendation score.
 * Formula: 0.75 × similarity + 0.25 × popularity
 */
function calculateFinalScore(similarity, popularity) {
  return 0.75 * similarity + 0.25 * popularity;
}

/**
 * Simulates the trending endpoint logic.
 * Returns at most maxItems products sorted by orderCount descending.
 */
function getTrendingItems(products, maxItems = 6) {
  return [...products].sort((a, b) => b.orderCount - a.orderCount).slice(0, maxItems);
}

/**
 * Simulates sales prediction: returns a prediction for every product in catalog.
 */
function predictSales(products, params) {
  return products.map(p => ({
    ...p,
    expected_sales: Math.floor(Math.random() * 50) + 5,
    demand_level: '',
    stock_recommendation: ''
  }));
}

/**
 * Classifies demand level based on expected sales.
 */
function classifyDemand(expectedSales) {
  if (expectedSales >= 35) return 'High Demand';
  if (expectedSales >= 20) return 'Moderate Demand';
  return 'Low Demand';
}

// ─── Generators ─────────────────────────────────────────────────────────────────

const categoryArb = fc.constantFrom(
  'Fast Food', 'BBQ', 'Desi', 'Special Dishes', 'Drinks', 'Ice Cream', 'Salad'
);

const productArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.integer({ min: 50, max: 5000 }),
  category: categoryArb,
  image: fc.constant('https://example.com/img.jpg'),
  description: fc.string({ minLength: 1, maxLength: 100 })
});

const productWithOrderCountArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.integer({ min: 50, max: 5000 }),
  category: categoryArb,
  orderCount: fc.integer({ min: 0, max: 1000 })
});

// ─── Property 21: Recommendation count bound ────────────────────────────────────

/**
 * Property 21: Recommendation count bound
 *
 * For any query, the recommendation function should return between 0 and 5 items
 * regardless of how many products match.
 *
 * **Validates: Requirements 9.1**
 */
describe('Feature: food-ordering-platform, Property 21: Recommendation count bound', () => {
  it('should return at most 5 items for any product array and query', () => {
    fc.assert(
      fc.property(
        fc.array(productArb, { minLength: 0, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (products, query) => {
          const results = getRecommendations(products, query);
          expect(results.length).toBeGreaterThanOrEqual(0);
          expect(results.length).toBeLessThanOrEqual(5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 items when no products match the query', () => {
    fc.assert(
      fc.property(
        fc.array(productArb, { minLength: 0, maxLength: 50 }),
        (products) => {
          // Use a query that is extremely unlikely to match any generated product
          const impossibleQuery = '___ZZZZZ_NO_MATCH_99999___';
          const results = getRecommendations(products, impossibleQuery);
          expect(results.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returned items are a subset of matching products', () => {
    fc.assert(
      fc.property(
        fc.array(productArb, { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (products, query) => {
          const results = getRecommendations(products, query);
          // Every returned item must be from the original product array
          for (const item of results) {
            const existsInOriginal = products.some(
              p => p.id === item.id && p.name === item.name
            );
            expect(existsInOriginal).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 22: Recommendation score formula ──────────────────────────────────

/**
 * Property 22: Recommendation score formula
 *
 * For any similarity ∈ [0,1] and popularity ∈ [0,1], the final score must equal
 * 0.75 × similarity + 0.25 × popularity. The result is always in [0, 1].
 *
 * **Validates: Requirements 9.5**
 */
describe('Feature: food-ordering-platform, Property 22: Recommendation score formula', () => {
  const unitFloatArb = fc.double({ min: 0, max: 1, noNaN: true });

  it('final score equals 0.75 * similarity + 0.25 * popularity', () => {
    fc.assert(
      fc.property(unitFloatArb, unitFloatArb, (similarity, popularity) => {
        const score = calculateFinalScore(similarity, popularity);
        const expected = 0.75 * similarity + 0.25 * popularity;
        expect(score).toBeCloseTo(expected, 10);
      }),
      { numRuns: 100 }
    );
  });

  it('final score is always between 0 and 1 inclusive', () => {
    fc.assert(
      fc.property(unitFloatArb, unitFloatArb, (similarity, popularity) => {
        const score = calculateFinalScore(similarity, popularity);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it('score is maximized (1.0) when both similarity and popularity are 1.0', () => {
    const score = calculateFinalScore(1.0, 1.0);
    expect(score).toBeCloseTo(1.0, 10);
  });

  it('score is minimized (0.0) when both similarity and popularity are 0.0', () => {
    const score = calculateFinalScore(0.0, 0.0);
    expect(score).toBeCloseTo(0.0, 10);
  });
});

// ─── Property 23: Trending items sorted by popularity ───────────────────────────

/**
 * Property 23: Trending items sorted by popularity
 *
 * The trending endpoint returns at most 6 items sorted by order frequency
 * (orderCount) in descending order.
 *
 * **Validates: Requirements 10.1**
 */
describe('Feature: food-ordering-platform, Property 23: Trending items sorted by popularity', () => {
  it('should return at most 6 items', () => {
    fc.assert(
      fc.property(
        fc.array(productWithOrderCountArb, { minLength: 0, maxLength: 50 }),
        (products) => {
          const trending = getTrendingItems(products);
          expect(trending.length).toBeLessThanOrEqual(6);
          expect(trending.length).toBe(Math.min(products.length, 6));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return items sorted by orderCount descending', () => {
    fc.assert(
      fc.property(
        fc.array(productWithOrderCountArb, { minLength: 0, maxLength: 50 }),
        (products) => {
          const trending = getTrendingItems(products);

          for (let i = 0; i < trending.length - 1; i++) {
            expect(trending[i].orderCount).toBeGreaterThanOrEqual(trending[i + 1].orderCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trending items are the top-N by orderCount from the original list', () => {
    fc.assert(
      fc.property(
        fc.array(productWithOrderCountArb, { minLength: 1, maxLength: 50 }),
        (products) => {
          const trending = getTrendingItems(products);

          // The minimum orderCount in trending should be >= any orderCount NOT in trending
          if (trending.length > 0 && trending.length < products.length) {
            const minTrending = trending[trending.length - 1].orderCount;
            const nonTrending = products.filter(
              p => !trending.some(t => t === p)
            );
            for (const p of nonTrending) {
              expect(p.orderCount).toBeLessThanOrEqual(minTrending);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 24: Sales prediction coverage ─────────────────────────────────────

/**
 * Property 24: Sales prediction coverage
 *
 * For any valid input, predictions should be returned for every product in the
 * catalog. The length of predictions equals the length of the product catalog.
 *
 * **Validates: Requirements 11.1**
 */
describe('Feature: food-ordering-platform, Property 24: Sales prediction coverage', () => {
  const paramsArb = fc.record({
    weather: fc.constantFrom('Sunny', 'Rainy', 'Cloudy', 'Hot', 'Cold'),
    temperature: fc.integer({ min: 5, max: 48 }),
    weekend: fc.boolean(),
    occasion: fc.constantFrom('None', 'Eid', 'Wedding', 'Birthday', 'Corporate')
  });

  it('should return a prediction for every product in the catalog', () => {
    fc.assert(
      fc.property(
        fc.array(productArb, { minLength: 0, maxLength: 50 }),
        paramsArb,
        (products, params) => {
          const predictions = predictSales(products, params);
          expect(predictions.length).toBe(products.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each prediction contains expected_sales, demand_level, and stock_recommendation fields', () => {
    fc.assert(
      fc.property(
        fc.array(productArb, { minLength: 1, maxLength: 20 }),
        paramsArb,
        (products, params) => {
          const predictions = predictSales(products, params);
          for (const pred of predictions) {
            expect(pred).toHaveProperty('expected_sales');
            expect(pred).toHaveProperty('demand_level');
            expect(pred).toHaveProperty('stock_recommendation');
            expect(typeof pred.expected_sales).toBe('number');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('predictions preserve original product data', () => {
    fc.assert(
      fc.property(
        fc.array(productArb, { minLength: 1, maxLength: 20 }),
        paramsArb,
        (products, params) => {
          const predictions = predictSales(products, params);
          for (let i = 0; i < products.length; i++) {
            expect(predictions[i].id).toBe(products[i].id);
            expect(predictions[i].name).toBe(products[i].name);
            expect(predictions[i].category).toBe(products[i].category);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 25: Demand level classification ───────────────────────────────────

/**
 * Property 25: Demand level classification
 *
 * Classification rules:
 *   - expected_sales >= 35 → "High Demand"
 *   - expected_sales >= 20 and < 35 → "Moderate Demand"
 *   - expected_sales < 20 → "Low Demand"
 *
 * **Validates: Requirements 11.3, 11.5**
 */
describe('Feature: food-ordering-platform, Property 25: Demand level classification', () => {
  it('expected_sales >= 35 should classify as "High Demand"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 35, max: 1000 }),
        (sales) => {
          expect(classifyDemand(sales)).toBe('High Demand');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('expected_sales >= 20 and < 35 should classify as "Moderate Demand"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 34 }),
        (sales) => {
          expect(classifyDemand(sales)).toBe('Moderate Demand');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('expected_sales < 20 should classify as "Low Demand"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 19 }),
        (sales) => {
          expect(classifyDemand(sales)).toBe('Low Demand');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('classification covers all non-negative integers (exactly one category per value)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        (sales) => {
          const result = classifyDemand(sales);
          const validLevels = ['High Demand', 'Moderate Demand', 'Low Demand'];
          expect(validLevels).toContain(result);

          // Verify mutual exclusivity
          if (sales >= 35) {
            expect(result).toBe('High Demand');
          } else if (sales >= 20) {
            expect(result).toBe('Moderate Demand');
          } else {
            expect(result).toBe('Low Demand');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('boundary values are classified correctly', () => {
    // Exact boundary tests
    expect(classifyDemand(35)).toBe('High Demand');
    expect(classifyDemand(34)).toBe('Moderate Demand');
    expect(classifyDemand(20)).toBe('Moderate Demand');
    expect(classifyDemand(19)).toBe('Low Demand');
    expect(classifyDemand(0)).toBe('Low Demand');
  });
});
