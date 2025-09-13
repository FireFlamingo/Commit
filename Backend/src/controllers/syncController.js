const { VaultItem, User } = require('../models');

// Get sync status and conflicts
const getSyncStatus = async (req, res) => {
  try {
    const { lastSyncVersion } = req.query;

    const user = await User.findByPk(req.user.userId, {
      attributes: ['vaultVersion', 'lastSyncAt']
    });

    const totalItems = await VaultItem.count({
      where: { userId: req.user.userId }
    });

    // Get items modified since last sync
    let modifiedItems = [];
    if (lastSyncVersion) {
      modifiedItems = await VaultItem.findAll({
        where: {
          userId: req.user.userId,
          version: {
            [require('sequelize').Op.gt]: parseInt(lastSyncVersion)
          }
        },
        attributes: ['id', 'version', 'updatedAt'],
        order: [['updatedAt', 'DESC']]
      });
    }

    res.json({
      currentVersion: user.vaultVersion,
      lastSyncAt: user.lastSyncAt,
      totalItems,
      modifiedItems: modifiedItems.map(item => ({
        id: item.id,
        version: item.version,
        updatedAt: item.updatedAt
      })),
      hasChanges: modifiedItems.length > 0,
      needsSync: !lastSyncVersion || modifiedItems.length > 0
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
};

// Perform delta sync (get changes since last sync)
const performDeltaSync = async (req, res) => {
  try {
    const { since } = req.query;

    if (!since) {
      return res.status(400).json({ error: 'since parameter required' });
    }

    const sinceDate = new Date(since);
    
    // Get all items modified since the specified date
    const modifiedItems = await VaultItem.findAll({
      where: {
        userId: req.user.userId,
        updatedAt: {
          [require('sequelize').Op.gt]: sinceDate
        }
      },
      order: [['updatedAt', 'ASC']]
    });

    const user = await User.findByPk(req.user.userId, {
      attributes: ['vaultVersion', 'lastSyncAt']
    });

    res.json({
      items: modifiedItems.map(item => ({
        id: item.id,
        encryptedData: item.encryptedData,
        iv: item.iv,
        authTag: item.authTag,
        type: item.itemType,
        version: item.version,
        encryptedMetadata: item.encryptedMetadata,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt
      })),
      syncTimestamp: new Date(),
      vaultVersion: user.vaultVersion,
      totalItems: modifiedItems.length
    });

  } catch (error) {
    console.error('Delta sync error:', error);
    res.status(500).json({ error: 'Failed to perform delta sync' });
  }
};

module.exports = {
  getSyncStatus,
  performDeltaSync
};
