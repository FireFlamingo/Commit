# Local Encrypted Vault Implementation

This implementation provides a secure, local file-based password storage system using AES-256 encryption.

## Security Features

### Encryption
- **Algorithm**: AES-256-CBC with PKCS7 padding
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000 (prevents brute force attacks)
- **Salt**: 32-byte random salt generated per device

### Key Generation Process
1. **Device Salt**: A unique 32-byte salt is generated and stored in localStorage on first use
2. **Master Key**: Derived from `masterPassword + deviceSalt` using PBKDF2
3. **Encryption Key**: The derived key is used for AES-256 encryption/decryption

### Data Flow
```
Master Password + Device Salt → PBKDF2 (100k iterations) → AES-256 Key → Encrypt/Decrypt Vault Data
```

## File Structure

### Core Files
- `lib/local-vault.ts` - Main vault service with encryption/decryption logic
- `hooks/use-local-vault.ts` - React hook for vault state management
- `components/local-vault-manager.tsx` - UI component for vault management
- `app/local-vault/page.tsx` - Demo page

### Key Components

#### LocalVaultService
- Singleton service managing encryption/decryption
- Handles device salt generation and storage
- Provides CRUD operations for vault items

#### useLocalVault Hook
- React hook for vault state management
- Handles UI interactions and error handling
- Provides methods for unlock, lock, save, load operations

#### LocalVaultManager Component
- Complete UI for vault management
- Master password input with show/hide toggle
- Add, edit, delete password entries
- Save/load vault files using File System Access API

## Usage

### Basic Usage
```typescript
import { useLocalVault } from '@/hooks/use-local-vault'

function MyComponent() {
  const { 
    items, 
    isUnlocked, 
    unlockVault, 
    addItem, 
    saveVault 
  } = useLocalVault()

  // Unlock vault
  await unlockVault('my-master-password')

  // Add new password
  addItem('login', 'Gmail', {
    username: 'user@example.com',
    password: 'secure-password',
    url: 'https://gmail.com'
  })

  // Save to encrypted file
  await saveVault()
}
```

### File Operations
- **Save**: Downloads encrypted `.enc` file or uses File System Access API
- **Load**: Opens file picker to select encrypted vault file
- **Format**: Binary encrypted data (not human readable)

## Security Considerations

### Strengths
- ✅ AES-256 encryption (industry standard)
- ✅ Strong key derivation (PBKDF2 with 100k iterations)
- ✅ Device-specific salt (prevents rainbow table attacks)
- ✅ Local storage only (no cloud/server dependencies)
- ✅ Master password never stored

### Limitations
- ⚠️ Salt stored in localStorage (cleared if browser data is cleared)
- ⚠️ No backup/recovery mechanism for lost master password
- ⚠️ Single device usage (salt is device-specific)
- ⚠️ Requires manual file management for backups

## Browser Compatibility

### File System Access API
- ✅ Chrome 86+
- ✅ Edge 86+
- ❌ Firefox (fallback to download)
- ❌ Safari (fallback to download)

### Fallback Behavior
When File System Access API is not available:
- Save: Triggers file download
- Load: Uses standard file input picker

## Installation

1. Install dependencies:
```bash
npm install crypto-js
npm install @types/crypto-js  # if using TypeScript
```

2. Add the files to your project
3. Navigate to `/local-vault` to use the vault

## Future Enhancements

### Potential Improvements
- [ ] Multiple device sync with encrypted cloud storage
- [ ] Backup/recovery mechanisms
- [ ] Password strength analysis
- [ ] Auto-lock after inactivity
- [ ] Biometric authentication integration
- [ ] Import/export from other password managers
- [ ] Secure password sharing
- [ ] Audit logs for access tracking

### Advanced Security Features
- [ ] Hardware security module (HSM) integration
- [ ] Zero-knowledge architecture
- [ ] Forward secrecy
- [ ] Secure enclaves for key storage
- [ ] Multi-factor authentication for vault access