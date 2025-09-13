// background/background.js - EXSTAGIUM Extension Background Service Worker

class ExstagiumBackground {
    constructor() {
        this.API_BASE = 'https://temp-backend2.vercel.app';
        
        this.init();
    }

    init() {
        // Extension lifecycle events
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstall(details);
        });

        chrome.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });

        // Message handling between popup and content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Tab updates - detect when user navigates to new pages
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.handleTabUpdate(tabId, tab);
            }
        });

        // Storage changes
        chrome.storage.onChanged.addListener((changes, area) => {
            this.handleStorageChange(changes, area);
        });

        console.log('EXSTAGIUM Background: Service worker initialized');
    }

    async handleInstall(details) {
        if (details.reason === 'install') {
            console.log('EXSTAGIUM: Extension installed');
            
            // Set default settings
            await chrome.storage.local.set({
                settings: {
                    autoFill: true,
                    passwordGeneration: true,
                    breachChecking: true,
                    sessionTimeout: 15 // minutes
                }
            });

            // Show welcome page or setup
            chrome.tabs.create({
                url: chrome.runtime.getURL('popup/welcome.html')
            });
        } else if (details.reason === 'update') {
            console.log('EXSTAGIUM: Extension updated');
        }
    }

    async handleStartup() {
        console.log('EXSTAGIUM: Browser startup');
        
        // Clear any expired sessions
        await this.cleanupExpiredSessions();
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'webauthnLogin':
                    const loginResult = await this.handleWebAuthnLogin(request.email);
                    sendResponse(loginResult);
                    break;

                case 'loadVaultData':
                    const vaultData = await this.loadVaultData(request.token);
                    sendResponse(vaultData);
                    break;

                case 'saveCredential':
                    const saveResult = await this.saveCredential(request.token, request.credential);
                    sendResponse(saveResult);
                    break;

                case 'generatePassword':
                    const password = this.generateSecurePassword(request.options);
                    sendResponse({ password });
                    break;

                case 'checkBreach':
                    const breachResult = await this.checkPasswordBreach(request.token, request.password);
                    sendResponse(breachResult);
                    break;

                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse(settings);
                    break;

                case 'updateSettings':
                    await this.updateSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('EXSTAGIUM Background error:', error);
            sendResponse({ error: error.message });
        }
    }

    async handleTabUpdate(tabId, tab) {
        // Skip non-http(s) URLs
        if (!tab.url.startsWith('http')) return;

        // Check if this is a known login/banking site
        const domain = new URL(tab.url).hostname;
        
        // Update icon badge if user has saved credentials for this site
        const savedCredentials = await this.getCredentialsForDomain(domain);
        if (savedCredentials.length > 0) {
            chrome.action.setBadgeText({
                tabId: tabId,
                text: savedCredentials.length.toString()
            });
            chrome.action.setBadgeBackgroundColor({
                tabId: tabId,
                color: '#4CAF50'
            });
        } else {
            chrome.action.setBadgeText({
                tabId: tabId,
                text: ''
            });
        }
    }

    async handleStorageChange(changes, area) {
        if (area === 'local' && changes.userData) {
            console.log('EXSTAGIUM: User data updated');
        }

        if (area === 'session' && changes.sessionData) {
            console.log('EXSTAGIUM: Session data updated');
        }
    }

async handleWebAuthnLogin(email) {
    try {
        console.log('EXSTAGIUM: Attempting login for:', email);
        
        // Use debug token endpoint instead of login/start
        const response = await fetch(`${this.API_BASE}/api/auth/debug/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        console.log('EXSTAGIUM: Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('EXSTAGIUM: Server error:', errorText);
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('EXSTAGIUM: Token data received:', data);
        
        // Get user data separately
        const userResponse = await fetch(`${this.API_BASE}/api/auth/test-user?email=${encodeURIComponent(email)}`);
        const userData = await userResponse.json();
        
        console.log('EXSTAGIUM: User data received:', userData);
        
        if (userData.found && userData.user) {
            return {
                success: true,
                user: {
                    id: userData.user.id,
                    email: userData.user.email,
                    keyDerivationSalt: 'demo-salt-for-testing' // We'll get real salt later
                },
                token: data.token,
                message: 'Connected to EXSTAGIUM server successfully'
            };
        } else {
            throw new Error('User not found on server');
        }

    } catch (error) {
        console.error('EXSTAGIUM: Login failed:', error);
        return {
            success: false,
            error: `Connection failed: ${error.message}`
        };
    }
}



    async loadVaultData(token) {
        try {
            // Get vault manifest
            const manifestResponse = await fetch(`${this.API_BASE}/api/vault/manifest`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!manifestResponse.ok) {
                throw new Error('Failed to load vault manifest');
            }

            const { manifest } = await manifestResponse.json();
            
            if (manifest.items.length === 0) {
                return { success: true, items: [] };
            }

            // Get encrypted vault items
            const itemIds = manifest.items.map(item => item.id).join(',');
            const itemsResponse = await fetch(
                `${this.API_BASE}/api/vault/items?itemIds=${itemIds}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!itemsResponse.ok) {
                throw new Error('Failed to load vault items');
            }

            const { items } = await itemsResponse.json();

            return {
                success: true,
                items: items,
                manifest: manifest
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async saveCredential(token, credentialData) {
        try {
            const response = await fetch(`${this.API_BASE}/api/vault/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: [credentialData]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save credential');
            }

            const result = await response.json();
            return {
                success: true,
                itemId: result.savedItems[0].id
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

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

        let password = '';
        for (let i = 0; i < settings.length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }

        return password;
    }

    async checkPasswordBreach(token, password) {
        try {
            // Hash password with SHA-1 for HIBP
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-1', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

            const response = await fetch(`${this.API_BASE}/api/breach/check-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ passwordHash })
            });

            if (!response.ok) {
                throw new Error('Failed to check password breach');
            }

            const result = await response.json();
            return {
                success: true,
                isBreached: result.isBreached,
                breachCount: result.breachCount
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getCredentialsForDomain(domain) {
        // Get stored vault data and filter by domain
        // This will be implemented when crypto is added
        return []; // Placeholder
    }

    async getSettings() {
        const result = await chrome.storage.local.get(['settings']);
        return result.settings || {};
    }

    async updateSettings(newSettings) {
        const current = await this.getSettings();
        const updated = { ...current, ...newSettings };
        await chrome.storage.local.set({ settings: updated });
    }

    async cleanupExpiredSessions() {
        const sessionData = await chrome.storage.session.get(['sessionData']);
        if (sessionData.sessionData) {
            const settings = await this.getSettings();
            const timeoutMs = (settings.sessionTimeout || 15) * 60 * 1000;
            const isExpired = Date.now() - sessionData.sessionData.unlockedAt > timeoutMs;
            
            if (isExpired) {
                await chrome.storage.session.clear();
                console.log('EXSTAGIUM: Expired session cleared');
            }
        }
    }
}

// Initialize background service worker
new ExstagiumBackground();
