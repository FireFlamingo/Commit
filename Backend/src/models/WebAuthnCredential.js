const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WebAuthnCredential = sequelize.define('WebAuthnCredential', {
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
  credentialId: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    field: 'credential_id',
    comment: 'Base64URL encoded credential ID'
  },
  publicKey: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'public_key',
    comment: 'Base64URL encoded public key'
  },
  counter: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: 'Signature counter for replay attack prevention'
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'device_name',
    comment: 'User-friendly device name'
  },
  aaguid: {
    type: DataTypes.STRING(36),
    allowNull: true,
    comment: 'Authenticator attestation GUID'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_used_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'webauthn_credentials',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = WebAuthnCredential;
