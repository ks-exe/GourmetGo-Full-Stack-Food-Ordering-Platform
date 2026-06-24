/* eslint-env node */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Product = require('./models/Product');
const User = require('./models/User');

const Review = require('./models/Review');
const Order = require('./models/Order');
const Message = require('./models/Message');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Admin authorization middleware
const requireAdmin = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(403).json({ message: 'Access Denied' });
  }
  try {
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access Denied' });
    }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Access Denied' });
  }
};

// Routes
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ id: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Product Routes
app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const requiredFields = ['id', 'name', 'price', 'category', 'image', 'description'];
    const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}`, missingFields });
    }
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const updatedProduct = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findOneAndDelete({ id: req.params.id });
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    const errors = [];
    if (!name || (typeof name === 'string' && name.trim().length === 0)) {
      errors.push('Name is required');
    } else if (typeof name === 'string' && name.trim().length > 50) {
      errors.push('Name must be between 1 and 50 characters');
    }

    if (!email) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        errors.push('Please provide a valid email address');
      }
    }

    if (!password) {
      errors.push('Password is required');
    } else if (typeof password === 'string' && password.length < 6) {
      errors.push('Password must be at least 6 characters');
    } else if (typeof password === 'string' && password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', '), errors });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Auto-assign admin if email matches
    const isAdmin = email === 'gullylaila509@gmail.com';

    // Create new user
    const newUser = new User({ name, email, password, isAdmin });
    await newUser.save();

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    const errors = [];
    if (!email) {
      errors.push('Email is required');
    }
    if (!password) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', '), errors });
    }

    let user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Ensure the specific email is always an admin, even if created before the logic was added
    if (email === 'gullylaila509@gmail.com' && !user.isAdmin) {
      user.isAdmin = true;
      await user.save();
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      cart: user.cart,
      wishlist: user.wishlist
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User Sync Routes
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, cart: user.cart, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/users/:id/cart', async (req, res) => {
  try {
    const { cart } = req.body;

    // Validate cart is an array
    if (!Array.isArray(cart)) {
      return res.status(400).json({ message: 'Cart must be an array' });
    }

    // Validate all item quantities are >= 1
    for (const item of cart) {
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ message: 'All cart item quantities must be at least 1' });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, { cart: cart }, { new: true });
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/users/:id/wishlist', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { wishlist: req.body.wishlist }, { new: true });
    res.json(user.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Review Routes
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { name, rating, comment } = req.body;

    // Validate input
    const errors = [];

    if (!name || (typeof name === 'string' && name.trim().length === 0)) {
      errors.push('Name is required');
    }

    if (rating === undefined || rating === null) {
      errors.push('Rating is required');
    } else if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push('Rating must be an integer between 1 and 5');
    }

    if (!comment || (typeof comment === 'string' && comment.trim().length === 0)) {
      errors.push('Comment is required');
    } else if (typeof comment === 'string' && comment.length > 500) {
      errors.push('Comment must not exceed 500 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', '), errors });
    }

    const newReview = new Review(req.body);
    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Order Routes
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, customerName, items, totalAmount } = req.body;

    // Validate required fields
    const errors = [];
    if (!userId) {
      errors.push('userId is required');
    }
    if (!customerName || (typeof customerName === 'string' && customerName.trim().length === 0)) {
      errors.push('customerName is required');
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.push('items must be a non-empty array');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', '), errors });
    }

    // Server-side total calculation: sum of (price × quantity) + 250 delivery fee
    const DELIVERY_FEE = 250;
    const itemsSubtotal = items.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity));
    }, 0);
    const calculatedTotal = itemsSubtotal + DELIVERY_FEE;

    // Default delivery address to "Gulberg III, Lahore" if not provided
    const deliveryAddress = req.body.deliveryAddress || "Gulberg III, Lahore";

    const newOrder = new Order({
      userId,
      customerName,
      items,
      totalAmount: calculatedTotal,
      deliveryAddress,
      status: req.body.status || 'Pending'
    });
    await newOrder.save();

    // Clear user's cart after successful order
    await User.findByIdAndUpdate(userId, { cart: [] });

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const validStatuses = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    const { status } = req.body;

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Message Routes
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    const errors = [];

    if (!name || (typeof name === 'string' && name.trim().length === 0)) {
      errors.push('Name is required');
    } else if (typeof name !== 'string' || name.trim().length > 100) {
      errors.push('Name must be between 1 and 100 characters');
    }

    if (!email) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        errors.push('Please provide a valid email address');
      }
    }

    if (!subject || (typeof subject === 'string' && subject.trim().length === 0)) {
      errors.push('Subject is required');
    } else if (typeof subject !== 'string' || subject.trim().length > 200) {
      errors.push('Subject must be between 1 and 200 characters');
    }

    if (!message || (typeof message === 'string' && message.trim().length === 0)) {
      errors.push('Message is required');
    } else if (typeof message !== 'string' || message.trim().length > 2000) {
      errors.push('Message must be between 1 and 2000 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', '), errors });
    }

    const newMessage = new Message(req.body);
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/messages', requireAdmin, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
