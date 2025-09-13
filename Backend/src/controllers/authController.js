const { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, WebAuthnCredential } = require('../models');

// WebAuthn configuration
const rpName = process.env.RP_NAME || 'EXSTAGIUM';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.RP_ORIGIN || 'http://localhost:3000';

// Registration: Start WebAuthn registration
const startRegistration = async (req, res) => {
  try {
    console.log('🔧 Starting registration for:', req.body);
    
    const { email } = req.body;

    if (!email) {
      console.error('❌ No email provided');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('🔧 Checking if user exists:', email);

    // Check if user already exists
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('🔧 Creating new user');
      // Create new user
      const webauthnUserId = crypto.randomBytes(32).toString('hex');
      const keyDerivationSalt = crypto.randomBytes(32).toString('hex');
      
      user = await User.create({
        email,
        webauthnUserId,
        keyDerivationSalt
      });
      console.log('✅ User created:', user.id);
    } else {
      console.log('🔧 User already exists:', user.id);
    }

    // Get existing credentials for this user
    const userCredentials = await WebAuthnCredential.findAll({
      where: { userId: user.id }
    });
    console.log('🔧 Found credentials:', userCredentials.length);

    const excludeCredentials = userCredentials.map(cred => ({
      id: Buffer.from(cred.credentialId, 'base64url'),
      type: 'public-key',
      transports: ['internal', 'cross-platform']
    }));

    console.log('🔧 Generating WebAuthn options...');

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(user.webauthnUserId, 'hex'), // Convert hex string to Buffer
      userName: user.email,
      userDisplayName: user.email.split('@')[0],
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'preferred'
      },
    });

    console.log('✅ WebAuthn options generated');

    // Store challenge in session
    req.session = req.session || {};
    req.session.challenge = options.challenge;
    req.session.userId = user.id;

    res.json({
      options,
      user: {
        id: user.id,
        email: user.email,
        keyDerivationSalt: user.keyDerivationSalt
      }
    });

  } catch (error) {
    console.error('💥 Registration start error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Registration: Verify WebAuthn registration
const verifyRegistration = async (req, res) => {
  try {
    const { credential, userId } = req.body;

    if (!credential || !userId) {
      return res.status(400).json({ error: 'Credential and userId required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get challenge from session
    const expectedChallenge = req.session?.challenge;
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'No challenge found in session' });
    }

    // Verify the registration
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      // Save credential to database
      await WebAuthnCredential.create({
        userId: user.id,
        credentialId: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        deviceName: req.body.deviceName || 'Unknown Device'
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Clear session
      delete req.session?.challenge;

      res.json({
        verified: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          keyDerivationSalt: user.keyDerivationSalt
        }
      });
    } else {
      res.status(400).json({ 
        error: 'Verification failed',
        verified: false 
      });
    }

  } catch (error) {
    console.error('Registration verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Login: Start WebAuthn authentication
const startAuthentication = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's credentials
    const userCredentials = await WebAuthnCredential.findAll({
      where: { 
        userId: user.id,
        isActive: true 
      }
    });

    if (userCredentials.length === 0) {
      return res.status(400).json({ error: 'No credentials registered for this user' });
    }

    const allowCredentials = userCredentials.map(cred => ({
      id: Buffer.from(cred.credentialId, 'base64url'),
      type: 'public-key',
      transports: ['internal', 'cross-platform']
    }));

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Store challenge in session
    req.session.challenge = options.challenge;
    req.session.userId = user.id;

    res.json({
      options,
      user: {
        id: user.id,
        email: user.email,
        keyDerivationSalt: user.keyDerivationSalt
      }
    });

  } catch (error) {
    console.error('Authentication start error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Login: Verify WebAuthn authentication
const verifyAuthentication = async (req, res) => {
  try {
    const { credential, userId } = req.body;

    if (!credential || !userId) {
      return res.status(400).json({ error: 'Credential and userId required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the credential from database
    const dbCredential = await WebAuthnCredential.findOne({
      where: { 
        credentialId: Buffer.from(credential.rawId, 'base64url').toString('base64url'),
        userId: user.id,
        isActive: true
      }
    });

    if (!dbCredential) {
      return res.status(400).json({ error: 'Credential not found' });
    }

    // Get challenge from session
    const expectedChallenge = req.session?.challenge;
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'No challenge found in session' });
    }

    // Verify the authentication
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(dbCredential.credentialId, 'base64url'),
        credentialPublicKey: Buffer.from(dbCredential.publicKey, 'base64url'),
        counter: dbCredential.counter
      }
    });

    if (verification.verified) {
      // Update credential counter
      await WebAuthnCredential.update({
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date()
      }, {
        where: { id: dbCredential.id }
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Clear session
      delete req.session?.challenge;

      res.json({
        verified: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          keyDerivationSalt: user.keyDerivationSalt
        }
      });
    } else {
      res.status(400).json({ 
        error: 'Authentication failed',
        verified: false 
      });
    }

  } catch (error) {
    console.error('Authentication verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

module.exports = {
  startRegistration,
  verifyRegistration,
  startAuthentication,
  verifyAuthentication
};
