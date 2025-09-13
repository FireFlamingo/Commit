const express = require('express');
const { authenticateToken } = require('../controllers/vaultController');
const crypto = require('crypto');

const router = express.Router();

// Apply authentication to all breach routes
router.use(authenticateToken);

// Check password against HIBP (k-anonymity)
router.post('/check-password', async (req, res) => {
  try {
    const { passwordHash } = req.body;

    if (!passwordHash) {
      return res.status(400).json({ error: 'passwordHash is required' });
    }

    // Take first 5 characters of SHA-1 hash for k-anonymity
    const prefix = passwordHash.substring(0, 5).toUpperCase();
    const suffix = passwordHash.substring(5).toUpperCase();

    // Make request to HIBP API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    
    if (!response.ok) {
      throw new Error('HIBP API request failed');
    }

    const data = await response.text();
    const lines = data.split('\n');
    
    // Check if our hash suffix appears in the results
    let isBreached = false;
    let breachCount = 0;

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        isBreached = true;
        breachCount = parseInt(count);
        break;
      }
    }

    res.json({
      isBreached,
      breachCount: isBreached ? breachCount : 0,
      checkedAt: new Date(),
      method: 'k-anonymity'
    });

  } catch (error) {
    console.error('Password breach check error:', error);
    res.status(500).json({ error: 'Failed to check password breach status' });
  }
});

// Health check for breach routes
router.get('/health', (req, res) => {
  res.json({ 
    message: 'Breach monitoring routes working!',
    user: req.user 
  });
});

module.exports = router;
