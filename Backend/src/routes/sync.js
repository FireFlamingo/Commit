const express = require('express');
const { authenticateToken } = require('../controllers/vaultController');
const { getSyncStatus, performDeltaSync } = require('../controllers/syncController');

const router = express.Router();

// Apply authentication to all sync routes
router.use(authenticateToken);

// Sync routes
router.get('/status', getSyncStatus);
router.get('/delta', performDeltaSync);

// Health check for sync routes
router.get('/health', (req, res) => {
  res.json({ 
    message: 'Sync routes working!',
    user: req.user 
  });
});

module.exports = router;
