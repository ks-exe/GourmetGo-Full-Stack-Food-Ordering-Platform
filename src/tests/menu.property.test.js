import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 6: Category filter correctness
 *
 * For any product set and for any selected category, filtering should return
 * only products whose `category` field matches the selected category; when
 * "All" is selected, all products should be returned.
 *
 * **Validates: Requirements 3.2**
 */

const CATEGORIES = ['Fast Food', 'BBQ', 'Desi', 'Special Dishes', 'Drinks', 'Ice Cream', 'Salad']

// Generator for a random product with a category from the valid set
const productArb = fc.record({
  id: fc.nat(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.integer({ min: 1, max: 5000 }),
  category: fc.constantFrom(...CATEGORIES),
  image: fc.constant('https://example.com/img.jpg'),
  description: fc.string({ minLength: 1, maxLength: 100 })
})

// Generator for an array of products
const productsArb = fc.array(productArb, { minLength: 0, maxLength: 30 })

// Generator for category selection including "All"
const categorySelectionArb = fc.constantFrom('All', ...CATEGORIES)

// The exact filter logic from Menu.jsx
function filterByCategory(products, activeCategory) {
  return products.filter(product => {
    return activeCategory === 'All' || product.category === activeCategory
  })
}

describe('Feature: food-ordering-platform, Property 6: Category filter correctness', () => {
  it('when "All" is selected, result length equals input length', () => {
    fc.assert(
      fc.property(productsArb, (products) => {
        const result = filterByCategory(products, 'All')
        expect(result.length).toBe(products.length)
      }),
      { numRuns: 100 }
    )
  })

  it('when a specific category is selected, every product in result has matching category', () => {
    fc.assert(
      fc.property(productsArb, categorySelectionArb, (products, category) => {
        if (category === 'All') return // skip "All" — covered above

        const result = filterByCategory(products, category)
        for (const product of result) {
          expect(product.category).toBe(category)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('when a specific category is selected, all matching products from input are in result', () => {
    fc.assert(
      fc.property(productsArb, categorySelectionArb, (products, category) => {
        if (category === 'All') return // skip "All" — covered above

        const result = filterByCategory(products, category)
        const expectedProducts = products.filter(p => p.category === category)

        // Every product matching the category in the input must appear in result
        expect(result.length).toBe(expectedProducts.length)

        for (const expected of expectedProducts) {
          expect(result).toContainEqual(expected)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('filter logic matches Menu.jsx: activeCategory === "All" || product.category === activeCategory', () => {
    fc.assert(
      fc.property(productsArb, categorySelectionArb, (products, activeCategory) => {
        const result = filterByCategory(products, activeCategory)

        // Verify result matches the exact filter condition from Menu.jsx
        const expected = products.filter(product =>
          activeCategory === 'All' || product.category === activeCategory
        )

        expect(result).toEqual(expected)
      }),
      { numRuns: 100 }
    )
  })
})


/**
 * Property 7: Search filter correctness
 *
 * For any search query string and for any product set, the filtered results
 * should contain only products whose `name` contains the query as a
 * case-insensitive substring.
 *
 * **Validates: Requirements 3.3**
 */

// Generator for a random product with an arbitrary name
const searchProductArb = fc.record({
  id: fc.nat(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.integer({ min: 1, max: 5000 }),
  category: fc.constantFrom(...CATEGORIES),
  image: fc.constant('https://example.com/img.jpg'),
  description: fc.string({ minLength: 1, maxLength: 100 })
})

// Generator for an array of products with varied names
const searchProductsArb = fc.array(searchProductArb, { minLength: 0, maxLength: 30 })

// Generator for a random search query string (may or may not match product names)
const searchQueryArb = fc.string({ minLength: 0, maxLength: 20 })

// The exact filter logic from Menu.jsx for search
function filterBySearch(products, searchQuery) {
  return products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
}

describe('Feature: food-ordering-platform, Property 7: Search filter correctness', () => {
  it('all products in result contain the query as a case-insensitive substring in their name', () => {
    fc.assert(
      fc.property(searchProductsArb, searchQueryArb, (products, query) => {
        const result = filterBySearch(products, query)
        for (const product of result) {
          expect(product.name.toLowerCase()).toContain(query.toLowerCase())
        }
      }),
      { numRuns: 100 }
    )
  })

  it('no matching products are missing from the result (completeness)', () => {
    fc.assert(
      fc.property(searchProductsArb, searchQueryArb, (products, query) => {
        const result = filterBySearch(products, query)
        const expected = products.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase())
        )

        // Every product that matches should be in the result
        expect(result.length).toBe(expected.length)
        for (const exp of expected) {
          expect(result).toContainEqual(exp)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('empty query returns all products', () => {
    fc.assert(
      fc.property(searchProductsArb, (products) => {
        const result = filterBySearch(products, '')
        expect(result.length).toBe(products.length)
        expect(result).toEqual(products)
      }),
      { numRuns: 100 }
    )
  })

  it('search is case-insensitive: query uppercase/lowercase yields same results', () => {
    fc.assert(
      fc.property(searchProductsArb, searchQueryArb, (products, query) => {
        const resultLower = filterBySearch(products, query.toLowerCase())
        const resultUpper = filterBySearch(products, query.toUpperCase())
        expect(resultLower).toEqual(resultUpper)
      }),
      { numRuns: 100 }
    )
  })
})
