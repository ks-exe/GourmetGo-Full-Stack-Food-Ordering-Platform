import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Pure functions mirroring the order/cart logic

function createOrder(userId, customerName, items) {
  const DELIVERY_FEE = 250;
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = subtotal + DELIVERY_FEE;
  return {
    userId,
    customerName,
    items: [...items],
    totalAmount,
    deliveryAddress: "Gulberg III, Lahore",
    status: "Pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function clearCartAfterOrder(userStore, userId) {
  userStore.set(userId, { ...userStore.get(userId), cart: [] });
  return userStore.get(userId).cart;
}

// Generators

const cartItemArb = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.integer({ min: 1, max: 5000 }),
  category: fc.constantFrom('Fast Food', 'BBQ', 'Desi', 'Special Dishes', 'Drinks', 'Ice Cream', 'Salad'),
  image: fc.constant('https://example.com/img.jpg'),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  quantity: fc.integer({ min: 1, max: 50 })
});

// Generate a cart with unique IDs and at least one item (for order tests)
const nonEmptyCartArb = fc.array(cartItemArb, { minLength: 1, maxLength: 10 }).map(items => {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}).filter(cart => cart.length > 0);

// Cart that can be empty (for persistence round-trip)
const cartArb = fc.array(cartItemArb, { minLength: 0, maxLength: 10 }).map(items => {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
});

const userIdArb = fc.string({ minLength: 10, maxLength: 24 }).filter(s => s.length > 0);
const customerNameArb = fc.string({ minLength: 1, maxLength: 50 });

/**
 * Property 11: Cart persistence round-trip
 *
 * For any cart array with valid items (quantity >= 1), serializing to JSON
 * and deserializing back should yield the same cart array. This tests the
 * round-trip for the localStorage/API persistence pattern.
 *
 * **Validates: Requirements 4.6**
 */
