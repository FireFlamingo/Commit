// lib/crypto.js - EXSTAGIUM Extension Cryptography Functions

class ExstagiumCrypto {
    constructor() {
        this.CRYPTO_CONFIG = {
            iterations: 310000,        // PBKDF2 iterations (matching your website)
            keyLength: 256,           // AES-256
            ivLength: 12,             // AES-GCM IV length
            hashAlgorithm: 'SHA-256'
        };
    }

    /**
     * Derive vault key from master password + server salt
     * This matches your website crypto.ts implementation
     */
    async deriveVaultKey(masterPassword, serverSaltHex) {
        try {
            const encoder = new TextEncoder();
            const saltBuffer = this.hexToArrayBuffer(serverSaltHex);
            
            // Import master password as key material
            const passwordKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(masterPassword),
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );
            
            // Derive AES-256 key using PBKDF2
            const vaultKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: this.CRYPTO_CONFIG.iterations,
                    hash: this.CRYPTO_CONFIG.hashAlgorithm
                },
                passwordKey,
                {
                    name: 'AES-GCM',
                    length: this.CRYPTO_CONFIG.keyLength
                },
                false, // Not extractable for security
                ['encrypt', 'decrypt']
            );
            
            return vaultKey;
        } catch (error) {
            console.error('Key derivation failed:', error);
            throw new Error('Failed to derive vault key');
        }
    }

    /**
     * Encrypt vault data for server storage
     */
    async encryptVaultData(vaultKey, data) {
        try {
            const encoder = new TextEncoder();
            const iv = crypto.getRandomValues(new Uint8Array(this.CRYPTO_CONFIG.ivLength));
            
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                vaultKey,
                encoder.encode(JSON.stringify(data))
            );
            
            return {
                encryptedData: this.arrayBufferToHex(encryptedData),
                iv: this.arrayBufferToHex(iv),
                authTag: '' // AES-GCM includes auth tag in encryptedData
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt vault data from server
     */
    async decryptVaultData(vaultKey, encryptedData, iv) {
        try {
            const encryptedBuffer = this.hexToArrayBuffer(encryptedData);
            const ivBuffer = this.hexToArrayBuffer(iv);
            
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivBuffer
                },
                vaultKey,
                encryptedBuffer
            );
            
            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decryptedBuffer);
            
            return JSON.parse(decryptedText);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data - wrong password or corrupted data');
        }
    }

    /**
     * Create encrypted vault item for server
     */
    async createVaultItem(vaultKey, itemData, itemType = 'credential') {
        try {
            // Encrypt main data
            const encrypted = await this.encryptVaultData(vaultKey, itemData);
            
            // Encrypt searchable metadata
            const metadata = {
                title: itemData.title || '',
                website: itemData.website || '',
                username: itemData.username || ''
            };
            const encryptedMeta = await this.encryptVaultData(vaultKey, metadata);
            
            return {
                encryptedData: encrypted.encryptedData,
                iv: encrypted.iv,
                authTag: encrypted.authTag,
                type: itemType,
                encryptedMetadata: encryptedMeta.encryptedData,
                version: 1
            };
        } catch (error) {
            console.error('Failed to create vault item:', error);
            throw new Error('Failed to create encrypted vault item');
        }
    }

    /**
     * Hash password for breach checking (SHA-1 for HIBP compatibility)
     */
    async hashPasswordForBreach(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-1', data);
            return this.arrayBufferToHex(hashBuffer).toUpperCase();
        } catch (error) {
            console.error('Password hashing failed:', error);
            throw new Error('Failed to hash password');
        }
    }

    /**
     * Secure password generation
     */
    generateSecurePassword(options = {}) {
        const defaults = {
            length: 16,
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSymbols: true,
            excludeSimilar: true
        };

        const settings = { ...defaults, ...options };

        let charset = '';
        if (settings.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (settings.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (settings.includeNumbers) charset += '0123456789';
        if (settings.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (settings.excludeSimilar) {
            charset = charset.replace(/[0O1lI]/g, '');
        }

        // Use crypto.getRandomValues for cryptographically secure randomness
        const randomArray = new Uint8Array(settings.length);
        crypto.getRandomValues(randomArray);

        let password = '';
        for (let i = 0; i < settings.length; i++) {
            const randomIndex = randomArray[i] % charset.length;
            password += charset[randomIndex];
        }

        return password;
    }

    /**
     * Extract domain from URL for credential matching
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.toLowerCase();
        } catch (error) {
            return url.toLowerCase();
        }
    }

    /**
     * Check if two domains match (including subdomains)
     */
    domainsMatch(domain1, domain2) {
        const normalize = (domain) => {
            // Remove www. prefix
            return domain.replace(/^www\./, '');
        };

        const norm1 = normalize(domain1);
        const norm2 = normalize(domain2);

        // Exact match
        if (norm1 === norm2) return true;

        // Subdomain match
        return norm1.endsWith('.' + norm2) || norm2.endsWith('.' + norm1);
    }

    /**
     * Securely clear sensitive data from memory
     */
    secureClear(sensitiveString) {
        // In JavaScript, we can't truly clear memory, but we can overwrite
        if (typeof sensitiveString === 'string') {
            return ''.padStart(sensitiveString.length, '0');
        }
    }

    // Helper functions for hex/buffer conversion
    arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    hexToArrayBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes.buffer;
    }

    /**
     * Validate master password strength
     */
    validateMasterPassword(password) {
        const minLength = 12;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

        const score = [
            password.length >= minLength,
            hasUppercase,
            hasLowercase, 
            hasNumbers,
            hasSymbols
        ].filter(Boolean).length;

        return {
            isValid: score >= 4 && password.length >= minLength,
            score: score,
            feedback: this.getPasswordFeedback(password, {
                minLength,
                hasUppercase,
                hasLowercase,
                hasNumbers,
                hasSymbols
            })
        };
    }

    getPasswordFeedback(password, checks) {
        const feedback = [];
        
        if (password.length < checks.minLength) {
            feedback.push(`At least ${checks.minLength} characters required`);
        }
        if (!checks.hasUppercase) {
            feedback.push('Add uppercase letters');
        }
        if (!checks.hasLowercase) {
            feedback.push('Add lowercase letters');
        }
        if (!checks.hasNumbers) {
            feedback.push('Add numbers');
        }
        if (!checks.hasSymbols) {
            feedback.push('Add symbols');
        }

        return feedback;
    }
}

// Export singleton instance for use across extension
const exstagiumCrypto = new ExstagiumCrypto();

// Make available globally for extension scripts
if (typeof window !== 'undefined') {
    window.ExstagiumCrypto = exstagiumCrypto;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = exstagiumCrypto;
}
