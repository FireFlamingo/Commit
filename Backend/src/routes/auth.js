const express = require('express');
const { User } = require('../models');

const router = express.Router();

// Import controller functions
const authController = require('../controllers/authController');

// WebAuthn Registration Routes
router.post('/register/start', authController.startRegistration);
router.post('/register/verify', authController.verifyRegistration);

// WebAuthn Authentication Routes  
router.post('/login/start', authController.startAuthentication);
router.post('/login/verify', authController.verifyAuthentication);

// Test route to check if user exists
router.get('/test-user', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'webauthn_user_id', 'created_at'] // Use underscored names
    });
    
    if (user) {
      res.json({ 
        found: true, 
        user: {
          id: user.id,
          email: user.email,
          webauthnUserId: user.webauthn_user_id,
          createdAt: user.created_at
        }
      });
    } else {
      res.json({ found: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug route - list all users
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'webauthn_user_id', 'created_at'] // Use underscored names
    });
    
    res.json({
      totalUsers: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        webauthnUserId: user.webauthn_user_id,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// Test route - generate a test JWT token
router.post('/debug/token', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Health check for auth routes
router.get('/health', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

module.exports = router;