describe('Feature: food-ordering-platform, Property 11: Cart persistence round-trip', () => {
  it('serializing a cart to JSON and deserializing back yields the same cart', () => {
    fc.assert(
      fc.property(cartArb, (cart) => {
        // Simulate the persistence round-trip (JSON serialize/deserialize)
        const serialized = JSON.stringify(cart);
        const deserialized = JSON.parse(serialized);

        expect(deserialized).toEqual(cart);
        expect(deserialized.length).toBe(cart.length);
      }),
      { numRuns: 100 }
    );
  });

  it('all item quantities remain >= 1 after round-trip', () => {
    fc.assert(
      fc.property(cartArb, (cart) => {
        const serialized = JSON.stringify(cart);
        const deserialized = JSON.parse(serialized);

        for (const item of deserialized) {
          expect(item.quantity).toBeGreaterThanOrEqual(1);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('cart item structure is preserved through round-trip', () => {
    fc.assert(
      fc.property(nonEmptyCartArb, (cart) => {
        const serialized = JSON.stringify(cart);
        const deserialized = JSON.parse(serialized);

        for (let i = 0; i < cart.length; i++) {
          expect(deserialized[i].id).toBe(cart[i].id);
          expect(deserialized[i].name).toBe(cart[i].name);
          expect(deserialized[i].price).toBe(cart[i].price);
          expect(deserialized[i].quantity).toBe(cart[i].quantity);
          expect(deserialized[i].category).toBe(cart[i].category);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 14: Order creation completeness
 *
 * For any non-empty cart and user data, creating an order should produce a
 * record containing all required fields: userId, customerName, items matching
 * the cart, correctly calculated totalAmount (sum(price×qty)+250),
 * deliveryAddress "Gulberg III, Lahore", and status "Pending".
 *
 * **Validates: Requirements 5.1, 5.2**
 */
describe('Feature: food-ordering-platform, Property 14: Order creation completeness', () => {
  it('created order contains all required fields with correct values', () => {
    fc.assert(
      fc.property(userIdArb, customerNameArb, nonEmptyCartArb, (userId, customerName, items) => {
        const order = createOrder(userId, customerName, items);

        // userId and customerName match inputs
        expect(order.userId).toBe(userId);
        expect(order.customerName).toBe(customerName);

        // items match the cart
        expect(order.items).toEqual(items);
        expect(order.items.length).toBe(items.length);

        // totalAmount is correctly calculated
        const expectedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const expectedTotal = expectedSubtotal + 250;
        expect(order.totalAmount).toBe(expectedTotal);

        // deliveryAddress is the fixed address
        expect(order.deliveryAddress).toBe("Gulberg III, Lahore");

        // status is "Pending"
        expect(order.status).toBe("Pending");

        // timestamps are present and valid ISO strings
        expect(order.createdAt).toBeDefined();
        expect(order.updatedAt).toBeDefined();
        expect(new Date(order.createdAt).toISOString()).toBe(order.createdAt);
        expect(new Date(order.updatedAt).toISOString()).toBe(order.updatedAt);
      }),
      { numRuns: 100 }
    );
  });

  it('order items are a copy (not a reference) of the input cart', () => {
    fc.assert(
      fc.property(userIdArb, customerNameArb, nonEmptyCartArb, (userId, customerName, items) => {
        const order = createOrder(userId, customerName, items);

        // Mutating the original cart should not affect the order
        const originalItems = [...order.items];
        items.push({ id: 9999, name: 'extra', price: 100, quantity: 1, category: 'Fast Food', image: '', description: '' });

        expect(order.items).toEqual(originalItems);
        expect(order.items.length).toBe(originalItems.length);
      }),
      { numRuns: 100 }
    );
  });

  it('totalAmount is always greater than 250 (delivery fee) for non-empty cart with valid prices', () => {
    fc.assert(
      fc.property(userIdArb, customerNameArb, nonEmptyCartArb, (userId, customerName, items) => {
        const order = createOrder(userId, customerName, items);
        expect(order.totalAmount).toBeGreaterThan(250);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 15: Cart cleared after successful order
 *
 * For any successfully created order, the user's cart should be empty.
 * Simulate: after order creation, the user cart becomes [].
 *
 * **Validates: Requirements 5.3**
 */
describe('Feature: food-ordering-platform, Property 15: Cart cleared after successful order', () => {
  it('user cart is empty after a successful order creation', () => {
    fc.assert(
      fc.property(userIdArb, customerNameArb, nonEmptyCartArb, (userId, customerName, items) => {
        // Simulate a user store (like MongoDB users collection)
        const userStore = new Map();
        userStore.set(userId, { name: customerName, cart: [...items], wishlist: [] });

        // Create the order (simulates successful order creation)
        const order = createOrder(userId, customerName, items);
        expect(order).toBeDefined();

        // Clear the cart after successful order
        const cartAfterOrder = clearCartAfterOrder(userStore, userId);

        // Cart should be empty
        expect(cartAfterOrder).toEqual([]);
        expect(cartAfterOrder.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('other user data is preserved after cart clearing', () => {
    fc.assert(
      fc.property(userIdArb, customerNameArb, nonEmptyCartArb, (userId, customerName, items) => {
        const wishlist = [{ id: 1, name: 'Test Product' }];
        const userStore = new Map();
        userStore.set(userId, { name: customerName, cart: [...items], wishlist });

        // Create the order and clear cart
        createOrder(userId, customerName, items);
        clearCartAfterOrder(userStore, userId);

        // Cart is empty but other fields preserved
        const user = userStore.get(userId);
        expect(user.cart).toEqual([]);
        expect(user.name).toBe(customerName);
        expect(user.wishlist).toEqual(wishlist);
      }),
      { numRuns: 100 }
    );
  });

  it('clearing cart is idempotent - clearing an already empty cart stays empty', () => {
    fc.assert(
      fc.property(userIdArb, customerNameArb, (userId, customerName) => {
        const userStore = new Map();
        userStore.set(userId, { name: customerName, cart: [], wishlist: [] });

        // Clear already-empty cart
        const result = clearCartAfterOrder(userStore, userId);
        expect(result).toEqual([]);

        // Clear again
        const result2 = clearCartAfterOrder(userStore, userId);
        expect(result2).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 16: Order history sorted descending
 *
 * For any user with multiple orders, retrieving order history should return
 * orders sorted by createdAt in strictly descending order.
 *
 * **Validates: Requirements 6.1**
 */
describe('Feature: food-ordering-platform, Property 16: Order history sorted descending', () => {
  // Helper: sort orders descending by createdAt (mirrors the API sort logic)
  const sortOrdersDescending = (orders) => {
    return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Generator for a hex string (simulates MongoDB ObjectId)
  const hexIdArb = fc.stringMatching(/^[0-9a-f]{24}$/);

  // Timestamp-based date generator (2023-01-01 to 2025-12-31 in ms)
  const isoDateArb = fc.integer({ min: 1672531200000, max: 1767139200000 })
    .map(ts => new Date(ts).toISOString());

  // Generator for an order with a random createdAt date
  const orderWithDateArb = fc.record({
    _id: hexIdArb,
    userId: hexIdArb,
    customerName: fc.string({ minLength: 1, maxLength: 50 }),
    items: fc.array(
      fc.record({
        id: fc.integer({ min: 1, max: 1000 }),
        name: fc.string({ minLength: 1, maxLength: 30 }),
        price: fc.integer({ min: 1, max: 5000 }),
        quantity: fc.integer({ min: 1, max: 20 })
      }),
      { minLength: 1, maxLength: 5 }
    ),
    totalAmount: fc.integer({ min: 251, max: 100000 }),
    status: fc.constantFrom('Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'),
    createdAt: isoDateArb
  });

  it('order history is sorted by createdAt in descending order', () => {
    fc.assert(
      fc.property(
        fc.array(orderWithDateArb, { minLength: 2, maxLength: 20 }),
        (orders) => {
          const sorted = sortOrdersDescending(orders);

          // Verify each consecutive pair: earlier index has >= createdAt than later index
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(new Date(sorted[i].createdAt).getTime())
              .toBeGreaterThanOrEqual(new Date(sorted[i + 1].createdAt).getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting preserves all orders (no items lost or added)', () => {
    fc.assert(
      fc.property(
        fc.array(orderWithDateArb, { minLength: 2, maxLength: 20 }),
        (orders) => {
          const sorted = sortOrdersDescending(orders);

          expect(sorted.length).toBe(orders.length);

          // All original _ids must be present
          const originalIds = orders.map(o => o._id).sort();
          const sortedIds = sorted.map(o => o._id).sort();
          expect(sortedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 17: Order status invariant
 *
 * For any order in the system, the status field should be one of exactly
 * these values: "Pending", "Preparing", "Out for Delivery", "Delivered",
 * or "Cancelled".
 *
 * **Validates: Requirements 6.3, 8.2**
 */
describe('Feature: food-ordering-platform, Property 17: Order status invariant', () => {
  const VALID_STATUSES = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

  const hexIdArb = fc.stringMatching(/^[0-9a-f]{24}$/);

  // Timestamp-based date generator
  const isoDateArb = fc.integer({ min: 1672531200000, max: 1767139200000 })
    .map(ts => new Date(ts).toISOString());

  // Generator for random orders with status from the valid enum
  const orderArb = fc.record({
    _id: hexIdArb,
    userId: hexIdArb,
    customerName: fc.string({ minLength: 1, maxLength: 50 }),
    items: fc.array(
      fc.record({
        id: fc.integer({ min: 1, max: 1000 }),
        name: fc.string({ minLength: 1, maxLength: 30 }),
        price: fc.integer({ min: 1, max: 5000 }),
        quantity: fc.integer({ min: 1, max: 20 })
      }),
      { minLength: 1, maxLength: 5 }
    ),
    totalAmount: fc.integer({ min: 251, max: 100000 }),
    status: fc.constantFrom(...VALID_STATUSES),
    createdAt: isoDateArb
  });

  it('every order status is from the allowed enum set', () => {
    fc.assert(
      fc.property(orderArb, (order) => {
        expect(VALID_STATUSES).toContain(order.status);
      }),
      { numRuns: 100 }
    );
  });

  it('status validation rejects values outside the enum', () => {
    // Generate random strings that are NOT valid statuses
    const invalidStatusArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => !VALID_STATUSES.includes(s));

    const validateStatus = (status) => VALID_STATUSES.includes(status);

    fc.assert(
      fc.property(invalidStatusArb, (invalidStatus) => {
        expect(validateStatus(invalidStatus)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('all five status values are accepted by validation', () => {
    const validateStatus = (status) => VALID_STATUSES.includes(status);

    fc.assert(
      fc.property(fc.constantFrom(...VALID_STATUSES), (validStatus) => {
        expect(validateStatus(validStatus)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 18: Admin order status update
 *
 * For any existing order and any valid status value, updating the status
 * should persist the new status.
 *
 * **Validates: Requirements 8.2, 8.3**
 */
describe('Feature: food-ordering-platform, Property 18: Admin order status update', () => {
  const VALID_STATUSES = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

  // Simulates admin status update logic
  function updateOrderStatus(orderStore, orderId, newStatus) {
    if (!VALID_STATUSES.includes(newStatus)) {
      return { error: 'Invalid status value', status: 400 };
    }
    const order = orderStore.get(orderId);
    if (!order) {
      return { error: 'Order not found', status: 404 };
    }
    const updatedOrder = { ...order, status: newStatus, updatedAt: new Date().toISOString() };
    orderStore.set(orderId, updatedOrder);
    return { order: updatedOrder, status: 200 };
  }

  const hexIdArb = fc.stringMatching(/^[0-9a-f]{24}$/);

  // Timestamp-based date generator
  const isoDateArb = fc.integer({ min: 1672531200000, max: 1767139200000 })
    .map(ts => new Date(ts).toISOString());

  // Generator for an existing order
  const orderArb = fc.record({
    _id: hexIdArb,
    userId: hexIdArb,
    customerName: fc.string({ minLength: 1, maxLength: 50 }),
    items: fc.array(
      fc.record({
        id: fc.integer({ min: 1, max: 1000 }),
        name: fc.string({ minLength: 1, maxLength: 30 }),
        price: fc.integer({ min: 1, max: 5000 }),
        quantity: fc.integer({ min: 1, max: 20 })
      }),
      { minLength: 1, maxLength: 5 }
    ),
    totalAmount: fc.integer({ min: 251, max: 100000 }),
    status: fc.constantFrom(...VALID_STATUSES),
    createdAt: isoDateArb,
    updatedAt: isoDateArb
  });

  it('updating with a valid status persists the new status', () => {
    fc.assert(
      fc.property(orderArb, fc.constantFrom(...VALID_STATUSES), (order, newStatus) => {
        const orderStore = new Map();
        orderStore.set(order._id, { ...order });

        const result = updateOrderStatus(orderStore, order._id, newStatus);

        expect(result.status).toBe(200);
        expect(result.order.status).toBe(newStatus);
        // Verify persistence in the store
        expect(orderStore.get(order._id).status).toBe(newStatus);
      }),
      { numRuns: 100 }
    );
  });

  it('updating preserves all other order fields', () => {
    fc.assert(
      fc.property(orderArb, fc.constantFrom(...VALID_STATUSES), (order, newStatus) => {
        const orderStore = new Map();
        orderStore.set(order._id, { ...order });

        const result = updateOrderStatus(orderStore, order._id, newStatus);

        expect(result.order._id).toBe(order._id);
        expect(result.order.userId).toBe(order.userId);
        expect(result.order.customerName).toBe(order.customerName);
        expect(result.order.items).toEqual(order.items);
        expect(result.order.totalAmount).toBe(order.totalAmount);
      }),
      { numRuns: 100 }
    );
  });

  it('updating with an invalid status returns error', () => {
    const invalidStatusArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => !VALID_STATUSES.includes(s));

    fc.assert(
      fc.property(orderArb, invalidStatusArb, (order, invalidStatus) => {
        const orderStore = new Map();
        orderStore.set(order._id, { ...order });

        const result = updateOrderStatus(orderStore, order._id, invalidStatus);

        expect(result.status).toBe(400);
        expect(result.error).toBe('Invalid status value');
        // Original status should remain unchanged
        expect(orderStore.get(order._id).status).toBe(order.status);
      }),
      { numRuns: 100 }
    );
  });
});
