const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');

// Import routes
const authRoutes = require('./src/routes/auth');
const vaultRoutes = require('./src/routes/vault');
const syncRoutes = require('./src/routes/sync');
const breachRoutes = require('./src/routes/breach');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true // Important for sessions
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Session middleware (for WebAuthn challenges)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60 * 1000 // 5 minutes for WebAuthn challenges
  }
}));

// Initialize database
const initDatabase = async () => {
  try {
    const { testConnection, syncDatabase } = require('./src/models');
    await testConnection();
    await syncDatabase(process.env.DB_FORCE_SYNC === 'true');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

initDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'EXSTAGIUM Server is running!' });
});

// Database test route
app.get('/api/db-test', async (req, res) => {
  try {
    const { sequelize } = require('./src/models');
    await sequelize.authenticate();
    res.json({ message: 'Database connection successful!' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/breach', breachRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Global error:', err);
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

module.exports = app;
