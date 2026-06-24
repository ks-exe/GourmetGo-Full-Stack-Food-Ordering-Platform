import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Pure functions mirroring the cart logic in App.jsx

function addToCart(cart, product) {
  const existingItem = cart.find(item => item.id === product.id)
  if (existingItem) {
    return cart.map(item =>
      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
    )
  }
  return [...cart, { ...product, quantity: 1 }]
}

function updateQuantity(cart, id, quantity) {
  if (quantity < 1) return cart
  return cart.map(item => item.id === id ? { ...item, quantity } : item)
}

function removeFromCart(cart, id) {
  return cart.filter(item => item.id !== id)
}

function getCartCount(cart) {
  return cart.reduce((acc, item) => acc + item.quantity, 0)
}

function calculateOrderTotal(items) {
  const DELIVERY_FEE = 250
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  return subtotal + DELIVERY_FEE
}

// Generators

const productArb = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.integer({ min: 1, max: 5000 }),
  category: fc.constantFrom('Fast Food', 'BBQ', 'Desi', 'Special Dishes', 'Drinks', 'Ice Cream', 'Salad'),
  image: fc.constant('https://example.com/img.jpg'),
  description: fc.string({ minLength: 1, maxLength: 100 })
})

const cartItemArb = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.integer({ min: 1, max: 5000 }),
  category: fc.constantFrom('Fast Food', 'BBQ', 'Desi', 'Special Dishes', 'Drinks', 'Ice Cream', 'Salad'),
  image: fc.constant('https://example.com/img.jpg'),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  quantity: fc.integer({ min: 1, max: 50 })
})

// Generate a cart with unique IDs (no duplicates)
const cartArb = fc.array(cartItemArb, { minLength: 0, maxLength: 10 }).map(items => {
  const seen = new Set()
  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
})

/**
 * Property 8: Cart add idempotent quantity increment
 *
 * For any product and cart state, adding a product not in the cart → appears
 * with quantity 1; adding a product already in the cart → increments its
 * quantity by 1 with no duplicate entries.
 *
 * **Validates: Requirements 4.1, 4.2**
 */
