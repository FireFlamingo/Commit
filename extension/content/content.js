// content/content.js - EXSTAGIUM Form Detection Content Script

class ExstagiumFormDetector {
    constructor() {
        this.loginForms = [];
        this.registerForms = [];
        this.passwordFields = [];
        
        this.init();
    }

    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'detectForms') {
                this.detectAllForms();
                sendResponse({
                    forms: {
                        login: this.loginForms,
                        register: this.registerForms,
                        passwordFields: this.passwordFields
                    }
                });
            } else if (request.action === 'fillLogin') {
                this.fillLoginForm(request.credentials);
                sendResponse({ success: true });
            } else if (request.action === 'generatePassword') {
                this.generateAndFillPassword(request.password);
                sendResponse({ success: true });
            }
        });

        // Detect forms on page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.detectAllForms());
        } else {
            this.detectAllForms();
        }

        // Re-detect forms when DOM changes (for SPAs)
        this.observeFormChanges();
    }

    detectAllForms() {
        this.loginForms = [];
        this.registerForms = [];
        this.passwordFields = [];

        // Find all forms on the page
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            this.analyzeForm(form);
        });

        // Also check for password fields outside forms
        this.detectStandaloneFields();

        console.log('EXSTAGIUM: Detected forms:', {
            login: this.loginForms.length,
            register: this.registerForms.length,
            passwordFields: this.passwordFields.length
        });
    }

    analyzeForm(form) {
        const formData = {
            element: form,
            action: form.action,
            method: form.method,
            fields: {
                email: [],
                username: [],
                password: [],
                confirmPassword: []
            },
            buttons: {
                submit: [],
                login: [],
                register: []
            }
        };

        // Find input fields
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            this.categorizeInput(input, formData.fields);
        });

        // Find buttons
        const buttons = form.querySelectorAll('button, input[type="submit"]');
        buttons.forEach(button => {
            this.categorizeButton(button, formData.buttons);
        });

        // Determine form type based on analysis
        if (this.isLoginForm(formData)) {
            this.loginForms.push(formData);
        } else if (this.isRegisterForm(formData)) {
            this.registerForms.push(formData);
        }
    }

    categorizeInput(input, fields) {
        const type = input.type.toLowerCase();
        const name = input.name.toLowerCase();
        const id = input.id.toLowerCase();
        const placeholder = input.placeholder.toLowerCase();
        const autocomplete = input.autocomplete.toLowerCase();

        // Email fields
        if (type === 'email' || 
            name.includes('email') || 
            id.includes('email') ||
            placeholder.includes('email') ||
            autocomplete.includes('email')) {
            fields.email.push(input);
        }

        // Username fields
        else if (name.includes('username') || 
                 name.includes('user') ||
                 id.includes('username') ||
                 id.includes('user') ||
                 placeholder.includes('username') ||
                 placeholder.includes('user') ||
                 autocomplete.includes('username')) {
            fields.username.push(input);
        }

        // Password fields
        if (type === 'password') {
            if (name.includes('confirm') || 
                id.includes('confirm') ||
                placeholder.includes('confirm') ||
                name.includes('repeat') ||
                id.includes('repeat')) {
                fields.confirmPassword.push(input);
            } else {
                fields.password.push(input);
            }
            
            this.passwordFields.push(input);
        }
    }

    categorizeButton(button, buttons) {
        const text = (button.textContent || button.value || '').toLowerCase();
        const name = button.name.toLowerCase();
        const id = button.id.toLowerCase();

        buttons.submit.push(button);

        if (text.includes('log in') || 
            text.includes('login') || 
            text.includes('sign in') ||
            name.includes('login') ||
            id.includes('login')) {
            buttons.login.push(button);
        }

        if (text.includes('register') || 
            text.includes('sign up') || 
            text.includes('create account') ||
            text.includes('join') ||
            name.includes('register') ||
            id.includes('register')) {
            buttons.register.push(button);
        }
    }

    isLoginForm(formData) {
        const hasPassword = formData.fields.password.length > 0;
        const hasEmailOrUsername = formData.fields.email.length > 0 || formData.fields.username.length > 0;
        const hasLoginButton = formData.buttons.login.length > 0;
        const noConfirmPassword = formData.fields.confirmPassword.length === 0;

        // Login forms typically have:
        // - 1 password field (no confirm)
        // - Email or username field
        // - Login-related button or action
        return hasPassword && hasEmailOrUsername && noConfirmPassword && 
               (hasLoginButton || formData.action.includes('login'));
    }

    isRegisterForm(formData) {
        const hasPassword = formData.fields.password.length > 0;
        const hasEmail = formData.fields.email.length > 0;
        const hasConfirmPassword = formData.fields.confirmPassword.length > 0;
        const hasRegisterButton = formData.buttons.register.length > 0;

        // Register forms typically have:
        // - Password field
        // - Email field
        // - Confirm password field OR register button
        return hasPassword && hasEmail && 
               (hasConfirmPassword || hasRegisterButton || formData.action.includes('register'));
    }

    detectStandaloneFields() {
        // Find password fields not in forms (some sites use divs)
        const standalonePasswords = document.querySelectorAll('input[type="password"]:not(form input)');
        standalonePasswords.forEach(field => {
            if (!this.passwordFields.includes(field)) {
                this.passwordFields.push(field);
            }
        });
    }

    fillLoginForm(credentials) {
        if (this.loginForms.length === 0) {
            console.warn('EXSTAGIUM: No login forms found');
            return;
        }

        const form = this.loginForms[0]; // Use first login form found

        // Fill email/username
        const emailField = form.fields.email[0] || form.fields.username[0];
        if (emailField && credentials.username) {
            this.fillField(emailField, credentials.username);
        }

        // Fill password
        const passwordField = form.fields.password[0];
        if (passwordField && credentials.password) {
            this.fillField(passwordField, credentials.password);
        }

        // Highlight filled form
        this.highlightForm(form.element, 'login');
    }

    generateAndFillPassword(generatedPassword) {
        if (this.registerForms.length === 0) {
            console.warn('EXSTAGIUM: No registration forms found');
            return;
        }

        const form = this.registerForms[0]; // Use first register form found

        // Fill password fields
        form.fields.password.forEach(field => {
            this.fillField(field, generatedPassword);
        });

        // Fill confirm password fields
        form.fields.confirmPassword.forEach(field => {
            this.fillField(field, generatedPassword);
        });

        // Highlight filled form
        this.highlightForm(form.element, 'register');
    }

    fillField(field, value) {
        // Set value
        field.value = value;

        // Trigger events that websites might listen to
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));

        // For React/Vue apps
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(field, value);
        field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    highlightForm(formElement, type) {
        const color = type === 'login' ? '#4CAF50' : '#2196F3';
        
        formElement.style.border = `2px solid ${color}`;
        formElement.style.borderRadius = '4px';
        formElement.style.transition = 'all 0.3s ease';

        // Remove highlight after 3 seconds
        setTimeout(() => {
            formElement.style.border = '';
            formElement.style.borderRadius = '';
        }, 3000);
    }

    observeFormChanges() {
        // Watch for dynamically added forms (SPAs)
        const observer = new MutationObserver((mutations) => {
            let shouldRedetect = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'FORM' || 
                                node.querySelector && node.querySelector('form')) {
                                shouldRedetect = true;
                            }
                        }
                    });
                }
            });

            if (shouldRedetect) {
                setTimeout(() => this.detectAllForms(), 1000);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize form detector when script loads
new ExstagiumFormDetector();

// Add EXSTAGIUM indicator to page
const indicator = document.createElement('div');
indicator.id = 'exstagium-indicator';
indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 999999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-family: monospace;
    opacity: 0.7;
    pointer-events: none;
`;
indicator.textContent = '🔐 EXSTAGIUM';
document.body.appendChild(indicator);

// Hide indicator after 3 seconds
setTimeout(() => {
    if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}, 3000);
