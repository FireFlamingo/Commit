const { VaultItem, User } = require('../models');
const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get vault manifest (list of items with metadata)
const getVaultManifest = async (req, res) => {
  try {
    const items = await VaultItem.findAll({
      where: { userId: req.user.userId },
      attributes: ['id', 'itemType', 'version', 'created_at', 'updated_at'], // Use underscored names
      order: [['updated_at', 'DESC']]
    });

    const user = await User.findByPk(req.user.userId, {
      attributes: ['vault_version', 'last_sync_at'] // Use underscored names
    });

    res.json({
      manifest: {
        items: items.map(item => ({
          id: item.id,
          type: item.itemType,
          version: item.version,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })),
        vaultVersion: user.vault_version,
        lastSyncAt: user.last_sync_at,
        totalItems: items.length
      }
    });

  } catch (error) {
    console.error('Get manifest error:', error);
    res.status(500).json({ error: 'Failed to fetch vault manifest' });
  }
};


// Get specific vault items by IDs
const getVaultItems = async (req, res) => {
  try {
    const { itemIds } = req.query;
    
    if (!itemIds) {
      return res.status(400).json({ error: 'itemIds query parameter required' });
    }

    const ids = Array.isArray(itemIds) ? itemIds : itemIds.split(',');

    const items = await VaultItem.findAll({
      where: { 
        userId: req.user.userId,
        id: ids
      },
      attributes: ['id', 'encryptedData', 'iv', 'authTag', 'itemType', 'version', 'encryptedMetadata', 'updatedAt']
    });

    res.json({
      items: items.map(item => ({
        id: item.id,
        encryptedData: item.encryptedData,
        iv: item.iv,
        authTag: item.authTag,
        type: item.itemType,
        version: item.version,
        encryptedMetadata: item.encryptedMetadata,
        updatedAt: item.updatedAt
      }))
    });

  } catch (error) {
    console.error('Get vault items error:', error);
    res.status(500).json({ error: 'Failed to fetch vault items' });
  }
};

// Save/update vault items (batch operation)
const saveVaultItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const savedItems = [];
    const errors = [];

    for (const itemData of items) {
      try {
        const { id, encryptedData, iv, authTag, type, encryptedMetadata } = itemData;

        if (!encryptedData || !iv || !authTag || !type) {
          errors.push({ id, error: 'Missing required fields' });
          continue;
        }

        // Upsert item (update if exists, create if not)
        const [item, created] = await VaultItem.upsert({
          id: id || undefined, // Let DB generate if not provided
          userId: req.user.userId,
          encryptedData,
          iv,
          authTag,
          itemType: type,
          encryptedMetadata: encryptedMetadata || null,
          version: itemData.version || 1
        }, {
          returning: true
        });

        savedItems.push({
          id: item.id,
          version: item.version,
          created,
          updatedAt: item.updatedAt
        });

      } catch (itemError) {
        console.error('Item save error:', itemError);
        errors.push({ 
          id: itemData.id, 
          error: 'Failed to save item' 
        });
      }
    }

    // Update user's vault version and last sync time
    await User.update({
      vaultVersion: req.body.vaultVersion || Date.now(),
      lastSyncAt: new Date()
    }, {
      where: { id: req.user.userId }
    });

    res.json({
      success: true,
      savedItems,
      errors: errors.length > 0 ? errors : undefined,
      totalSaved: savedItems.length,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('Save vault items error:', error);
    res.status(500).json({ error: 'Failed to save vault items' });
  }
};

// Delete vault items
const deleteVaultItems = async (req, res) => {
  try {
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'itemIds array is required' });
    }

    const deletedCount = await VaultItem.destroy({
      where: {
        userId: req.user.userId,
        id: itemIds
      }
    });

    // Update user's vault version
    await User.update({
      vaultVersion: Date.now(),
      lastSyncAt: new Date()
    }, {
      where: { id: req.user.userId }
    });

    res.json({
      success: true,
      deletedCount,
      deletedIds: itemIds.slice(0, deletedCount)
    });

  } catch (error) {
    console.error('Delete vault items error:', error);
    res.status(500).json({ error: 'Failed to delete vault items' });
  }
};

module.exports = {
  authenticateToken,
  getVaultManifest,
  getVaultItems,
  saveVaultItems,
  deleteVaultItems
};
