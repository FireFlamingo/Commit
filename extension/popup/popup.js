// popup/popup.js - EXSTAGIUM Extension Popup Logic (Corrected Flow)

class ExstagiumPopup {
    constructor() {
        this.isLoggedIntoExstagium = false;
        this.isVaultUnlocked = false;
        this.currentTab = null;
        this.vaultKey = null;
        this.userToken = null;
        this.userData = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.checkInitialState();
    }

    initializeElements() {
        // States
        this.exstagiumLoginState = document.getElementById('exstagium-login-state');
        this.vaultLockedState = document.getElementById('vault-locked-state');
        this.vaultUnlockedState = document.getElementById('vault-unlocked-state');
        
        // EXSTAGIUM Login elements
        this.exstagiumEmail = document.getElementById('exstagium-email');
        this.exstagiumLoginBtn = document.getElementById('exstagium-login-btn');
        this.exstagiumLoginStatus = document.getElementById('exstagium-login-status');
        
        // Vault Unlock elements
        this.masterPassword = document.getElementById('master-password');
        this.unlockVaultBtn = document.getElementById('unlock-vault-btn');
        this.unlockStatus = document.getElementById('unlock-status');
        this.loggedUser = document.getElementById('logged-user');
        
        // Main Extension elements
        this.lockVaultBtn = document.getElementById('lock-vault-btn');
        this.currentSite = document.getElementById('current-site');
        this.newWebsiteSection = document.getElementById('new-website-section');
        this.existingWebsiteSection = document.getElementById('existing-website-section');
        this.suggestPasswordBtn = document.getElementById('suggest-password-btn');
        this.autofillLoginBtn = document.getElementById('autofill-login-btn');
        this.viewAllPasswordsBtn = document.getElementById('view-all-passwords-btn');
        this.credentialPreview = document.getElementById('credential-preview');
        this.pageInfo = document.getElementById('page-info');
        this.mainStatus = document.getElementById('main-status');
    }

