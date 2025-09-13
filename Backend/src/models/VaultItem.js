const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VaultItem = sequelize.define('VaultItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Zero-knowledge: All data is encrypted client-side
  encryptedData: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    field: 'encrypted_data',
    comment: 'Client-side encrypted item data (JSON)'
  },
  iv: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: 'Initialization vector for encryption'
  },
  authTag: {
    type: DataTypes.STRING(32),
    allowNull: false,
    field: 'auth_tag',
    comment: 'Authentication tag for AES-GCM'
  },
  itemType: {
    type: DataTypes.ENUM('credential', 'note', 'totp', 'attachment'),
    allowNull: false,
    field: 'item_type'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Version for conflict resolution'
  },
  // Encrypted metadata for search (optional)
  encryptedMetadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'encrypted_metadata',
    comment: 'Encrypted searchable metadata'
  }
}, {
  tableName: 'vault_items',
  timestamps: true,
  paranoid: true, // Soft delete
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = VaultItem;
