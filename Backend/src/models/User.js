const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  // WebAuthn fields
  webauthnUserId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'webauthn_user_id'
  },
  // Zero-knowledge: server never stores vault keys or plaintext
  keyDerivationSalt: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'key_derivation_salt',
    comment: 'Salt for PBKDF2 key derivation on client'
  },
  vaultVersion: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'vault_version',
    comment: 'Version number for conflict resolution'
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_sync_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true, // Soft delete
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = User;