    attachEventListeners() {
        // EXSTAGIUM Login events
        this.exstagiumLoginBtn.addEventListener('click', () => this.handleExstagiumLogin());
        this.exstagiumEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleExstagiumLogin();
        });
        
        // Vault Unlock events
        this.unlockVaultBtn.addEventListener('click', () => this.handleVaultUnlock());
        this.masterPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleVaultUnlock();
        });
        
        // Main Extension events
        this.lockVaultBtn.addEventListener('click', () => this.handleVaultLock());
        this.suggestPasswordBtn.addEventListener('click', () => this.handleSuggestPassword());
        this.autofillLoginBtn.addEventListener('click', () => this.handleAutofillLogin());
        this.viewAllPasswordsBtn.addEventListener('click', () => this.handleViewAllPasswords());
    }

    async checkInitialState() {
        // Get current tab
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
        } catch (error) {
            console.error('Failed to get current tab:', error);
        }

        // Check EXSTAGIUM login status
        const userData = await this.getStoredUserData();
        if (!userData || !userData.token) {
            // Not logged into EXSTAGIUM
            this.showExstagiumLoginState();
            return;
        }

        // Logged into EXSTAGIUM
        this.isLoggedIntoExstagium = true;
        this.userData = userData;
        this.userToken = userData.token;
        
        // Check vault unlock status
        const sessionData = await this.getSessionData();
        if (sessionData && sessionData.isVaultUnlocked) {
            // Vault is unlocked
            this.isVaultUnlocked = true;
            this.vaultKey = sessionData.vaultKey;
            this.showVaultUnlockedState();
            await this.analyzeCurrentWebsite();
        } else {
            // Vault is locked
            this.showVaultLockedState();
        }
    }

    showExstagiumLoginState() {
        this.hideAllStates();
        this.exstagiumLoginState.classList.add('active');
        this.exstagiumEmail.focus();
    }

    showVaultLockedState() {
        this.hideAllStates();
        this.vaultLockedState.classList.add('active');
        this.loggedUser.textContent = `Logged in as: ${this.userData?.email || 'Unknown'}`;
        this.masterPassword.focus();
    }

    showVaultUnlockedState() {
        this.hideAllStates();
        this.vaultUnlockedState.classList.add('active');
        this.updateCurrentSiteDisplay();
    }

    hideAllStates() {
        this.exstagiumLoginState.classList.remove('active');
        this.vaultLockedState.classList.remove('active');
        this.vaultUnlockedState.classList.remove('active');
    }

   async handleExstagiumLogin() {
    const email = this.exstagiumEmail.value.trim();
    
    if (!email) {
        this.showStatus(this.exstagiumLoginStatus, 'Please enter your email', 'error');
        return;
    }

    this.showStatus(this.exstagiumLoginStatus, 'Connecting to EXSTAGIUM server...', 'loading');
    this.exstagiumLoginBtn.disabled = true;

    try {
        // Send message to background script for server authentication
        const response = await chrome.runtime.sendMessage({
            action: 'webauthnLogin',
            email: email
        });

        if (response.success) {
            this.showStatus(this.exstagiumLoginStatus, response.message || 'Login successful!', 'success');
            
            // Store real user data from server
            await this.setStoredUserData({
                email: email,
                token: 'temp-token-' + Date.now(), // Will be real JWT later
                keyDerivationSalt: response.user.keyDerivationSalt,
                userId: response.user.id
            });
            
            setTimeout(() => {
                this.isLoggedIntoExstagium = true;
                this.userData = response.user;
                this.showVaultLockedState();
            }, 1000);

        } else {
            this.showStatus(this.exstagiumLoginStatus, response.error, 'error');
        }

    } catch (error) {
        console.error('EXSTAGIUM login failed:', error);
        this.showStatus(this.exstagiumLoginStatus, 'Connection failed. Check if server is running.', 'error');
    } finally {
        this.exstagiumLoginBtn.disabled = false;
    }
}

    async handleVaultUnlock() {
        const masterPassword = this.masterPassword.value.trim();
        
        if (!masterPassword) {
            this.showStatus(this.unlockStatus, 'Please enter your master password', 'error');
            return;
        }

        this.showStatus(this.unlockStatus, 'Deriving vault key...', 'loading');
        this.unlockVaultBtn.disabled = true;

        try {
            const userData = await this.getStoredUserData();
            if (!userData || !userData.keyDerivationSalt) {
                throw new Error('User data not found. Please login again.');
            }

            // Derive vault key using crypto functions
            this.vaultKey = await window.ExstagiumCrypto.deriveVaultKey(
                masterPassword, 
                userData.keyDerivationSalt
            );
            
            // Store session data
            await this.setSessionData({
                isVaultUnlocked: true,
                vaultKey: this.vaultKey, // Note: This is not secure long-term
                unlockedAt: Date.now()
            });

            this.isVaultUnlocked = true;
            this.showVaultUnlockedState();
            await this.analyzeCurrentWebsite();
            
            this.showStatus(this.unlockStatus, 'Vault unlocked successfully!', 'success');

        } catch (error) {
            console.error('Vault unlock failed:', error);
            this.showStatus(this.unlockStatus, 'Incorrect master password or crypto error', 'error');
        } finally {
            this.unlockVaultBtn.disabled = false;
            this.masterPassword.value = '';
        }
    }

    async handleVaultLock() {
        this.isVaultUnlocked = false;
        this.vaultKey = null;
        
        // Clear session
        await chrome.storage.session.clear();
        
        this.showVaultLockedState();
        this.showStatus(this.unlockStatus, 'Vault locked', 'success');
    }

    async analyzeCurrentWebsite() {
        if (!this.currentTab || !this.currentTab.url.startsWith('http')) {
            this.pageInfo.textContent = 'Cannot analyze this page';
            return;
        }

        this.showStatus(this.mainStatus, 'Analyzing website...', 'loading');
        
        try {
            const domain = window.ExstagiumCrypto.extractDomain(this.currentTab.url);
            
            // Check if we have saved credentials for this domain
            const hasCredentials = await this.checkSavedCredentials(domain);
            
            if (hasCredentials) {
                // Show existing website section
                this.showExistingWebsiteSection(hasCredentials);
            } else {
                // Show new website section
                this.showNewWebsiteSection(domain);
            }
            
            // Detect forms on the page
            await this.detectPageForms();
            
        } catch (error) {
            console.error('Website analysis failed:', error);
            this.pageInfo.textContent = 'Analysis failed';
        }
    }

    async checkSavedCredentials(domain) {
        // This will query the server for saved credentials for this domain
        // For now, return demo data
        const demoCredentials = {
            username: 'demo@example.com',
            website: domain,
            lastUsed: new Date().toISOString()
        };
        
        // Simulate: return credentials if domain contains 'github' or 'gmail'
        if (domain.includes('github') || domain.includes('gmail')) {
            return demoCredentials;
        }
        
        return null;
    }

    showExistingWebsiteSection(credentials) {
        this.newWebsiteSection.style.display = 'none';
        this.existingWebsiteSection.style.display = 'block';
        
        this.credentialPreview.textContent = `Username: ${credentials.username}`;
        this.autofillLoginBtn.disabled = false;
        
        this.pageInfo.textContent = '🔑 Saved credentials found for this website';
    }

    showNewWebsiteSection(domain) {
        this.existingWebsiteSection.style.display = 'none';
        this.newWebsiteSection.style.display = 'block';
        
        this.suggestPasswordBtn.disabled = false;
        
        this.pageInfo.textContent = `🆕 New website: ${domain}`;
    }

    async detectPageForms() {
        if (!this.currentTab) return;

        try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'detectForms'
            });

            if (response && response.forms) {
                const hasLogin = response.forms.login && response.forms.login.length > 0;
                const hasRegister = response.forms.register && response.forms.register.length > 0;
                
                let formInfo = '';
                if (hasLogin && hasRegister) {
                    formInfo = ' • Login and registration forms detected';
                } else if (hasLogin) {
                    formInfo = ' • Login form detected';
                } else if (hasRegister) {
                    formInfo = ' • Registration form detected';
                }
                
                this.pageInfo.textContent += formInfo;
            }
        } catch (error) {
            console.error('Form detection failed:', error);
        }
    }

    async handleSuggestPassword() {
        this.showStatus(this.mainStatus, 'Generating secure password...', 'loading');
        
        try {
            // Generate secure password
            const password = window.ExstagiumCrypto.generateSecurePassword({
                length: 16,
                includeSymbols: true
            });
            
            // Send to content script to fill form
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'generatePassword',
                password: password
            });
            
            this.showStatus(this.mainStatus, 'Password generated and filled!', 'success');
            
            // TODO: Save to server when user submits form
            
        } catch (error) {
            console.error('Password generation failed:', error);
            this.showStatus(this.mainStatus, 'Failed to generate password', 'error');
        }
    }

    async handleAutofillLogin() {
        this.showStatus(this.mainStatus, 'Auto-filling login...', 'loading');
        
        try {
            // TODO: Get actual credentials from server
            const credentials = {
                username: 'demo@example.com',
                password: 'demo-password'
            };
            
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'fillLogin',
                credentials: credentials
            });
            
            this.showStatus(this.mainStatus, 'Login filled successfully!', 'success');
            
        } catch (error) {
            console.error('Autofill failed:', error);
            this.showStatus(this.mainStatus, 'Failed to fill login', 'error');
        }
    }

    async handleViewAllPasswords() {
        // Open full password manager view (will create this later)
        this.showStatus(this.mainStatus, 'Opening password manager...', 'loading');
        setTimeout(() => {
            this.showStatus(this.mainStatus, 'Full password manager will be implemented next', 'info');
        }, 1000);
    }

    updateCurrentSiteDisplay() {
        if (this.currentTab) {
            const domain = window.ExstagiumCrypto.extractDomain(this.currentTab.url);
            this.currentSite.textContent = `Current site: ${domain}`;
        } else {
            this.currentSite.textContent = 'No active tab detected';
        }
    }

    showStatus(element, message, type) {
        element.textContent = message;
        element.className = `status ${type}`;
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                element.textContent = '';
                element.className = 'status';
            }, 3000);
        }
    }

    // Storage helpers
    async getStoredUserData() {
        const result = await chrome.storage.local.get(['userData']);
        return result.userData || null;
    }

    async setStoredUserData(userData) {
        await chrome.storage.local.set({ userData });
    }

    async getSessionData() {
        const result = await chrome.storage.session.get(['sessionData']);
        return result.sessionData || null;
    }

    async setSessionData(sessionData) {
        await chrome.storage.session.set({ sessionData });
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ExstagiumPopup();
});
