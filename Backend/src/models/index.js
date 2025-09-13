const { sequelize, testConnection } = require('../config/database');
const User = require('./User');
const WebAuthnCredential = require('./WebAuthnCredential');
const VaultItem = require('./VaultItem');

// Define associations
User.hasMany(WebAuthnCredential, { 
  foreignKey: 'userId', 
  as: 'credentials',
  onDelete: 'CASCADE'
});
WebAuthnCredential.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

User.hasMany(VaultItem, { 
  foreignKey: 'userId', 
  as: 'vaultItems',
  onDelete: 'CASCADE'
});
VaultItem.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Database ${force ? 'recreated' : 'synced'} successfully`);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  User,
  WebAuthnCredential,
  VaultItem
};
