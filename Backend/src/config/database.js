const { Sequelize } = require('sequelize');

// Use SQLite for development
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite Database connected successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
  }
};

module.exports = { sequelize, testConnection };