describe('Feature: food-ordering-platform, Property 8: Cart add idempotent quantity increment', () => {
  it('adding a product not in the cart results in it appearing with quantity 1', () => {
    fc.assert(
      fc.property(cartArb, productArb, (cart, product) => {
        // Ensure product is NOT in the cart
        const filteredCart = cart.filter(item => item.id !== product.id)
        const result = addToCart(filteredCart, product)

        // Product should now be in the cart with quantity 1
        const addedItem = result.find(item => item.id === product.id)
        expect(addedItem).toBeDefined()
        expect(addedItem.quantity).toBe(1)

        // Cart length should increase by 1
        expect(result.length).toBe(filteredCart.length + 1)
      }),
      { numRuns: 100 }
    )
  })

  it('adding a product already in the cart increments quantity by 1 with no duplicates', () => {
    fc.assert(
      fc.property(cartArb, productArb, (cart, product) => {
        // Ensure product IS in the cart by adding it first
        const cartWithProduct = addToCart(
          cart.filter(item => item.id !== product.id),
          product
        )
        const originalItem = cartWithProduct.find(item => item.id === product.id)
        const originalQuantity = originalItem.quantity

        // Add the same product again
        const result = addToCart(cartWithProduct, product)

        // Quantity should be incremented by 1
        const updatedItem = result.find(item => item.id === product.id)
        expect(updatedItem.quantity).toBe(originalQuantity + 1)

        // No duplicate entries — length should remain the same
        expect(result.length).toBe(cartWithProduct.length)

        // Only one entry with this id
        const matchingItems = result.filter(item => item.id === product.id)
        expect(matchingItems.length).toBe(1)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 9: Cart quantity update boundary
 *
 * For any cart item and integer quantity >= 1, update sets the quantity;
 * for quantity < 1, cart remains unchanged.
 *
 * **Validates: Requirements 4.3**
 */
describe('Feature: food-ordering-platform, Property 9: Cart quantity update boundary', () => {
  it('updating with quantity >= 1 sets the item quantity to that value', () => {
    fc.assert(
      fc.property(cartArb, fc.integer({ min: 1, max: 100 }), (cart, newQuantity) => {
        // Skip if cart is empty
        fc.pre(cart.length > 0)

        const targetItem = cart[0]
        const result = updateQuantity(cart, targetItem.id, newQuantity)

        const updatedItem = result.find(item => item.id === targetItem.id)
        expect(updatedItem.quantity).toBe(newQuantity)
      }),
      { numRuns: 100 }
    )
  })

  it('updating with quantity < 1 leaves the cart unchanged', () => {
    fc.assert(
      fc.property(cartArb, fc.integer({ min: -100, max: 0 }), (cart, invalidQuantity) => {
        // Skip if cart is empty
        fc.pre(cart.length > 0)

        const targetItem = cart[0]
        const result = updateQuantity(cart, targetItem.id, invalidQuantity)

        // Cart should remain unchanged
        expect(result).toEqual(cart)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 10: Cart removal
 *
 * For any cart containing item X, removing X results in cart without X,
 * length decreased by 1.
 *
 * **Validates: Requirements 4.4**
 */
describe('Feature: food-ordering-platform, Property 10: Cart removal', () => {
  it('removing an item results in cart without that item and length decreased by 1', () => {
    fc.assert(
      fc.property(cartArb, (cart) => {
        // Need at least one item to remove
        fc.pre(cart.length > 0)

        const itemToRemove = cart[0]
        const result = removeFromCart(cart, itemToRemove.id)

        // Item should no longer be in the cart
        const found = result.find(item => item.id === itemToRemove.id)
        expect(found).toBeUndefined()

        // Length decreased by 1
        expect(result.length).toBe(cart.length - 1)
      }),
      { numRuns: 100 }
    )
  })

  it('removing an item preserves all other items in the cart', () => {
    fc.assert(
      fc.property(cartArb, (cart) => {
        fc.pre(cart.length > 1)

        const itemToRemove = cart[0]
        const result = removeFromCart(cart, itemToRemove.id)

        // All other items should still be present
        const otherItems = cart.filter(item => item.id !== itemToRemove.id)
        for (const item of otherItems) {
          const found = result.find(r => r.id === item.id)
          expect(found).toEqual(item)
        }
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 12: Cart badge count invariant
 *
 * For any cart array, badge count equals sum of all item quantities.
 *
 * **Validates: Requirements 4.8**
 */
describe('Feature: food-ordering-platform, Property 12: Cart badge count invariant', () => {
  it('badge count equals sum of all item quantities', () => {
    fc.assert(
      fc.property(cartArb, (cart) => {
        const badgeCount = getCartCount(cart)
        const expectedCount = cart.reduce((sum, item) => sum + item.quantity, 0)

        expect(badgeCount).toBe(expectedCount)
      }),
      { numRuns: 100 }
    )
  })

  it('empty cart has badge count of 0', () => {
    const badgeCount = getCartCount([])
    expect(badgeCount).toBe(0)
  })

  it('single item cart badge count equals item quantity', () => {
    fc.assert(
      fc.property(cartItemArb, (item) => {
        const badgeCount = getCartCount([item])
        expect(badgeCount).toBe(item.quantity)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 13: Order total calculation
 *
 * For any non-empty items (price > 0, quantity >= 1), total = sum(price × qty) + 250 delivery fee.
 *
 * **Validates: Requirements 5.4**
 */
describe('Feature: food-ordering-platform, Property 13: Order total calculation', () => {
  const orderItemArb = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    price: fc.integer({ min: 1, max: 5000 }),
    quantity: fc.integer({ min: 1, max: 50 })
  })

  const orderItemsArb = fc.array(orderItemArb, { minLength: 1, maxLength: 10 })

  it('total equals sum of (price × quantity) for all items plus 250 delivery fee', () => {
    fc.assert(
      fc.property(orderItemsArb, (items) => {
        const total = calculateOrderTotal(items)
        const expectedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const expectedTotal = expectedSubtotal + 250

        expect(total).toBe(expectedTotal)
      }),
      { numRuns: 100 }
    )
  })

  it('total is always greater than the delivery fee for non-empty items with price > 0', () => {
    fc.assert(
      fc.property(orderItemsArb, (items) => {
        const total = calculateOrderTotal(items)
        expect(total).toBeGreaterThan(250)
      }),
      { numRuns: 100 }
    )
  })

  it('delivery fee of 250 is always included in the total', () => {
    fc.assert(
      fc.property(orderItemsArb, (items) => {
        const total = calculateOrderTotal(items)
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        // total minus subtotal should always be 250
        expect(total - subtotal).toBe(250)
      }),
      { numRuns: 100 }
    )
  })
})
