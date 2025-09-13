const express = require('express');
const { 
  authenticateToken,
  getVaultManifest,
  getVaultItems,
  saveVaultItems,
  deleteVaultItems
} = require('../controllers/vaultController');

const router = express.Router();

// Apply authentication to all vault routes
router.use(authenticateToken);

// Vault routes
router.get('/manifest', getVaultManifest);
router.get('/items', getVaultItems);
router.post('/items', saveVaultItems);
router.delete('/items', deleteVaultItems);

// Health check for vault routes
router.get('/health', (req, res) => {
  res.json({ 
    message: 'Vault routes working!',
    user: req.user 
  });
});

module.exports = router;
