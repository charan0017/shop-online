import { Router } from 'express';
import jwt from 'jsonwebtoken';

import { JWT_SECRET } from './config.js';
import { User } from './models.js';
import { products } from './data.js';
import { authenticateToken } from './middlewares.js';

const router = Router();

// Public routes
router.get('/products', (req, res) => {
  res.json({
    status: true,
    products,
  });
});

router.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  const product = products.find((product) => product.id === productId);
  if (!product) {
    return res.status(404).json({
      status: false,
      message: 'Product not found'
    });
  }
  res.json({
    status: true,
    product,
  });
})

router.post('/signup', async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({
      status: false,
      message: 'Missing required fields',
    });
  }

  try {
    // Create user
    const user = await User.create({
      email,
      name,
      password,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      status: true,
      message: 'User created successfully',
      token,
    });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({
        status: false,
        message: 'Email already exists'
      });
    }
    res.status(500).json({
      status: false,
      message: 'Error creating user'
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: false,
      message: 'Email and password are required'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      status: true,
      message: 'Login successful',
      token
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error during login'
    });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({
      status: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error fetching user profile'
    });
  }
});

// Cart routes
router.get('/cart', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({
      status: true,
      cart: user.cart
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error fetching cart'
    });
  }
});

router.patch('/cart', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({
      status: false,
      message: 'Product ID is required'
    });
  }

  try {
    const user = await User.findById(req.user.userId);
    const existingProductIndex = user.cart.findIndex(item => item.productId === productId);

    if (existingProductIndex > -1) {
      // Update existing product quantity
      if (quantity <= 0) {
        // Remove product if quantity is 0 or negative
        user.cart.splice(existingProductIndex, 1);
      } else {
        user.cart[existingProductIndex].quantity = quantity;
      }
    } else if (quantity > 0) {
      // Add new product to cart
      user.cart.push({ productId, quantity });
    }

    await user.save();

    res.json({
      status: true,
      message: 'Cart updated successfully',
      cart: user.cart
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: false,
        message: 'Invalid product ID'
      });
    }
    res.status(500).json({
      status: false,
      message: 'Error updating cart'
    });
  }
});

router.delete('/cart', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.cart = [];
    await user.save();

    res.json({
      status: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error clearing cart'
    });
  }
});

export default router;
